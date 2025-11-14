import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import { authorize } from "../../middlewares/authorize.middleware.ts";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../../middlewares/cache.middleware.ts";
import * as controller from "../../controllers/book/bookCategory.controller.ts";

const router = express.Router();

router.get(
  "/",
  cacheMiddleware(900, "categories"),
  controller.getAllCategoriesController
);

router.post(
  "/",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  invalidateCacheMiddleware(["categories:*", "books:*"]),
  controller.createCategoryController
);

router.put(
  "/:id",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  invalidateCacheMiddleware(["categories:*", "books:*"]),
  controller.updateCategoryController
);

router.delete(
  "/:id",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["categories:*", "books:*"]),
  controller.deleteCategoryController
);

export default router;
