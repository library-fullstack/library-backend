import { userModel } from "../models/index.ts";
import userServices from "./user.service.ts";
import { signToken } from "../utils/jwt.ts";
import {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  verifyRefreshTokenExists,
  revokeRefreshToken,
  revokeAllRefreshTokens,
} from "../utils/token.ts";
import { verifyPassword, hashPassword } from "../utils/password.ts";
import { sendPasswordResetEmail } from "../utils/emailTemplates.ts";
import connection from "../config/db.ts";
import { requireEnv } from "../config/env.ts";
import { v4 as uuidv4 } from "uuid";
import { sendMail } from "../utils/mailer.ts";
import crypto from "crypto";
import { cache } from "../config/redis.ts";

const register = async (user: userModel.StudentRegisterInput) => {
  if (!user.student_id) throw new Error("Mã sinh viên là bắt buộc.");

  const [students] = await connection.query<userModel.User[]>(
    `SELECT student_id, full_name, email, phone
     FROM students
     WHERE student_id = ? AND status = 'ACTIVE'
     LIMIT 1`,
    [user.student_id]
  );

  const student = students[0];
  if (!student) {
    throw new Error("Mã sinh viên không tồn tại hoặc đã ngừng hoạt động.");
  }

  const existUser = await userServices.getUserByStudentId(user.student_id);
  if (existUser) throw new Error("Tài khoản đã được đăng ký trước đó.");

  // hash mật khẩu
  const hashed = await hashPassword(user.password);

  // tạo token tạm thời và lưu vào Redis
  const token = crypto.randomBytes(32).toString("hex");
  const cacheKey = `register:${token}`;
  await cache.set(
    cacheKey,
    {
      hashed,
      student_id: student.student_id || "",
      expires: Date.now() + 5 * 60 * 1000,
    },
    300
  );

  // kiểm tra cấu hình admin đang set
  const [settings] = await connection.query<any[]>(
    "SELECT setting_value FROM system_settings WHERE setting_key = 'allow_student_info_edit' LIMIT 1"
  );
  const settingValue = settings[0]?.setting_value;
  const allowEdit =
    settingValue === "1" || settingValue === "true" || settingValue === true;

  // nếu allowEdit = false, tạo user ngay
  if (!allowEdit) {
    await connection.query(
      `
      INSERT INTO users (id, student_id, full_name, email, phone, password, role, status)
      VALUES (?, ?, ?, ?, ?, ?, 'STUDENT', 'ACTIVE')
      `,
      [
        uuidv4(),
        student.student_id,
        student.full_name,
        student.email,
        student.phone,
        hashed,
      ]
    );

    return {
      message: "Đăng ký thành công!",
      require_info_confirm: false,
    };
  }

  // nếu allowEdit = true, trả về token để confirm
  return {
    message: "Xác nhận thông tin trước khi hoàn tất đăng ký.",
    require_info_confirm: true,
    token: token,
    user_preview: {
      student_id: student.student_id,
      full_name: student.full_name,
      email: student.email,
      phone: student.phone,
    },
  };
};

// đăng nhập
const login = async (
  identifier: string,
  password: string
): Promise<{ user: any; accessToken: string; refreshToken: string }> => {
  // query email OR student_id (một lần, có index) để kiểm tra tài khoản
  const [userRows] = await connection.query<any[]>(
    `SELECT * FROM users WHERE email = ? OR student_id = ? LIMIT 1`,
    [identifier, identifier]
  );
  const user = userRows[0];

  // không tồn tại thì lượn
  if (!user) {
    throw new Error("Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.");
  }

  // lấy mật khẩu đó và mã hoá nó xem có giống mật khẩu đã được mã hoá trên cơ sở dữ liệu hay không
  const valid = await verifyPassword(password, user.password);

  // không phải thì lượn
  if (!valid) {
    throw new Error("Sai mật khẩu. Vui lòng thử lại.");
  }

  // check trạng thái của tài khoản. nếu active tức là bình thường
  // nếu bị BANED hoặc bị INACTIVE thì không cho đăng nhập
  if (user.status !== "ACTIVE") {
    const msg =
      user.status === "BANNED"
        ? "Tài khoản của bạn đã bị khóa vĩnh viễn."
        : "Tài khoản của bạn chưa được kích hoạt hoặc đang bị tạm khóa.";
    throw new Error(msg);
  }

  //  lấy thông tin sinh viên đó dựa vào bảng students (cơ sở dữ liệu của trường)

  const [rows] = await connection.query<any[]>(
    `
    SELECT 
      u.id,
      u.student_id,
      u.full_name,
      u.email,
      u.phone,
      u.role,
      u.status,
      u.avatar_url,
      s.class_name,
      s.faculty,
      s.major,
      s.admission_year
    FROM users u
    LEFT JOIN students s ON u.student_id = s.student_id
    WHERE u.id = ?
    `,
    [user.id]
  );

  // check xem có lấy được thông tin sinh viên hay không..
  const fullUser = rows[0];
  if (!fullUser) {
    throw new Error("Không thể lấy thông tin người dùng.");
  }

  await revokeAllRefreshTokens(user.id);

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  console.log("[auth.service] Creating tokens for user:", {
    userId: user.id,
    email: user.email,
  });

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await storeRefreshToken(user.id, refreshToken, expiresAt);

  // cuối cùng trả về sinh viên đó kèm theo tokens
  return { user: fullUser, accessToken, refreshToken };
};

// tạo cái mã OTP 6 số
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const forgotPassword = async (email: string) => {
  const [users] = await connection.query<userModel.User[]>(
    "SELECT id, full_name, email FROM users WHERE email = ?",
    [email]
  );

  const user = users[0];

  if (!user) {
    console.log("[Forgot Password] Email not found:", email);
    return {
      message:
        "Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư.",
    };
  }

  // tạo token trong 15 phút
  const jwt = await import("jsonwebtoken");
  const resetToken = jwt.default.sign(
    { user_id: user.id, type: "PASSWORD_RESET" },
    requireEnv("JWT_SECRET"),
    { expiresIn: "15m" }
  );

  console.log(
    "[Forgot Password] Token created for user:",
    user.email,
    "at",
    new Date().toISOString()
  );

  // link reset password
  const frontendUrlsRaw =
    process.env.FRONTEND_URLS ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173";
  const frontendUrls = frontendUrlsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const frontendUrl =
    frontendUrls.find((url) => url.includes("libsys.me")) || frontendUrls[0];
  const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

  // email template với category
  await sendPasswordResetEmail(user.email, user.full_name || "bạn", resetLink);

  return {
    message:
      "Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư.",
  };
};

// đổi mật khẩu
const resetPassword = async (token: string, newPassword: string) => {
  const jwt = await import("jsonwebtoken");
  let decoded: any;

  try {
    // giải mã token
    decoded = jwt.default.verify(token, requireEnv("JWT_SECRET"));
    // log thôi
    console.log("[Reset Password] Token decoded successfully:", {
      user_id: decoded.user_id,
      type: decoded.type,
      iat: new Date(decoded.iat * 1000).toISOString(),
      exp: new Date(decoded.exp * 1000).toISOString(),
      now: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[JWT Verify Error]", {
      name: err.name,
      message: err.message,
      expiredAt: err.expiredAt ? new Date(err.expiredAt).toISOString() : "N/A",
    });

    // token hết hạn thì trả về lỗi
    if (err.name === "TokenExpiredError") {
      throw new Error(
        "Liên kết đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới."
      );
    }
    // hoặc báo liên kết không hợp lệ
    throw new Error("Liên kết không hợp lệ.");
  }

  // giải mã mà sai thì cũng trả về lỗi
  if (!decoded.user_id || decoded.type !== "PASSWORD_RESET") {
    throw new Error("Liên kết không hợp lệ.");
  }

  // userid
  const userId = decoded.user_id;
  // mật khẩu đã mã hoá
  const hashed = await hashPassword(newPassword);

  // truy vấn thay đổi mật khẩu
  await connection.query("UPDATE users SET password = ? WHERE id = ?", [
    hashed,
    userId,
  ]);

  // trả về message api
  return { message: "Đặt lại mật khẩu thành công." };
};

const sendOtp = async (
  userId: string,
  vtype: "CHANGE_PASSWORD" | "PASSWORD_RESET" = "CHANGE_PASSWORD"
) => {
  const [users] = await connection.query<userModel.User[]>(
    "SELECT id, full_name, email FROM users WHERE id = ? LIMIT 1",
    [userId]
  );
  const user = users[0];
  if (!user) throw new Error("Không tìm thấy người dùng.");

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await connection.query(
    `INSERT INTO user_verifications (id, user_id, vtype, channel, code, expires_at)
     VALUES (?, ?, ?, 'EMAIL', ?, ?)`,
    [uuidv4(), user.id, vtype, code, expiresAt]
  );

  const subject = "Mã xác minh thay đổi mật khẩu - UNETI Library";
  const html = `
  <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color:#f8fafc; padding:32px;">
    <div style="max-width:520px; margin:auto; background-color:#ffffff; border-radius:16px;
      box-shadow:0 4px 20px rgba(0,0,0,0.08); padding:32px 40px;">
      <h2 style="color:#4F46E5; text-align:center; font-size:22px; margin-bottom:24px;">
        Xác minh thay đổi mật khẩu
      </h2>
      <p style="font-size:15px; color:#334155; margin:0 0 8px;">Xin chào <b>${user.full_name}</b>,</p>
      <p style="font-size:15px; color:#334155; margin:0 0 12px;">Mã OTP của bạn là:</p>
      <div style="text-align:center; font-size:36px; font-weight:700; 
        letter-spacing:6px; color:#4F46E5; margin:16px 0;">${code}</div>
      <p style="font-size:14px; color:#64748B; line-height:1.6;">
        Mã có hiệu lực trong <b>10 phút</b>. Nếu không phải bạn yêu cầu, hãy bỏ qua email này.
      </p>
    </div>
    <p style="text-align:center; font-size:12px; color:#94a3b8; margin-top:20px;">
      © 2025 HBH Library System
    </p>
  </div>
`;

  await sendMail(user.email, subject, html, "change-password");
  return { message: "Mã xác minh đã được gửi tới email của bạn." };
};

// xuất các hàm
export const authService = {
  register,
  login,
  forgotPassword,
  resetPassword,
  sendOtp,
};
