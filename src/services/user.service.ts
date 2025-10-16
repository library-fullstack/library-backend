import connection from "../config/db.ts";
import { userModel } from "../models/index.ts";
import { v4 as uuidv4 } from "uuid";
// mã hoá password
import { hashPassword } from "../utils/password.ts";

// get user bằng id
const getUserById = async (user_id: string): Promise<userModel.User | null> => {
  const [rows] = await connection.query<userModel.User[]>(
    "SELECT * FROM users WHERE id = ?",
    [user_id]
  );
  return rows[0];
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
  return rows.length ? rows[0] : null;
};

// tạo user mới
const createUser = async (
  user: userModel.StudentRegisterInput
): Promise<void> => {
  // check student_id
  const [existStudentId] = await connection.query<userModel.User[]>(
    "SELECT id FROM users WHERE student_id = ?",
    [user.student_id]
  );
  if (existStudentId.length > 0)
    throw new Error("Mã sinh viên đã được đăng ký");

  // tạo id bằng uuid luôn
  const id = uuidv4();

  if (!user.password) {
    throw new Error("Thiếu mật khẩu");
  }
  const passwordHashed = await hashPassword(user.password);

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
  const fields: string[] = [];
  const values: any[] = [];

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

  const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
  values.push(user_id);

  await connection.query(sql, values);
};

const userServices = {
  createUser,
  getUserById,
  updateUserById,
  getUserByEmail,
  getUserByStudentId,
};

export default userServices;
