import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import { authorize } from "../../middlewares/authorize.middleware.ts";
import * as bookController from "../../controllers/book/book.controller.ts";
import uploadRouter from "./upload.route.ts";

const router = express.Router();

// Public: lấy tổng số sách active (không cần auth) - đặt trước các route khác để tránh conflict với /:bookId
router.get("/count", bookController.getPublicBookCountController);

router.get("/", bookController.getAllBooksController);
router.get("/:bookId", bookController.getBookByIdController);

// chỉ cho ADMIN với LIBRA upload ảnh
router.use(
  "/upload",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  uploadRouter
);

// chỉ cho phép ADMIN hoặc LIBRARIAN đăng sách mới
router.post(
  "/",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  bookController.createBookController
);

// chỉ cho phép ADMIN hoặc LIBRARIAN sửa (sửa toàn bộ) sách
router.put(
  "/:bookId",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  bookController.updateBookByIdController
);

// chỉ cho phép ADMIN hoặc LIBRARIAN xoá sách
router.delete(
  "/:bookId",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  bookController.deleteBookByIdController
);

// chỉ cho phép ADMIN hoặc LIBRARIAN cập nhật một phần nào đó của sách
router.patch(
  "/:bookId/status",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  bookController.updateBookStatusController
);

// chỉ cho ADMIN xem tổng quan về số lượng sách,...
router.get(
  "/stats/overview",
  authMiddleware,
  authorize("ADMIN"),
  bookController.getBookStatsController
);

// xem sách đang còn có thể mượn
router.get(
  "/:bookId/available",
  authMiddleware,
  bookController.checkBookAvailableController
);

export default router;
