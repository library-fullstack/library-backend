import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import { authorize } from "../../middlewares/authorize.middleware.ts";
import * as bookController from "../../controllers/book/book.controller.ts";

const router = express.Router();

router.get("/", bookController.getAllBooksController);
router.get("/:bookId", bookController.getBookByIdController);

router.post(
  "/",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  bookController.createBookController
);
router.put(
  "/:bookId",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  bookController.updateBookByIdController
);
router.delete(
  "/:bookId",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  bookController.deleteBookByIdController
);

router.patch(
  "/:bookId/status",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  bookController.updateBookStatusController
);

router.get(
  "/stats/overview",
  authMiddleware,
  authorize("ADMIN"),
  bookController.getBookStatsController
);

router.get(
  "/:bookId/available",
  authMiddleware,
  bookController.checkBookAvailableController
);

export default router;
