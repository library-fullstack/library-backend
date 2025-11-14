[
  {
    resource:
      "/c:/Users/hoaug/Desktop/LearnUntilDie/PROJECT/library-ui/src/features/auth/hooks/useAuthQuery.ts",
    owner: "eslint3",
    code: {
      value: "@typescript-eslint/no-unused-vars",
      target: {
        $mid: 1,
        path: "/rules/no-unused-vars",
        scheme: "https",
        authority: "typescript-eslint.io",
      },
    },
    severity: 4,
    message:
      "'navigate' is assigned a value but never used. Allowed unused vars must match /^_/u.",
    source: "eslint",
    startLineNumber: 17,
    startColumn: 9,
    endLineNumber: 17,
    endColumn: 17,
    origin: "extHost1",
  },
];

import { Request, Response } from "express";
import type { ApiError, AuthRequest } from "../types/errors.ts";
import { authService } from "../services/auth.service.ts";
import { verificationService } from "../services/verification.service.ts";
import userServices from "../services/user.service.ts";
import { hashPassword, verifyPassword } from "../utils/password.ts";
import {
  refreshTokenController,
  logoutController,
} from "./token.controller.ts";

// đăng ký controller
export const registerController = async (req: Request, res: Response) => {
  try {
    const { student_id, email, password } = req.body;

    if (!student_id || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin: Mã sinh viên và mật khẩu.",
      });
    }

    const result = await authService.register({
      student_id,
      email,
      password,
    });

    res.status(201).json(result);
  } catch (err) {
    const error = err as ApiError;
    console.error("[AuthRegister]", error);
    res.status(400).json({
      message: error.message || "Đăng ký thất bại.",
    });
  }
};

// đăng nhập controller
export const loginController = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ email hoặc mã sinh viên và mật khẩu.",
      });
    }

    const result = await authService.login(identifier, password);

    res.cookie("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    res.status(200).json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (err) {
    const error = err as ApiError;
    console.error("[AuthLogin]", error);

    res.status(401).json({
      message: error.message || "Tài khoản hoặc mật khẩu không chính xác.",
    });
  }
};

export { refreshTokenController, logoutController };

// quên mật khẩu controller
export const forgotPasswordController = async (req: Request, res: Response) => {
  try {
    // lấy email
    const { email } = req.body;

    // lấy kết quả khi truy vấn quên mật khẩu
    const result = await authService.forgotPassword(email);
    // trả về status + message api
    res.status(200).json(result);
  } catch (err) {
    const error = err as ApiError;
    console.error("[ForgotPassword]", error);
    res
      .status(400)
      .json({ message: error.message || "Không thể gửi mã khôi phục." });
  }
};

// đổi mật khẩu controller
export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    // lấy token và mật khẩu mới
    const { token, new_password } = req.body;

    // thiếu 1 trong 2 thì lượn
    if (!token || !new_password) {
      return res.status(400).json({
        message: "Thiếu token hoặc mật khẩu mới.",
      });
    }
    // truy vấn đổi mật khẩu và lấy về message báo thành công
    const result = await authService.resetPassword(token, new_password);
    // trả về status + message api
    res.status(200).json(result);
  } catch (err) {
    const error = err as ApiError;
    console.error("[AuthResetPassword]", error);
    res.status(400).json({
      message: error.message || "Không thể đặt lại mật khẩu.",
    });
  }
};

export const sendOtpController = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ message: "Không xác thực được người dùng." });

    const { reused, expires_at } = await verificationService.createOrReuseOtp(
      user.id,
      user.email
    );

    if (reused)
      return res.status(200).json({
        message: `Mã OTP đã được gửi, vui lòng kiểm tra email (hết hạn lúc ${expires_at}).`,
      });

    return res.status(200).json({
      message: "Đã gửi mã OTP mới đến email của bạn.",
    });
  } catch (err) {
    const error = err as ApiError;
    console.error("[sendOtpController]", error);
    return res
      .status(500)
      .json({ message: error.message || "Lỗi khi gửi mã OTP." });
  }
};

export const verifyChangePasswordController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ message: "Không xác thực được người dùng." });

    const { old_password, new_password, otp_code } = req.body;
    if (!old_password || !new_password || !otp_code)
      return res.status(400).json({ message: "Thiếu thông tin cần thiết." });

    // check OTP
    await verificationService.verifyOtp(user.id, otp_code);

    // check password cũ
    const found = await userServices.getUserById(user.id);
    if (!found)
      return res.status(404).json({ message: "Không tìm thấy người dùng." });

    const isOldPasswordValid = await verifyPassword(
      old_password,
      found.password
    );
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng." });
    }

    // đổi mật khẩu
    const hashed = await hashPassword(new_password);
    await userServices.updateUserById(user.id, { password: hashed });

    return res.status(200).json({ message: "Đổi mật khẩu thành công." });
  } catch (err) {
    const error = err as ApiError;
    console.error("[verifyChangePasswordController]", error);
    return res
      .status(400)
      .json({ message: error.message || "Không thể đổi mật khẩu." });
  }
};
