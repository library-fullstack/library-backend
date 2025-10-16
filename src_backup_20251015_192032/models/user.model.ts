import { RowDataPacket } from "mysql2";

interface User extends RowDataPacket {
  id?: string;
  studentId: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role?: "STUDENT" | "ADMIN";
  createdAt?: Date;
  updatedAt?: Date;
}

// form khi truyền dữ liệu user
interface UserInput {
  studentId: string;
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  role?: "STUDENT" | "ADMIN";
  status?: "ACTIVE" | "INACTIVE";
}

type UserUpdate = {
  fullName?: string;
  email?: string;
  password?: string;
  phone?: string;
};

export { User, UserInput, UserUpdate };
