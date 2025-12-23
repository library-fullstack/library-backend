import express from "express";
import BorrowController from "../controllers/borrow.controller.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { authorize } from "../middlewares/authorize.middleware.ts";

const router = express.Router();

router.post("/", authMiddleware, BorrowController.createBorrow);
router.get("/my", authMiddleware, BorrowController.getMyBorrows);
router.get("/:id/preview", authMiddleware, BorrowController.getBorrowPreview);
router.post("/:id/confirm", authMiddleware, BorrowController.confirmBorrow);
router.post("/:id/renew", authMiddleware, BorrowController.renewBorrow);

router.get(
  "/admin/all",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  BorrowController.getAdminBorrows
);
router.patch(
  "/admin/:id/status",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  BorrowController.updateBorrowStatus
);

export default router;
