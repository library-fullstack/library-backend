import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../middlewares/cache.middleware";
import * as statisticsController from "../controllers/statistics.controller";

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
