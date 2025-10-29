import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import { authorize } from "../../middlewares/authorize.middleware.ts";
import * as controller from "../../controllers/book/bookTag.controller.ts";

const router = express.Router();

router.get("/", controller.getAllTagsController);
router.post(
  "/",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  controller.createTagController
);
router.post(
  "/attach",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  controller.attachTagToBookController
);
router.post(
  "/detach",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  controller.detachTagFromBookController
);

export default router;
