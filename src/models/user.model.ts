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

type UserInput = {
  studentId: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: string;
};

type UserUpdate = {
  fullName?: string;
  email?: string;
  password?: string;
  phone?: string;
};

export { User, UserInput, UserUpdate };
