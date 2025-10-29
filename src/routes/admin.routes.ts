import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { authorize } from "../middlewares/authorize.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import * as adminController from "../controllers/admin.controller.ts";

const router = express.Router();

// lấy danh sách tất cả người dùng
router.get(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  adminController.adminGetAllUserController
);

// lấy thông tin chi tiết 1 user
router.get(
  "/:user_id",
  authMiddleware,
  authorize("ADMIN"),
  adminController.adminGetUserByIdController
);

// tạo người dùng mới
router.post(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  validate("createUser"),
  adminController.adminCreateUserController
);

// cập nhật thông tin user
router.patch(
  "/:user_id",
  authMiddleware,
  authorize("ADMIN"),
  adminController.adminUpdateUserByIdController
);

// xoá user
router.delete(
  "/:user_id",
  authMiddleware,
  authorize("ADMIN"),
  adminController.adminDeleteUserByIdController
);

// đổi avatar user
// router.patch(
//   "/:user_id/avatar",
//   authMiddleware,
//   uploadMiddleware.single("avatar"),
//   userController.updateUserAvatarByIdController
// );

export default router;
