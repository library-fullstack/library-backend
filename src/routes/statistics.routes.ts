import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { authorize } from "../middlewares/authorize.middleware.ts";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../middlewares/cache.middleware.ts";
import * as statisticsController from "../controllers/statistics.controller.ts";

const router = express.Router();

// ❌ REMOVED CACHE: Stats change frequently when:
// - Users borrow/return books
// - Admin updates borrow status
// - New users register
// - Books are added/removed
// Cache would show stale data to admins
router.get(
  "/dashboard",
  authMiddleware,
  authorize("ADMIN"),
  statisticsController.getDashboardStatsController
);

router.get(
  "/books",
  authMiddleware,
  authorize("ADMIN"),
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
  authorize("ADMIN"),
  statisticsController.getBorrowManagementController
);

// No longer need invalidateCacheMiddleware since we removed stats cache
router.patch(
  "/borrows/:borrow_id",
  authMiddleware,
  authorize("ADMIN"),
  statisticsController.updateBorrowStatusController
);

export default router;
