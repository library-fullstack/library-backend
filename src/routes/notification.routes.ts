import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, notificationController.getNotifications);
router.get(
  "/unread-count",
  authMiddleware,
  notificationController.getUnreadCount
);
router.patch("/:id/read", authMiddleware, notificationController.markAsRead);
router.patch(
  "/mark-all-read",
  authMiddleware,
  notificationController.markAllAsRead
);
router.delete(
  "/:id",
  authMiddleware,
  notificationController.deleteNotification
);

export default router;
