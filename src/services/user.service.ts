import connection from "../config/db.ts";
import { User } from "../models/user.model.ts";

export const UserService = {
  async getAll(): Promise<User[]> {
    const [rows] = await connection.query("SELECT * FROM users");
    return rows as User[];
  },

  // tạo user mới
  async createUser(user: User): Promise<void> {
    // check studentId của user xem đã từng tồn tại hay chưa
    const [studentIdExists] = await connection.query(
      "SELECT id FROM users WHERE studentId = ?",
      [user.studentId]
    );
    // nếu tồn tại, throw
    if ((studentIdExists as any[]).length > 0) {
      throw new Error("Mã sinh viên đã được đăng ký");
    }

    // check email xem email đã từng tồn tại hay chưa
    const [emailExists] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [user.email]
    );

    // nếu tồn tại, throw
    if ((emailExists as any[]).length > 0) {
      throw new Error("Email đã được đăng ký");
    }

    // sql
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
  },
};
