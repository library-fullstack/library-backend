import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import { authorize } from "../../middlewares/authorize.middleware.ts";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../../middlewares/cache.middleware.ts";
import * as controller from "../../controllers/book/bookAuthor.controller.ts";

const router = express.Router();

// Cache authors by book 10 phút
router.get(
  "/:bookId",
  cacheMiddleware(600, "authors"),
  controller.getAuthorsByBookController
);

router.post(
  "/:bookId",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  invalidateCacheMiddleware(["authors:*", "books:*"]),
  controller.addAuthorToBookController
);

router.delete(
  "/:bookId/:authorId",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  invalidateCacheMiddleware(["authors:*", "books:*"]),
  controller.removeAuthorFromBookController
);

export default router;
