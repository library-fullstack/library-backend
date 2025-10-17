import { userModel } from "../models/index.ts";
import userServices from "./user.service.ts";
import { signToken } from "../utils/jwt.ts";
import { verifyPassword, hashPassword } from "../utils/password.ts";
import { sendMail } from "../utils/mailer.ts";
import { sendSMS } from "../utils/sms.ts";
import connection from "../config/db.ts";
import { v4 as uuidv4 } from "uuid";

// đăng ký
const register = async (
  user: userModel.StudentRegisterInput
): Promise<{ message: string }> => {
  // kiểm tra mã sinh viên có tồn tại hay không
  // mã sinh phải có để tiếp tục vì phạm vi của dự án là trường học
  // chỉ có sinh viên trong trường học mới có thể đăng ký
  if (!user.student_id) {
    throw new Error("Mã sinh viên là bắt buộc khi đăng ký.");
  }

  // lấy dữ liệu của sinh viên có mã sinh viên được dùng để đang ký
  const [students] = await connection.query<userModel.User[]>(
    `SELECT student_id, full_name, email, phone 
     FROM students WHERE student_id = ? AND status = 'ACTIVE' LIMIT 1`,
    [user.student_id]
  );

  // kiểm tra xem khi query với student_id thì có dữ liệu của sinh viên đó trả về hay không
  // nếu không có thì 1 là sinh viên đó bị BAN / INACTIVE hoặc mã sinh viên bị sai và sinh
  // viên đó không phải là sinh viên của trường
  const student = students[0];
  if (!student) {
    throw new Error(
      "Mã sinh viên không tồn tại trong hệ thống hoặc đã ngừng hoạt động."
    );
  }

  // có trong cơ sở dữ liệu rồi thì tức là sinh viên này đã từng đăng ký tài khoản thư viện rồi
  const existUser = await userServices.getUserByStudentId(user.student_id);
  if (existUser) {
    throw new Error("Tài khoản đã được đăng ký trước đó.");
  }

  // mã hoá mật khẩu
  const hashed = await hashPassword(user.password);

  // query thêm sinh viên vào cơ sở dữ liệu của thư viện
  await connection.query(
    `
    INSERT INTO users (id, student_id, full_name, email, phone, password, role, status)
    VALUES (?, ?, ?, ?, ?, ?, 'STUDENT', 'ACTIVE')
    `,
    [
      uuidv4(), // id của người dùng đã được random với UUID
      student.student_id,
      student.full_name,
      student.email,
      student.phone,
      hashed,
    ]
  );

  // trả về message ở API
  return { message: "Đăng ký thành công. Bạn có thể đăng nhập ngay." };
};

// đăng nhập
const login = async (
  identifier: string, // ủa bên front-end để là student_id thì nếu admin đăng nhập thì đăng nhập kiểu gì nhỉ ?
  password: string
): Promise<{ user: any; token: string }> => {
  // query email / studentId để check xem tài khoản có tồn tại hay không
  const user =
    (await userServices.getUserByEmail(identifier)) ||
    (await userServices.getUserByStudentId(identifier));

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

  // lấy token jwt để xác minh đăng nhập
  const token = signToken({ user_id: user.id, role: user.role });

  //  lấy thông tin sinh viên đó dựa vào bảng students (cơ sở dữ liệu của trường)
  //  tuy nhiên vấn đề bây giờ là cái bảng student này nếu mà lấy dữ liệu ra thì rất phiền
  //  bởi vì phải join bảng...
  //  quá phức tạp ...
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

  // cuối cùng trả về sinh viên đó kèm theo token
  return { user: fullUser, token };
};

// tạo cái mã OTP 6 số
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// quên mật khẩu
export const forgotPassword = async (identifier: string, channel = "EMAIL") => {
  // check user đang quên mật khẩu xem có tồn tại không.
  const [users] = await connection.query<userModel.User[]>(
    "SELECT id, full_name, email, phone FROM users WHERE email = ? OR student_id = ?",
    [identifier, identifier]
  );

  // không tồn tại thì không báo là không tồn tại, mà chỉ báo một nửa thông tin.
  const user = users[0];
  if (!user) {
    return { message: "Nếu tài khoản tồn tại, mã khôi phục đã được gửi." };
  }

  // tạo mã OTP xác minh từ hàm tạo mã OTP
  const code = generateCode();
  // thời gian hết hạn có mã OTP đó
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // thêm vào bảng xác minh người dùng (lưu tạm)
  await connection.query(
    `INSERT INTO user_verifications (id, user_id, vtype, channel, code, expires_at)
     VALUES (?, ?, 'PASSWORD_RESET', ?, ?, ?)`,
    [uuidv4(), user.id, channel, code, expiresAt]
  );

  // subject của mail gửi đến email của người dùng
  const subject = "Mã khôi phục mật khẩu - UNETI Library";
  // phần thân của mail sẽ có mã OTP
  const html = `
    <p>Xin chào <b>${user.full_name || "bạn"}</b>,</p>
    <p>Mã OTP khôi phục mật khẩu của bạn là: <b>${code}</b></p>
    <p>Mã sẽ hết hạn sau 10 phút.</p>
  `;

  // tạo mã xác minh và gửi SMS về số điện thoại đã đăng ký.
  // CHƯA LÀM XÁC MINH QUA SỐ ĐIỆN THOẠI
  const smsText = `Mã OTP khôi phục mật khẩu của bạn là: ${code}. Mã sẽ hết hạn sau 10 phút.`;

  // kiểm tra xem cách xác minh là qua email hay qua SMS hay là chơi cả hai
  try {
    if (channel === "EMAIL" && user.email) {
      await sendMail(user.email, subject, html);
    } else if (channel === "SMS" && user.phone) {
      await sendSMS(user.phone, smsText);
    } else if (channel === "BOTH") {
      if (user.email) await sendMail(user.email, subject, html);
      if (user.phone) await sendSMS(user.phone, smsText);
    } else {
      console.warn(`[WARN] Không thể gửi OTP, user không có email hoặc phone`);
    }
  } catch (err) {
    console.error("[OTP Send Error]", err);
    throw new Error("Không thể gửi mã OTP, vui lòng thử lại.");
  }

  // trả về message API
  return { message: "Mã khôi phục mật khẩu đã được gửi." };
};

// thay đổi mật khẩu
const resetPassword = async (
  identifier: string,
  code: string,
  newPassword: string
) => {
  // kiểm tra xem tài khoản có tồn tại hay không để đổi mật khẩu
  const [users] = await connection.query<userModel.User[]>(
    "SELECT id FROM users WHERE email = ? OR student_id = ?",
    [identifier, identifier]
  );
  // không tồn tại thì lướt
  const user = users[0];
  if (!user) throw new Error("Tài khoản không tồn tại.");

  // check xem mã OTP người dùng nhập và thời gian hết hạn. nếu ok thì đổi mật khẩu
  const [rows] = await connection.query<userModel.User[]>(
    `
    SELECT * FROM user_verifications
    WHERE user_id = ? AND vtype = 'PASSWORD_RESET' AND code = ?
      AND consumed_at IS NULL AND expires_at > NOW()
    ORDER BY created_at DESC LIMIT 1
    `,
    [user.id, code]
  );

  // nếu không thì lướt
  const verify = rows[0];
  if (!verify) throw new Error("Mã xác minh không hợp lệ hoặc đã hết hạn.");

  // mã hoá mật khẩu
  const hashed = await hashPassword(newPassword);

  // đổi mật khẩu
  await connection.query("UPDATE users SET password = ? WHERE id = ?", [
    hashed,
    user.id,
  ]);

  // lưu thời điểm đổi mật khẩu
  await connection.query(
    "UPDATE user_verifications SET consumed_at = NOW() WHERE id = ?",
    [verify.id]
  );

  // trả về message API
  return { message: "Đặt lại mật khẩu thành công." };
};

// xuất các hàm
export const authService = { register, login, forgotPassword, resetPassword };
