import { Request, Response } from "express";
import type { ApiError } from "../types/errors.ts";
import adminServices from "../services/admin.service.ts";
import { userModel } from "../models/index.ts";
import adminService from "../services/admin.service.ts";

const adminGetAllUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    const result = await adminServices.adminGetAllUser(pageNum, limitNum);

    if (!result.users || result.users.length === 0) {
      res.status(200).json({
        users: [],
        total: 0,
        page: pageNum,
        limit: limitNum,
        totalPages: 0,
      });
      return;
    }

    res.json({
      users: result.users,
      total: result.total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(result.total / limitNum),
    });
  } catch (error) {
    const err = error as ApiError;
    console.error("[adminGetAllUserController]", err);
    res.status(500).json({
      message: err.message || "Failed to fetch users",
    });
  }
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
  } catch (err) {
    const error = err as ApiError;
    console.error("[AdminCreateUserController]", error);
    res
      .status(400)
      .json({ message: error.message || "Không thể tạo người dùng" });
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
  } catch (err) {
    const error = err as ApiError;
    console.error("AdminUpdateUserByIdController: ", error);
    res.status(500).json({
      message: error.message || "Lỗi máy chủ, không thể cập nhật người dùng",
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
  } catch (err) {
    const error = err as ApiError;
    res.status(400).json({ message: error.message });
  }
};

const getSystemSettingsController = async (req: Request, res: Response) => {
  const allowEdit = await adminService.getAllowStudentInfoEdit();
  res.status(200).json({ allow_student_info_edit: allowEdit });
};

const updateSystemSettingsController = async (req: Request, res: Response) => {
  try {
    const { allow_student_info_edit } = req.body;

    if (allow_student_info_edit === undefined) {
      return res
        .status(400)
        .json({ message: "Thiếu giá trị allow_student_info_edit" });
    }

    await adminService.updateAllowStudentInfoEdit(allow_student_info_edit);

    res.status(200).json({
      message: "Cập nhật thành công",
      allow_student_info_edit,
    });
  } catch (err) {
    const error = err as ApiError;
    console.error("[updateSystemSettingsController]", error);
    res.status(500).json({
      message: error.message || "Không thể cập nhật thiết lập hệ thống",
    });
  }
};

export {
  adminGetAllUserController,
  adminGetUserByIdController,
  adminCreateUserController,
  adminDeleteUserByIdController,
  adminUpdateUserByIdController,
  getSystemSettingsController,
  updateSystemSettingsController,
};
