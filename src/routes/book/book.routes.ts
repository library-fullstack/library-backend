import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import { authorize } from "../../middlewares/authorize.middleware.ts";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../../middlewares/cache.middleware.ts";
import * as bookController from "../../controllers/book/book.controller.ts";
import uploadRouter from "./upload.route.ts";

const router = express.Router();

router.get(
  "/count",
  cacheMiddleware(600, "books:count"),
  bookController.getPublicBookCountController
);

router.get(
  "/stats/overview",
  authMiddleware,
  authorize("ADMIN"),
  cacheMiddleware(300, "books:stats"),
  bookController.getBookStatsController
);

router.get("/", bookController.getAllBooksController);

router.get(
  "/:bookId/available",
  authMiddleware,
  bookController.checkBookAvailableController
);

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
  invalidateCacheMiddleware(["books:*"]),
  bookController.createBookController
);

// chỉ cho phép ADMIN hoặc LIBRARIAN sửa (sửa toàn bộ) sách
router.put(
  "/:bookId",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  invalidateCacheMiddleware(["books:*"]),
  bookController.updateBookByIdController
);

// chỉ cho phép ADMIN hoặc LIBRARIAN xoá sách
router.delete(
  "/:bookId",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  invalidateCacheMiddleware(["books:*"]),
  bookController.deleteBookByIdController
);

// chỉ cho phép ADMIN hoặc LIBRARIAN cập nhật một phần nào đó của sách
router.patch(
  "/:bookId/status",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  invalidateCacheMiddleware(["books:*"]),
  bookController.updateBookStatusController
);

export default router;
