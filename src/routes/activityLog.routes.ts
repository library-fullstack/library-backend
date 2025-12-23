import { Router } from "express";
import * as activityLogController from "../controllers/activityLog.controller.ts";
import { authorize } from "../middlewares/authorize.middleware.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";

const router = Router();

router.get(
  "/recent",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN", "MODERATOR"),
  activityLogController.getRecentActivities
);

router.get(
  "/user/:userId",
  authMiddleware,
  authorize("ADMIN"),
  activityLogController.getActivitiesByUser
);

router.post(
  "/",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  activityLogController.createActivityLog
);

export default router;
