export interface User {
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
