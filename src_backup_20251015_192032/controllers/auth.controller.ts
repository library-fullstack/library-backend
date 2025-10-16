import { Request, Response } from "express";
import * as authService from "../services/auth.service.ts";
import * as jwt from "jsonwebtoken";

// đăng ký
const registerController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { studentId, fullName, email, password, phone } = req.body;

    if (!studentId || !fullName || !email || !password) {
      res.status(400).json({
        message:
          "Vui lòng nhập đầy đủ thông tin: Mã sinh viên, họ tên, email và mật khẩu.",
      });
      return;
    }

    const result = await authService.register({
      studentId,
      fullName,
      email,
      password,
      phone,
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({
      message: err.message || "Đăng ký thất bại.",
    });
  }
};

// đăng nhập
const loginController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({
        message: "Vui lòng nhập đầy đủ email hoặc mã sinh viên và mật khẩu.",
      });

      return;
    }

    const result = await authService.login(identifier, password);
    res.status(200).json(result);
  } catch (err: any) {
    console.error("[Login Error]", err.message);
    console.log("[jwt]", jwt);
    res.status(401).json({
      message: "Tài khoản hoặc mật khẩu không chính xác.",
    });
  }
};

export { registerController, loginController };
