import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { authorize } from "../middlewares/authorize.middleware.ts";
import * as bookController from "../controllers/book.controller.ts";

const router = express.Router();

// chỉ admin xem toàn bộ sách
router.get(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  bookController.getAllBookController
);

// ai cũng xem được 1 sách
router.get("/:bookId", authMiddleware, bookController.getBookByIdController);

// chỉ admin được thêm/sửa/xoá
router.post(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  bookController.createBookController
);
router.put(
  "/:bookId",
  authMiddleware,
  authorize("ADMIN"),
  bookController.updateBookByIdController
);
router.delete(
  "/:bookId",
  authMiddleware,
  authorize("ADMIN"),
  bookController.deleteBookByIdController
);

export default router;
