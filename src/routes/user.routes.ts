import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { authorizeOrOwner } from "../middlewares/authorize.middleware.ts";
import { uploadMiddleware } from "../middlewares/upload.middleware.ts";
import * as userController from "../controllers/user.controller.ts";

const router = express.Router();

// đổi avatar
router.patch(
  "/profile/avatar",
  authMiddleware,
  uploadMiddleware.single("avatar"),
  userController.updateCurrentUserAvatarController
);

// lấy thông tin
router.get("/profile", authMiddleware, userController.getCurrentUserController);

// tự xem
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
  userController.updateUserByIdController
);

router.post(
  "/check-password",
  authMiddleware,
  userController.checkCurrentPasswordController
);
router.post(
  "/change-password/verify",
  authMiddleware,
  userController.changePasswordWithOtpController
);

export default router;
