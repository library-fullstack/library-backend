import connection from "../config/db.ts";
import { userModel } from "../models/index.ts";
import { v4 as uuidv4 } from "uuid";
// mã hoá password
import { verifyPassword, hashPassword } from "../utils/password.ts";
import { cache } from "../config/redis.ts";

// get user bằng id
const getUserById = async (user_id: string) => {
  const [rows] = await connection.query(
    `
    SELECT 
      u.id,
      u.student_id,
      u.full_name,
      u.email,
      u.role,
      u.phone,
      u.avatar_url,
      u.created_at,
      s.class_name,
      s.faculty,
      s.major,
      s.admission_year
    FROM users u
    LEFT JOIN students s ON s.student_id = u.student_id
    WHERE u.id = ?
    `,
    [user_id]
  );
  return (rows as any)[0] || null;
};

// get user bằng email
const getUserByEmail = async (
  email: string
): Promise<userModel.User | null> => {
  const [rows] = await connection.query<userModel.User[]>(
    `SELECT * FROM users WHERE email = ?`,
    [email]
  );
  return rows[0];
};

// get user bằng studentId
const getUserByStudentId = async (
  student_id: string
): Promise<userModel.User | null> => {
  const [rows] = await connection.query<userModel.User[]>(
    `SELECT * FROM users WHERE student_id = ?`,
    [student_id]
  );
  return rows[0];
};

// tạo user mới
const createUser = async (
  user: userModel.StudentRegisterInput
): Promise<void> => {
  // check student_id xem có tồn tại hay không
  const [existStudentId] = await connection.query<userModel.User[]>(
    "SELECT id FROM users WHERE student_id = ?",
    [user.student_id]
  );

  // nếu tồn tại tại thì không cho tạo
  if (existStudentId.length > 0)
    throw new Error("Mã sinh viên đã được đăng ký");

  // tạo id bằng uuid luôn
  const id = uuidv4();

  // check ràng buộc
  if (!user.password) {
    throw new Error("Thiếu mật khẩu");
  }
  const passwordHashed = await hashPassword(user.password);

  // thêm thông tin tài khoản mới vào cơ sở dữ liệu
  await connection.query(
    "INSERT INTO users (id, student_id, password, role) VALUES (?, ?, ?, ?)",
    [id, user.student_id, passwordHashed, user.role]
  );
};

// update user bằng id
const updateUserById = async (
  user_id: string,
  user: Pick<userModel.UserUpdate, "password" | "phone" | "avatar_url">
): Promise<void> => {
  // tạo field để lưu câu trường cần thay đổi trong database
  const fields: string[] = [];

  // tạo values chính là giá trị muốn thay đô
  const values: any[] = [];

  // check có thay đổi cái thông tin nào không, nếu không thì không cần phải truy vấn
  // cái này để truy vấn chỉ cái cần thiết, không phải truy vấn tất cả mọi thứ
  if (user.password !== undefined) {
    const hashed = await hashPassword(user.password);
    fields.push("password = ?");
    values.push(hashed);
  }

  if (user.phone !== undefined) {
    fields.push("phone = ?");
    values.push(user.phone);
  }

  if (user.avatar_url !== undefined) {
    fields.push("avatar_url = ?");
    values.push(user.avatar_url);
  }

  // không có field nào cần update thì bỏ qua
  if (!fields.length) return;

  // update theo cái fields và values bên trên.
  const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
  values.push(user_id);

  // chạy query
  await connection.query(sql, values);
};
const checkCurrentPassword = async (userId: string, password: string) => {
  if (!userId || !password) throw new Error("Thiếu thông tin xác minh.");

  const [rows] = await connection.query(
    "SELECT password FROM users WHERE id = ?",
    [userId]
  );
  const user = (rows as any)[0];
  if (!user) throw new Error("Không tìm thấy người dùng.");

  const valid = await verifyPassword(password, user.password);
  if (!valid) throw new Error("Mật khẩu hiện tại không đúng.");

  return { message: "Mật khẩu hợp lệ." };
};

const changePasswordWithOtp = async (
  userId: string,
  old_password: string,
  new_password: string,
  otp_code: string
) => {
  if (!userId || !old_password || !new_password || !otp_code)
    throw new Error("Thiếu thông tin cần thiết.");

  const [users] = await connection.query(
    "SELECT password FROM users WHERE id = ?",
    [userId]
  );
  const user = (users as any)[0];
  if (!user) throw new Error("Không tìm thấy người dùng.");

  const ok = await verifyPassword(old_password, user.password);
  if (!ok) throw new Error("Mật khẩu hiện tại không đúng.");

  const [rows] = await connection.query(
    `
    SELECT id FROM user_verifications
    WHERE user_id = ?
      AND vtype = 'CHANGE_PASSWORD'
      AND code = ?
      AND consumed_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `,
    [userId, otp_code]
  );

  const record = (rows as any)[0];
  if (!record) throw new Error("Mã xác minh không hợp lệ hoặc đã hết hạn.");

  const hashed = await hashPassword(new_password);
  await connection.query("UPDATE users SET password = ? WHERE id = ?", [
    hashed,
    userId,
  ]);
  await connection.query(
    "UPDATE user_verifications SET consumed_at = NOW() WHERE id = ?",
    [record.id]
  );

  return { message: "Đổi mật khẩu thành công." };
};

export const confirmStudentInfo = async (data: {
  token: string;
  full_name: string;
  email: string;
  phone: string;
}) => {
  if (!data.token) throw new Error("Thiếu token xác nhận.");

  const cacheKey = `register:${data.token}`;
  const cachedData = await cache.get<{
    hashed: string;
    student_id: string;
    expires: number;
  }>(cacheKey);

  if (!cachedData) throw new Error("Token không hợp lệ hoặc đã hết hạn.");

  if (Date.now() > cachedData.expires) {
    await cache.del(cacheKey);
    throw new Error("Token đã hết hạn, vui lòng đăng ký lại.");
  }

  const existUser = await getUserByStudentId(cachedData.student_id);
  if (existUser) throw new Error("Tài khoản đã được tạo trước đó.");

  const name = data.full_name?.trim();
  if (!name || !/^[A-Za-zÀ-ỹ\s]{3,50}$/.test(name)) {
    throw new Error("Tên không hợp lệ.");
  }

  const email = data.email?.trim();
  if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(email)) {
    throw new Error("Email không hợp lệ.");
  }

  const phone = data.phone?.trim();
  if (!/^0\d{9}$/.test(phone)) {
    throw new Error("Số điện thoại không hợp lệ.");
  }

  await connection.query(
    `
    INSERT INTO users (id, student_id, full_name, email, phone, password, role, status)
    VALUES (?, ?, ?, ?, ?, ?, 'STUDENT', 'ACTIVE')
    `,
    [uuidv4(), cachedData.student_id, name, email, phone, cachedData.hashed]
  );

  await cache.del(cacheKey);
  return { message: "Đăng ký hoàn tất thành công." };
};

// xuất phát hết luôn
const userServices = {
  createUser,
  getUserById,
  updateUserById,
  getUserByEmail,
  getUserByStudentId,
  checkCurrentPassword,
  changePasswordWithOtp,
  confirmStudentInfo,
};

export default userServices;
