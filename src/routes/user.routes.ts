import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorizeOrOwner } from "../middlewares/authorize.middleware";
import { uploadMiddleware } from "../middlewares/upload.middleware";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../middlewares/cache.middleware";
import { secureCacheMiddleware } from "../middlewares/secure-cache.middleware";
import * as userController from "../controllers/user.controller";

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
router.get("/profile", authMiddleware, userController.getCurrentUserController);

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

// xác nhận thông tin
router.post(
  "/confirm-student-info",
  userController.confirmStudentInfoController
);

// thống kê mượn sách của user hiện tại
router.get(
  "/stats/borrows",
  authMiddleware,
  userController.getUserBorrowStatsController
);

export default router;
