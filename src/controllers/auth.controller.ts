import { Request, Response } from "express";
import { authService } from "../services/auth.service.ts";
import { verificationService } from "../services/verification.service.ts";
import userServices from "../services/user.service.ts";
import { hashPassword } from "../utils/password.ts";

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

// quên mật khẩu controller
export const forgotPasswordController = async (req: Request, res: Response) => {
  try {
    // lấy email
    const { email } = req.body;

    // lấy kết quả khi truy vấn quên mật khẩu
    const result = await authService.forgotPassword(email);
    // trả về status + message api
    res.status(200).json(result);
  } catch (err: any) {
    console.error("[ForgotPassword]", err);
    res
      .status(400)
      .json({ message: err.message || "Không thể gửi mã khôi phục." });
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
  } catch (err: any) {
    console.error("[AuthResetPassword]", err);
    res.status(400).json({
      message: err.message || "Không thể đặt lại mật khẩu.",
    });
  }
};

export const sendOtpController = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
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
  } catch (err: any) {
    console.error("[sendOtpController]", err);
    return res
      .status(500)
      .json({ message: err.message || "Lỗi khi gửi mã OTP." });
  }
};

export const verifyChangePasswordController = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;
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

    // đổi mật khẩu
    const hashed = await hashPassword(new_password);
    await userServices.updateUserById(user.id, { password: hashed });

    return res.status(200).json({ message: "Đổi mật khẩu thành công." });
  } catch (err: any) {
    console.error("[verifyChangePasswordController]", err);
    return res
      .status(400)
      .json({ message: err.message || "Không thể đổi mật khẩu." });
  }
};
