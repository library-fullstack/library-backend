import express from "express";
import BorrowController from "../controllers/borrow.controller.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";

const router = express.Router();

// Create borrow from cart
router.post("/", authMiddleware, BorrowController.createBorrow);

export default router;
