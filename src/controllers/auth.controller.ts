import { Request, Response } from "express";
import { authService } from "../services/auth.service.ts";

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
  } catch (err: any) {
    console.error("[AuthRegister]", err);
    res.status(400).json({
      message: err.message || "Đăng ký thất bại.",
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
    res.status(200).json(result);
  } catch (err: any) {
    console.error("[AuthLogin]", err);

    res.status(401).json({
      message: err.message || "Tài khoản hoặc mật khẩu không chính xác.",
    });
  }
};

// quên mật khẩu
export const forgotPasswordController = async (req: Request, res: Response) => {
  try {
    const { identifier, channel } = req.body;
    const result = await authService.forgotPassword(identifier, channel);
    res.status(200).json(result);
  } catch (err: any) {
    res
      .status(400)
      .json({ message: err.message || "Không thể gửi mã khôi phục." });
  }
};

// đổi mật khẩu
export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const { identifier, code, new_password } = req.body;
    const result = await authService.resetPassword(
      identifier,
      code,
      new_password
    );
    res.status(200).json(result);
  } catch (err: any) {
    res
      .status(400)
      .json({ message: err.message || "Không thể đặt lại mật khẩu." });
  }
};
