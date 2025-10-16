import { Request, Response } from "express";
import adminServices from "../services/admin.service.ts";
import { userModel } from "../models/index.ts";

// get all user
const adminGetAllUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const users = await adminServices.adminGetAllUser();

  if (!users) {
    res.status(404).json({ message: "Không tìm thấy người dùng" });
    return;
  }

  res.json(users);
};

// get user bằng id
const adminGetUserByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user_id = req.params.user_id;
  const user = await adminServices.adminGetUserById(user_id);

  if (!user) {
    res.status(404).json({ message: "Không tìm thấy người dùng" });
    return;
  }

  res.json(user);
};

const adminCreateUserController = async (
  req: Request<{}, {}, userModel.AdminCreateUserInput>,
  res: Response
) => {
  try {
    const {
      student_id,
      full_name,
      email,
      password,
      phone,
      role,
      status,
      avatar_url,
    } = req.body;

    await adminServices.adminCreateUser({
      student_id,
      full_name,
      email,
      password,
      phone,
      role,
      status,
      avatar_url,
    });

    res.status(201).json({ message: "Tạo người dùng thành công" });
  } catch (err: any) {
    console.error("[AdminCreateUserController]", err);
    res
      .status(400)
      .json({ message: err.message || "Không thể tạo người dùng" });
  }
};

const adminUpdateUserByIdController = async (
  req: Request<{ user_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.params.user_id?.trim();
    if (!user_id) {
      res.status(400).json({ message: "Thiếu ID người dùng" });
      return;
    }

    const { full_name, email, password, phone, role, status, avatar_url } =
      req.body;

    if (
      full_name === undefined &&
      email === undefined &&
      password === undefined &&
      phone === undefined &&
      role === undefined &&
      status === undefined &&
      avatar_url === undefined
    ) {
      res.status(400).json({ message: "Không có dữ liệu để cập nhật" });
      return;
    }

    await adminServices.adminUpdateUserById(user_id, {
      full_name,
      email,
      password,
      phone,
      role,
      status,
      avatar_url,
    });

    res.status(200).json({ message: "Cập nhật người dùng thành công" });
  } catch (err: any) {
    console.error("AdminUpdateUserByIdController: ", err);
    res.status(500).json({
      message: err.message || "Lỗi máy chủ, không thể cập nhật người dùng",
    });
  }
};

// xoá user bằng id
const adminDeleteUserByIdController = async (req: Request, res: Response) => {
  const user_id = req.params.user_id;
  try {
    if (!user_id) {
      return res.status(400).json({ message: "Người dùng không tồn tại" });
    }

    await adminServices.adminDeleteUserById(user_id);

    res.status(200).json({ message: "Xoá thành công người dùng" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export {
  adminGetAllUserController,
  adminGetUserByIdController,
  adminCreateUserController,
  adminDeleteUserByIdController,
  adminUpdateUserByIdController,
};
