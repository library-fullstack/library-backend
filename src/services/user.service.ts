import connection from "../config/db.ts";
import { User, UserInput, UserUpdate } from "../models/user.model.ts";

const getAllUser = async (): Promise<User[] | null> => {
  const [rows] = await connection.query<User[]>("SELECT * FROM users");

  return rows.length ? rows : null;
};

// get user bằng id
const getUserById = async (userId: string): Promise<User | null> => {
  const [rows] = await connection.query<User[]>(
    "SELECT * FROM users WHERE id = ?",
    [userId]
  );
  return rows.length ? rows[0] : null;
};

// tạo user mới
const createUser = async (user: UserInput): Promise<void> => {
  // check studentId
  const [existStudentId] = await connection.query<User[]>(
    "SELECT id FROM users WHERE studentId = ?",
    [user.studentId]
  );

  if (existStudentId.length > 0) {
    throw new Error("Mã sinh viên đã được đăng ký");
  }

  // check mail
  const [existEmail] = await connection.query<User[]>(
    "SELECT id FROM users WHERE email = ?",
    [user.email]
  );

  if (existEmail.length > 0) {
    throw new Error("Email đã được đăng ký");
  }

  const sql =
    "INSERT INTO users (studentId, full_name, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)";

  // query
  await connection.query(sql, [
    user.studentId,
    user.fullName,
    user.email,
    user.password,
    user.phone || null,
    user.role || "STUDENT",
  ]);
};

// update user bằng id
const updateUserById = async (
  user: UserUpdate,
  userId: string
): Promise<void> => {
  const sql =
    "UPDATE users SET full_name = ?, email = ?, password = ?, phone = ? WHERE id = ?";

  await connection.query(sql, [
    user.fullName,
    user.email,
    user.password,
    user.phone,
    userId,
  ]);
};

// xoá user bằng id
const deleteUserById = async (userId: string): Promise<void> => {
  const sql = "DELETE FROM users WHERE id = ?";
  await connection.query(sql, [userId]);
};

export { getAllUser, createUser, getUserById, deleteUserById, updateUserById };
