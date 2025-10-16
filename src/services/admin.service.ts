import connection from "../config/db.ts";
import { userModel } from "../models/index.ts";
import { v4 as uuidv4 } from "uuid";
// mã hoá password
import { hashPassword } from "../utils/password.ts";

// get all user
const adminGetAllUser = async (): Promise<userModel.User[] | null> => {
  const [rows] = await connection.query<userModel.User[]>(
    "SELECT * FROM users"
  );

  return rows;
};

const adminGetUserById = async (
  user_id: string
): Promise<userModel.User | null> => {
  const [rows] = await connection.query<userModel.User[]>(
    "SELECT * FROM users WHERE id = ?",
    [user_id]
  );
  return rows[0];
};

const adminCreateUser = async (
  user: userModel.AdminCreateUserInput
): Promise<void> => {
  if (!user.full_name || !user.password || !user.role) {
    throw new Error(
      "Thiếu thông tin bắt buộc (full_name, email, password, role)"
    );
  }

  const [exist] = await connection.query<userModel.User[]>(
    "SELECT id FROM users WHERE email = ? OR student_id = ?",
    [user.email, user.student_id || null]
  );
  if (exist.length > 0) {
    throw new Error("Email hoặc mã sinh viên đã tồn tại trong hệ thống");
  }

  const passwordHashed = await hashPassword(user.password);

  const id = uuidv4();

  await connection.query(
    `
      INSERT INTO users (
        id,
        student_id,
        full_name,
        email,
        password,
        phone,
        role,
        status,
        avatar_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      user.student_id || null,
      user.full_name,
      user.email,
      passwordHashed,
      user.phone || null,
      user.role,
      user.status || "ACTIVE",
      user.avatar_url || null,
    ]
  );
};

const adminUpdateUserById = async (
  user_id: string,
  user: userModel.AdminUserUpdate
): Promise<void> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (user.full_name !== undefined) {
    fields.push("full_name = ?");
    values.push(user.full_name);
  }

  // cái này có cần thiết không nhỉ ?
  if (user.email !== undefined) {
    const [emailCheck] = await connection.query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [user.email, user_id]
    );
    if ((emailCheck as any[]).length > 0) {
      throw new Error("Email này đã tồn tại trong hệ thống");
    }

    fields.push("email = ?");
    values.push(user.email);
  }

  if (user.password !== undefined) {
    const hashed = await hashPassword(user.password);
    fields.push("password = ?");
    values.push(hashed);
  }

  if (user.phone !== undefined) {
    fields.push("phone = ?");
    values.push(user.phone);
  }

  if (user.role !== undefined) {
    fields.push("role = ?");
    values.push(user.role);
  }

  if (user.status !== undefined) {
    fields.push("status = ?");
    values.push(user.status);
  }

  if (user.avatar_url !== undefined) {
    fields.push("avatar_url = ?");
    values.push(user.avatar_url);
  }

  // không có fields nào thì khỏi query
  if (!fields.length) return;

  const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
  values.push(user_id);

  await connection.query(sql, values);
};

// xoá user bằng id
const adminDeleteUserById = async (user_id: string): Promise<void> => {
  const [rows] = await connection.query("SELECT id FROM users WHERE id = ?", [
    user_id,
  ]);
  if (!(rows as any[]).length) {
    throw new Error("Không tìm thấy người dùng cần xoá");
  }

  await connection.query("DELETE FROM users WHERE id = ?", [user_id]);
};

const adminServices = {
  adminGetAllUser,
  adminGetUserById,
  adminCreateUser,
  adminUpdateUserById,
  adminDeleteUserById,
};

export default adminServices;
