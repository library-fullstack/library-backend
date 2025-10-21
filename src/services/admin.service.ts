import connection from "../config/db.ts";
import { userModel } from "../models/index.ts";
import { v4 as uuidv4 } from "uuid";
// mã hoá password
import { hashPassword } from "../utils/password.ts";

// lấy hết thông tin cả tất cả người dùng
const adminGetAllUser = async (): Promise<userModel.User[] | null> => {
  const [rows] = await connection.query<userModel.User[]>(
    "SELECT * FROM users"
  );

  return rows;
};

// lấy thông tin của người dùng theo id
const adminGetUserById = async (
  user_id: string
): Promise<userModel.User | null> => {
  const [rows] = await connection.query<userModel.User[]>(
    "SELECT * FROM users WHERE id = ?",
    [user_id]
  );
  return rows[0];
};

// tạo người dùng mới
const adminCreateUser = async (
  user: userModel.AdminCreateUserInput
): Promise<void> => {
  // nếu thiếu thông tin cần thiết thì không cho tạo
  // hiện tại đang bị xung đột với bảng students
  // đcm thằng nào nghĩ ra cái bảng student này vậy clm
  if (!user.full_name || !user.password || !user.role) {
    throw new Error(
      "Thiếu thông tin bắt buộc (full_name, email, password, role)"
    );
  }

  // check xem người dùng này có tồn tại hay chưa
  const [exist] = await connection.query<userModel.User[]>(
    "SELECT id FROM users WHERE email = ? OR student_id = ?",
    [user.email, user.student_id || null]
  );

  //nếu tồn tại thì lượn
  if (exist.length > 0) {
    throw new Error("Email hoặc mã sinh viên đã tồn tại trong hệ thống");
  }

  // mã hoá mật khẩu
  const passwordHashed = await hashPassword(user.password);

  // tạo id UUID
  const id = uuidv4();

  // chạy truy vấn thêm người dùng này vào cơ sở dữ liệu
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

// thay đổi thông tin người dùng
const adminUpdateUserById = async (
  user_id: string,
  user: userModel.AdminUserUpdate
): Promise<void> => {
  // tạo field để chứa câu lệnh truy vấn
  const fields: string[] = [];
  // values để chứa giá trị truy vấn
  const values: any[] = [];

  // nếu có thay đổi thì mới đẩy vào field để truy vấ sau
  if (user.full_name !== undefined) {
    fields.push("full_name = ?");
    values.push(user.full_name);
  }

  // đổi email thì phải kiểm tra email đó có tồn tại trong hệ thống hay không
  if (user.email !== undefined) {
    // tìm email mới xem có trả về gì không
    const [emailCheck] = await connection.query<userModel.User[]>(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [user.email, user_id]
    );
    // nếu có trùng thì lướt
    if (emailCheck.length > 0) {
      throw new Error("Email này đã tồn tại trong hệ thống");
    }

    // không trùng thì thêm vào field để truy vấn
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

  // cuối cùng truy vấn fields với value mà người dùng cần đã được push vào trong field và value
  const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
  values.push(user_id);

  // chạy query
  await connection.query(sql, values);
};

// xoá user bằng id
const adminDeleteUserById = async (user_id: string): Promise<void> => {
  // kiểm tra xem có tồn tại người dùng đó không
  const [rows] = await connection.query<userModel.User[]>(
    "SELECT id FROM users WHERE id = ?",
    [user_id]
  );
  // nếu không có thì báo không có người dùng cần xoá
  if (!rows.length) {
    throw new Error("Không tìm thấy người dùng cần xoá");
  }

  // nếu có thì truy vấn xoá người dùng
  await connection.query("DELETE FROM users WHERE id = ?", [user_id]);
};

// xuất tất cả
const adminServices = {
  adminGetAllUser,
  adminGetUserById,
  adminCreateUser,
  adminUpdateUserById,
  adminDeleteUserById,
};

export default adminServices;
