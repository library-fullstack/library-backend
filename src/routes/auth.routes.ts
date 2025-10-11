import express from "express";
import { validate } from "../middlewares/validate.middleware.ts";
import {
  loginController,
  registerController,
} from "../controllers/auth.controller.ts";

const router = express.Router();

router.post("/register", validate("createUser"), registerController);
router.post("/login", validate("login"), loginController);

export default router;
