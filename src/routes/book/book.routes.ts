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

// ✅ CACHE OK: Total book count changes infrequently (only when books added/deleted)
// Cache 10 phút, invalidated by books:* pattern when admin adds/removes books
router.get(
  "/count",
  cacheMiddleware(600, "books:count"),
  bookController.getPublicBookCountController
);

// ✅ CACHE OK: Book stats (admin overview) change infrequently
// Cache 5 phút, invalidated by books:* pattern
router.get(
  "/stats/overview",
  authMiddleware,
  authorize("ADMIN"),
  cacheMiddleware(300, "books:stats"),
  bookController.getBookStatsController
);

// ❌ REMOVED CACHE: available_count thay đổi realtime khi:
// - User thêm/xóa sách vào cart
// - Admin thêm/xóa book_copies
// - Borrow status thay đổi
// Cache sẽ làm frontend hiển thị sai số lượng available
router.get("/", bookController.getAllBooksController);

// Check available phải đặt trước /:bookId
router.get(
  "/:bookId/available",
  authMiddleware,
  bookController.checkBookAvailableController
);

// ❌ REMOVED CACHE: available_count thay đổi realtime
// Giống lý do như books list ở trên
router.get("/:bookId", bookController.getBookByIdController);

// chỉ cho ADMIN với LIBRA upload ảnh
router.use(
  "/upload",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  uploadRouter
);

// chỉ cho phép ADMIN hoặc LIBRARIAN đăng sách mới
// Invalidate cache khi thêm sách
router.post(
  "/",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  invalidateCacheMiddleware(["books:*"]),
  bookController.createBookController
);

// chỉ cho phép ADMIN hoặc LIBRARIAN sửa (sửa toàn bộ) sách
// Invalidate cache khi sửa sách
router.put(
  "/:bookId",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  invalidateCacheMiddleware(["books:*"]),
  bookController.updateBookByIdController
);

// chỉ cho phép ADMIN hoặc LIBRARIAN xoá sách
// Invalidate cache khi xóa sách
router.delete(
  "/:bookId",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  invalidateCacheMiddleware(["books:*"]),
  bookController.deleteBookByIdController
);

// chỉ cho phép ADMIN hoặc LIBRARIAN cập nhật một phần nào đó của sách
// Invalidate cache khi cập nhật trạng thái
router.patch(
  "/:bookId/status",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  invalidateCacheMiddleware(["books:*"]),
  bookController.updateBookStatusController
);

export default router;
