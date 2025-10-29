import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import { authorize } from "../../middlewares/authorize.middleware.ts";
import * as controller from "../../controllers/book/bookImage.controller.ts";

const router = express.Router();

router.get("/:bookId", controller.getImagesByBookController);
router.post(
  "/",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  controller.addBookImageController
);
router.delete(
  "/:imageId",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  controller.deleteBookImageController
);

export default router;
