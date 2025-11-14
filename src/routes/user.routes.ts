import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { authorizeOrOwner } from "../middlewares/authorize.middleware.ts";
import { uploadMiddleware } from "../middlewares/upload.middleware.ts";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../middlewares/cache.middleware.ts";
import { secureCacheMiddleware } from "../middlewares/secure-cache.middleware.ts";
import * as userController from "../controllers/user.controller.ts";

const router = express.Router();

// đổi avatar
router.patch(
  "/profile/avatar",
  authMiddleware,
  uploadMiddleware.single("avatar"),
  invalidateCacheMiddleware(["user:*"]),
  userController.updateCurrentUserAvatarController
);

// lấy thông tin
// NO CACHE: User profile is user-specific, cache would return wrong user data
router.get("/profile", authMiddleware, userController.getCurrentUserController);

// ❌ REMOVED CACHE: Cache key "user:detail" was same for ALL users
// URL /users/123 and /users/456 would generate different hash keys anyway,
// but user data changes frequently (profile updates, avatar changes, etc.)
router.get(
  "/:user_id",
  authMiddleware,
  authorizeOrOwner(),
  userController.getUserByIdController
);

// update user
router.patch(
  "/:user_id",
  authMiddleware,
  authorizeOrOwner(),
  invalidateCacheMiddleware(["user:*"]),
  userController.updateUserByIdController
);

// check mật khẩu hiện tại - no-cache for security
router.post(
  "/check-password",
  secureCacheMiddleware,
  authMiddleware,
  userController.checkCurrentPasswordController
);

// check OTP và đổi mật khẩu - no-cache for security
router.post(
  "/change-password/verify",
  secureCacheMiddleware,
  authMiddleware,
  userController.changePasswordWithOtpController
);

// TEMP
// TEMP
// TEMP
// xác nhận thông tin
router.post(
  "/confirm-student-info",
  userController.confirmStudentInfoController
);

export default router;
