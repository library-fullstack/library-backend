import express from "express";
import { validate } from "../middlewares/validate.middleware.ts";
import {
  loginController,
  registerController,
  forgotPasswordController,
  resetPasswordController,
  sendOtpController,
} from "../controllers/auth.controller.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { verifyChangePasswordController } from "../controllers/auth.controller.ts";

const router = express.Router();

// đăng ký
router.post("/register", validate("createUser"), registerController);

// đăng nhập
router.post("/login", validate("login"), loginController);

// quên mật khẩu
router.post(
  "/forgot-password",
  validate("forgotPassword"),
  forgotPasswordController
);

// đổi mật khẩu
router.post(
  "/reset-password",
  validate("resetPassword"),
  resetPasswordController
);

router.post("/send-otp", authMiddleware, sendOtpController);

export default router;
