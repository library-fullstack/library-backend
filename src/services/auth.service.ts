import { userModel } from "../models/index.ts";
import {
  createUser,
  getUserByEmail,
  getUserByStudentId,
} from "./user.service.ts";
import { signToken } from "../utils/jwt.ts";
import { verifyPassword } from "../utils/password.ts";

const register = async (
  user: userModel.UserInput
): Promise<{ message: string }> => {
  // chỉ cho phép đăng ký sinh viên
  const safeUser: userModel.UserInput = {
    ...user,
    role: "STUDENT" as const,
  };

  // check
  if (!safeUser.studentId) {
    throw new Error("Mã sinh viên là bắt buộc khi đăng ký sinh viên.");
  }

  await createUser(safeUser);
  return { message: "Đăng ký thành công." };
};

const login = async (
  identifier: string,
  password: string
): Promise<{ user: Omit<userModel.User, "password">; token: string }> => {
  let user = null;

  if (identifier.includes("@")) {
    user = await getUserByEmail(identifier);
  } else {
    user = await getUserByStudentId(identifier);
    if (!user) {
      user = await getUserByEmail(identifier);
    }
  }

  if (!user) {
    throw new Error("Tài khoản không tồn tại hoặc đã bị vô hiệu hoá.");
  }

  // kiểm tra mật khẩu
  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    throw new Error("Sai mật khẩu.");
  }

  // tạo token
  const token = signToken({ userId: user.id, role: user.role });

  // bỏ mật khẩu khỏi response
  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

export { register, login };
