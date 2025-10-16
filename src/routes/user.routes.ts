import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { authorizeOrOwner } from "../middlewares/authorize.middleware.ts";
import * as userController from "../controllers/user.controller.ts";

const router = express.Router();

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

export default router;
