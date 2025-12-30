import express from "express";
import BorrowController from "../controllers/borrow.controller.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { authorize } from "../middlewares/authorize.middleware.ts";

const router = express.Router();

router.get(
  "/analytics/top-books",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  BorrowController.getTopBorrowedBooks
);
router.get(
  "/analytics/top-categories",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  BorrowController.getTopBorrowedCategories
);
router.get(
  "/analytics/top-users",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  BorrowController.getTopBorrowingUsers
);

router.post("/", authMiddleware, BorrowController.createBorrow);
router.get("/my", authMiddleware, BorrowController.getMyBorrows);
router.get("/:id/preview", authMiddleware, BorrowController.getBorrowPreview);
router.post("/:id/confirm", authMiddleware, BorrowController.confirmBorrow);
router.post("/:id/renew", authMiddleware, BorrowController.renewBorrow);
router.post(
  "/:id/return",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  BorrowController.returnBorrow
);

router.get(
  "/admin/all",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  BorrowController.getAdminBorrows
);
router.patch(
  "/admin/status/:id",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  BorrowController.updateBorrowStatus
);

export default router;
