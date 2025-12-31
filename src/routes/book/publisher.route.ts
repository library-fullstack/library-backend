import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../../middlewares/cache.middleware";
import * as controller from "../../controllers/book/bookPublisher.controller";

const router = express.Router();

router.get(
  "/",
  cacheMiddleware(900, "publishers"),
  controller.getAllPublishersController
);

router.post(
  "/",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  invalidateCacheMiddleware(["publishers:*", "books:*"]),
  controller.createPublisherController
);

router.put(
  "/:id",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  invalidateCacheMiddleware(["publishers:*", "books:*"]),
  controller.updatePublisherController
);

router.delete(
  "/:id",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["publishers:*", "books:*"]),
  controller.deletePublisherController
);

export default router;
