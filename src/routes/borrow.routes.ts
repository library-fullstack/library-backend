import express from "express";
import BorrowController from "../controllers/borrow.controller.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.post("/", authMiddleware, BorrowController.createBorrow);

export default router;
