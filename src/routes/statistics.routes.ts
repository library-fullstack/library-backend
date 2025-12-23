import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { authorize } from "../middlewares/authorize.middleware.ts";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../middlewares/cache.middleware.ts";
import * as statisticsController from "../controllers/statistics.controller.ts";

const router = express.Router();

router.get(
  "/dashboard",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  statisticsController.getDashboardStatsController
);

router.get(
  "/books",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  statisticsController.getBookManagementController
);

router.get(
  "/users",
  authMiddleware,
  authorize("ADMIN"),
  statisticsController.getUserManagementController
);

router.get(
  "/borrows",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  statisticsController.getBorrowManagementController
);

router.patch(
  "/borrows/:borrow_id",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  statisticsController.updateBorrowStatusController
);

export default router;
