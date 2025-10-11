import { userModel } from "../models/index.ts";
import {
  createUser,
  getUserByEmail,
  getUserByStudentId,
} from "./user.service.ts";
import { signToken } from "../utils/jwt.ts";
import { verifyPassword } from "../utils/password.ts";

// đăng ký
const register = async (
  user: userModel.UserInput
): Promise<{ message: string }> => {
  const safeUser: userModel.UserInput = { ...user, role: "STUDENT" as const };
  await createUser(safeUser);
  return { message: "Đăng ký thành công." };
};

//đăng nhập
const login = async (
  identifier: string, // có thể dùng email hoặc studentId để đăng nhập
  password: string
): Promise<{ user: Omit<userModel.User, "password">; token: string }> => {
  let user = await getUserByEmail(identifier);

  if (!user) {
    user = await getUserByStudentId(identifier);
  }

  if (!user) {
    throw new Error("Email hoặc Mã sinh viên không tồn tại.");
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    throw new Error("Sai mật khẩu.");
  }

  const token = signToken({ userId: user.id, role: user.role });

  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

export { register, login };
