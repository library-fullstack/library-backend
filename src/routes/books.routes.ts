import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import * as booksController from "../controllers/books.controller.js";

const router = Router();

router.get("/", booksController.getAllBooks);
router.get("/:id", booksController.getBookById);

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "LIBRARIAN"),
  booksController.createBook
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "LIBRARIAN"),
  booksController.updateBook
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "LIBRARIAN"),
  booksController.deleteBook
);

export default router;
