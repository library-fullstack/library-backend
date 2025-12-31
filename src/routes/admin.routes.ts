import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../middlewares/cache.middleware";
import * as adminController from "../controllers/admin.controller";

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

router.get(
  "/",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
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

router.get(
  "/:user_id",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
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

router.put(
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

export default router;
