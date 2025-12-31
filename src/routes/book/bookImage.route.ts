import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";
import * as controller from "../../controllers/book/bookImage.controller";

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
