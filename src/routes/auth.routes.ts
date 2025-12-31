import express from "express";
import { validate } from "../middlewares/validate.middleware";
import {
  loginController,
  registerController,
  forgotPasswordController,
  resetPasswordController,
  sendOtpController,
  refreshTokenController,
  logoutController,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { verifyChangePasswordController } from "../controllers/auth.controller";
import { secureCacheMiddleware } from "../middlewares/secure-cache.middleware";

const router = express.Router();

// đăng ký - no-cache for security
router.post(
  "/register",
  secureCacheMiddleware,
  validate("createUser"),
  registerController
);

// đăng nhập - no-cache for security
router.post(
  "/login",
  secureCacheMiddleware,
  validate("login"),
  loginController
);

router.post("/refresh", secureCacheMiddleware, refreshTokenController);

router.post("/logout", secureCacheMiddleware, logoutController);

// quên mật khẩu - no-cache for security
router.post(
  "/forgot-password",
  secureCacheMiddleware,
  validate("forgotPassword"),
  forgotPasswordController
);

// đổi mật khẩu - no-cache for security
router.post(
  "/reset-password",
  secureCacheMiddleware,
  validate("resetPassword"),
  resetPasswordController
);

router.post(
  "/send-otp",
  secureCacheMiddleware,
  authMiddleware,
  sendOtpController
);

export default router;
