import { Request, response, Response } from "express";
import {
  getAllUser,
  getUserById,
  createUser,
  updateUserById,
  deleteUserById,
} from "../services/user.service.ts";

import { UserInput, UserUpdate } from "../models/user.model.ts";

const getAllUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const users = await getAllUser();

  if (!users) {
    res.status(404).json({ message: "Không tìm thấy người dùng" });
    return;
  }

  res.json(users);
};

const getUserByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.params.userId;
  const user = await getUserById(userId);

  if (!user) {
    res.status(404).json({ message: "Không tìm thấy người dùng" });
    return;
  }

  res.json(user);
};

const createUserController = async (
  req: Request<{}, {}, UserInput>,
  res: Response
) => {
  try {
    const { studentId, fullName, email, password, phone } = req.body;
    const role = "STUDENT";

    if (!studentId || !fullName || !email || !password || !phone) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    await createUser({
      studentId,
      fullName,
      email,
      password,
      phone,
      role,
    });

    res.status(201).json({
      message: "Đăng ký thành công",
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

const updateUserByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { fullName, email, password, phone } = req.body;
  const userId = req.params.userId;
  try {
    if (!fullName || !email || !password || !phone) {
      res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
      return;
    }
    await updateUserById(
      {
        fullName,
        email,
        password,
        phone,
      },
      userId
    );

    res.status(200).json({ message: "Cập nhật người dùng thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

const deleteUserByIdController = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  try {
    if (!userId) {
      return res.status(400).json({ message: "Người dùng không tồn tại" });
    }

    await deleteUserById(userId);

    res.status(200).json({ message: "Xoá thành công người dùng" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export {
  getAllUserController,
  getUserByIdController,
  createUserController,
  updateUserByIdController,
  deleteUserByIdController,
};
