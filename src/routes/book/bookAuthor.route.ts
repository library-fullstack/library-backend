import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import { authorize } from "../../middlewares/authorize.middleware.ts";
import * as controller from "../../controllers/book/bookAuthor.controller.ts";

const router = express.Router();

router.get("/:bookId", controller.getAuthorsByBookController);
router.post(
  "/:bookId",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  controller.addAuthorToBookController
);
router.delete(
  "/:bookId/:authorId",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  controller.removeAuthorFromBookController
);

export default router;
