import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import {
  authorize,
  authorizeOrOwner,
} from "../middlewares/authorize.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import * as userController from "../controllers/user.controller.ts";

const router = express.Router();

// xem danh sách user admin
router.get(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  userController.getAllUserController
);

// xoá user admin
router.delete(
  "/:userId",
  authMiddleware,
  authorize("ADMIN"),
  userController.deleteUserByIdController
);

// ai cũng có thể xem hoặc sửa chính mình
router.get(
  "/:userId",
  authMiddleware,
  authorizeOrOwner("ADMIN"),
  userController.getUserByIdController
);
router.put(
  "/:userId",
  authMiddleware,
  authorizeOrOwner("ADMIN"),
  userController.updateUserByIdController
);

// thêm user mới. admin
router.post(
  "/",
  validate("createUser"),
  authMiddleware,
  authorize("ADMIN"),
  userController.createUserController
);

export default router;
