import connection from "../config/db";
import { User, UserInput, UserUpdate } from "../models/user.model";
import { v4 as uuidv4 } from "uuid";
// mã hoá password
import { hashPassword } from "../utils/password";

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

// get user bằng email
const getUserByEmail = async (email: string): Promise<User | null> => {
  const [rows] = await connection.query<User[]>(
    `SELECT * FROM users WHERE email = ?`,
    [email]
  );
  return rows.length ? rows[0] : null;
};

// get user bằng studentId
const getUserByStudentId = async (studentId: string): Promise<User | null> => {
  const [rows] = await connection.query<User[]>(
    `SELECT * FROM users WHERE studentId = ?`,
    [studentId]
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
  if (existStudentId.length > 0)
    throw new Error("Mã sinh viên đã được đăng ký");

  // check email
  const [existEmail] = await connection.query<User[]>(
    "SELECT id FROM users WHERE email = ?",
    [user.email]
  );
  if (existEmail.length > 0) throw new Error("Email đã được đăng ký");

  // tạo id bằng uuid luôn
  const id = uuidv4();
  let passwordHash: string | null = null;

  if (user.password) {
    passwordHash = await hashPassword(user.password);
  }

  await connection.query(
    "INSERT INTO users (id, studentId, full_name, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      user.studentId,
      user.fullName,
      user.email,
      passwordHash,
      user.phone || null,
      user.role || "STUDENT",
    ]
  );
};

// update user bằng id
const updateUserById = async (
  user: UserUpdate,
  userId: string
): Promise<void> => {
  const passwordHash = user.password ? await hashPassword(user.password) : null;

  await connection.query(
    "UPDATE users SET full_name = ?, email = ?, password = ?, phone = ? WHERE id = ?",
    [user.fullName, user.email, passwordHash, user.phone, userId]
  );
};

// xoá user bằng id
const deleteUserById = async (userId: string): Promise<void> => {
  const sql = "DELETE FROM users WHERE id = ?";
  await connection.query(sql, [userId]);
};

export {
  getAllUser,
  createUser,
  getUserById,
  deleteUserById,
  updateUserById,
  getUserByEmail,
  getUserByStudentId,
};
