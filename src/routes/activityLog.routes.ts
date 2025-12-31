import { Router } from "express";
import * as activityLogController from "../controllers/activityLog.controller";
import { authorize } from "../middlewares/authorize.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

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
