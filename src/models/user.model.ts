import { RowDataPacket } from "mysql2";

// dữ liệu trong database
interface User extends RowDataPacket {
  id: string;
  student_id?: string;
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  role: "STUDENT" | "LIBRARIAN" | "MODERATOR" | "ADMIN";
  status: "ACTIVE" | "INACTIVE" | "BANNED";
  avatar_url?: string;
  created_at?: Date;
  updated_at?: Date;
}

// khi sinh viên tự đăng ký
interface StudentRegisterInput {
  id?: string;
  student_id: string;
  password: string;
  role?: string;
  status?: string;
  email?: string;
}

// khi admin tạo user
interface AdminCreateUserInput {
  student_id?: string;
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  role: "STUDENT" | "LIBRARIAN" | "MODERATOR" | "ADMIN";
  status?: "ACTIVE" | "INACTIVE" | "BANNED";
  avatar_url?: string;
}

// khi cập nhật
type UserUpdate = Partial<{
  password: string;
  phone: string;
  avatar_url: string;
}>;

type AdminUserUpdate = Partial<{
  full_name: string;
  email: string;
  password: string;
  phone: string;
  role: "STUDENT" | "LIBRARIAN" | "MODERATOR" | "ADMIN";
  status: "ACTIVE" | "INACTIVE" | "BANNED";
  avatar_url: string;
}>;

export {
  User,
  StudentRegisterInput,
  AdminCreateUserInput,
  UserUpdate,
  AdminUserUpdate,
};
