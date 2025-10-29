import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import { authorize } from "../../middlewares/authorize.middleware.ts";
import * as controller from "../../controllers/book/bookPublisher.controller.ts";

const router = express.Router();

router.get("/", controller.getAllPublishersController);
router.post(
  "/",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  controller.createPublisherController
);
router.put(
  "/:id",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  controller.updatePublisherController
);
router.delete(
  "/:id",
  authMiddleware,
  authorize("ADMIN"),
  controller.deletePublisherController
);

export default router;
