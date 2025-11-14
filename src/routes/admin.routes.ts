import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { authorize } from "../middlewares/authorize.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../middlewares/cache.middleware.ts";
import * as adminController from "../controllers/admin.controller.ts";

const router = express.Router();

router.get(
  "/system/settings",
  cacheMiddleware(600, "admin:settings"),
  adminController.getSystemSettingsController
);

router.patch(
  "/system/settings",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["admin:*"]),
  adminController.updateSystemSettingsController
);

// ❌ REMOVED CACHE: User list changes frequently
// - New user registrations
// - Profile updates (avatar, name, etc.)
// - User deletions
// Admin should see real-time data
router.get(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  adminController.adminGetAllUserController
);

// tạo người dùng mới
router.post(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  validate("createUser"),
  invalidateCacheMiddleware(["admin:*"]),
  adminController.adminCreateUserController
);

// ❌ REMOVED CACHE: User detail changes frequently
router.get(
  "/:user_id",
  authMiddleware,
  authorize("ADMIN"),
  adminController.adminGetUserByIdController
);

// cập nhật thông tin user
router.patch(
  "/:user_id",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["admin:*"]),
  adminController.adminUpdateUserByIdController
);

// xoá user
router.delete(
  "/:user_id",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["admin:*"]),
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
