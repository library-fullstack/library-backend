import express from "express";
import {
  getAllUserController,
  getUserByIdController,
  createUserController,
  updateUserByIdController,
  deleteUserByIdController,
} from "../controllers/user.controller.ts";

const router = express.Router();

router.get("/", getAllUserController);
router.get("/:userId", getUserByIdController);
router.post("/", createUserController);
router.put("/:userId", updateUserByIdController);
router.delete("/:userId", deleteUserByIdController);

export default router;
