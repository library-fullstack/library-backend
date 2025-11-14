import express from "express";
import { validate } from "../middlewares/validate.middleware.ts";
import {
  loginController,
  registerController,
  forgotPasswordController,
  resetPasswordController,
  sendOtpController,
  refreshTokenController,
  logoutController,
} from "../controllers/auth.controller.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { verifyChangePasswordController } from "../controllers/auth.controller.ts";
import { secureCacheMiddleware } from "../middlewares/secure-cache.middleware.ts";

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

// Refresh token - exchange old token for new access token
router.post("/refresh", secureCacheMiddleware, refreshTokenController);

// Logout - revoke refresh token
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
