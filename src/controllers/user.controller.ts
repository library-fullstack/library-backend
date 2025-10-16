import { Request, Response } from "express";
import userServices from "../services/user.service.ts";
import { userModel } from "../models/index.ts";

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

export { getUserByIdController, updateUserByIdController };
