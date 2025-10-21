import express from "express";
import { validate } from "../middlewares/validate.middleware.ts";
import {
  loginController,
  registerController,
  forgotPasswordController,
  resetPasswordController,
} from "../controllers/auth.controller.ts";

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

export default router;
