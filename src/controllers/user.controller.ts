import { Request, Response } from "express";
import userServices from "../services/user.service.ts";
import { uploadToCloudinary } from "../utils/cloudinary.ts";
import { userModel } from "../models/index.ts";
import { verifyPassword, hashPassword } from "../utils/password.ts";
import connection from "../config/db.ts";

// get user bằng id
const getUserByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user_id = req.params.user_id;
  const user = await userServices.getUserById(user_id);

  if (!user) {
    res.status(404).json({ message: "Không tìm thấy người dùng" });
    return;
  }

  res.json(user);
};

// update user bằng id
const updateUserByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user_id = req.params.user_id;
  const { password, phone, avatar_url } = req.body;

  try {
    if (!user_id) {
      res.status(400).json({ message: "Thiếu ID người dùng" });
      return;
    }

    // người dùng không gửi bất kỳ trường nào để cập nhật thì thôi
    if (
      password === undefined &&
      phone === undefined &&
      avatar_url === undefined
    ) {
      res.status(400).json({ message: "Không có dữ liệu để cập nhật" });
      return;
    }

    await userServices.updateUserById(user_id, {
      password,
      phone,
      avatar_url,
    });

    res
      .status(200)
      .json({ message: "Cập nhật thông tin người dùng thành công" });
  } catch (err: any) {
    console.error("[updateUserByIdController]", err);
    res.status(500).json({ message: err.message || "Lỗi server" });
  }
};

const updateUserAvatarByIdController = async (req: Request, res: Response) => {
  try {
    const userId = req.params.user_id;
    if (!userId) {
      res.status(401).json({ message: "Không xác thực được người dùng" });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "Thiếu file ảnh" });
      return;
    }

    const uploaded = await uploadToCloudinary(file.path, "avatars");

    await userServices.updateUserById(userId, {
      avatar_url: uploaded.secure_url,
    });

    res.status(200).json({
      message: "Cập nhật ảnh đại diện thành công",
      avatar_url: uploaded.secure_url,
    });
  } catch (err: any) {
    console.error("[updateUserAvatarByIdController]", err);
    res.status(500).json({
      message: err.message || "Lỗi khi cập nhật ảnh đại diện",
    });
  }
};

const updateCurrentUserAvatarController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      console.error("[Avatar Upload] No user ID in request");
      return res
        .status(401)
        .json({ message: "Không xác thực được người dùng" });
    }

    const file = req.file;
    if (!file) {
      console.error("[Avatar Upload] No file in request");
      return res.status(400).json({ message: "Thiếu file ảnh" });
    }

    console.log("[Avatar Upload] Starting upload for user:", userId);
    console.log("[Avatar Upload] File info:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    });

    const uploaded = await uploadToCloudinary(file.path, "avatars");

    console.log("[Avatar Upload] Cloudinary upload successful:", {
      secure_url: uploaded.secure_url,
      public_id: uploaded.public_id,
    });

    await userServices.updateUserById(userId, {
      avatar_url: uploaded.secure_url,
    });

    console.log("[Avatar Upload] Database updated successfully");

    return res.status(200).json({
      message: "Cập nhật ảnh đại diện thành công",
      avatar_url: uploaded.secure_url,
    });
  } catch (err: any) {
    console.error("[updateCurrentUserAvatarController] Error:", {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      message: err.message || "Lỗi khi cập nhật ảnh đại diện",
    });
  }
};

const checkCurrentPasswordController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { password } = req.body;
    const result = await userServices.checkCurrentPassword(userId, password);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

const changePasswordWithOtpController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { old_password, new_password, otp_code } = req.body;
    const result = await userServices.changePasswordWithOtp(
      userId,
      old_password,
      new_password,
      otp_code
    );
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

const getCurrentUserController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Không xác thực được người dùng" });
    }

    const user = await userServices.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.status(200).json(user);
  } catch (err: any) {
    console.error("[getCurrentUserController] Error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export {
  getUserByIdController,
  updateUserByIdController,
  updateUserAvatarByIdController,
  updateCurrentUserAvatarController,
  checkCurrentPasswordController,
  changePasswordWithOtpController,
  getCurrentUserController,
};
