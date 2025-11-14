import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import { authorize } from "../../middlewares/authorize.middleware.ts";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../../middlewares/cache.middleware.ts";
import * as controller from "../../controllers/book/bookPublisher.controller.ts";

const router = express.Router();

// Cache publishers 15 phút (ít thay đổi)
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
