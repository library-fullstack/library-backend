import { userModel } from "../models/index.ts";
import userServices from "./user.service.ts";
import { signToken } from "../utils/jwt.ts";
import { verifyPassword } from "../utils/password.ts";

const register = async (
  user: userModel.StudentRegisterInput
): Promise<{ message: string }> => {
  // chỉ cho phép sinh viên đăng ký
  if (!user.student_id) {
    throw new Error("Mã sinh viên là bắt buộc khi đăng ký sinh viên.");
  }

  const exist = await userServices.getUserByEmail(
    user.email || user.student_id
  );
  if (exist) {
    throw new Error("Email hoặc mã sinh viên đã tồn tại trong hệ thống.");
  }

  // gán role và status mặc định
  const safeUser: userModel.StudentRegisterInput = {
    ...user,
    role: "STUDENT",
    status: "ACTIVE",
  };

  await userServices.createUser(safeUser);
  return { message: "Đăng ký thành công. Bạn có thể đăng nhập ngay." };
};

const login = async (
  identifier: string,
  password: string
): Promise<{ user: Omit<userModel.User, "password">; token: string }> => {
  // tìm user theo email hoặc mã sinh viên
  const user =
    (await userServices.getUserByEmail(identifier)) ||
    (await userServices.getUserByStudentId(identifier));

  if (!user) {
    throw new Error("Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.");
  }

  // kiểm tra mật khẩu
  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    throw new Error("Sai mật khẩu. Vui lòng thử lại.");
  }

  // chặn nếu bị INACTIVE hoặc bị BAN
  if (user.status !== "ACTIVE") {
    const msg =
      user.status === "BANNED"
        ? "Tài khoản của bạn đã bị khóa vĩnh viễn."
        : "Tài khoản của bạn chưa được kích hoạt hoặc đang bị tạm khóa.";
    throw new Error(msg);
  }

  // tạo JWT
  const token = signToken({ user_id: user.id, role: user.role });

  // xoá password khỏi response
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

export const authService = { register, login };
