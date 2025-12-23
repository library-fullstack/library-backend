import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../../middlewares/cache.middleware.ts";
import ForumNotificationService from "../../services/forum/notification.service.ts";

const router = Router();

router.get(
  "/",
  authMiddleware,
  cacheMiddleware(60, "forum:notifications"),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const { notifications, total } =
        await ForumNotificationService.getUserNotifications(
          userId,
          page,
          limit
        );

      res.status(200).json({
        success: true,
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error getting notifications:", error);
      res.status(500).json({
        success: false,
        message: "Không thể lấy danh sách thông báo",
      });
    }
  }
);

router.get(
  "/unread",
  authMiddleware,
  cacheMiddleware(30, "forum:unread:notifications"),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const limit = parseInt(req.query.limit as string) || 20;

      const notifications =
        await ForumNotificationService.getUnreadNotifications(userId, limit);
      const unreadCount = await ForumNotificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: notifications,
        unread_count: unreadCount,
      });
    } catch (error) {
      console.error("Error getting unread notifications:", error);
      res.status(500).json({
        success: false,
        message: "Không thể lấy thông báo chưa đọc",
      });
    }
  }
);

router.get(
  "/unread/count",
  authMiddleware,
  cacheMiddleware(30, "forum:unread:count"),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const unreadCount = await ForumNotificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        unread_count: unreadCount,
      });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({
        success: false,
        message: "Không thể lấy số lượng thông báo chưa đọc",
      });
    }
  }
);

router.post(
  "/:notificationId/read",
  authMiddleware,
  invalidateCacheMiddleware(["forum:notifications", "forum:unread:*"]),
  async (req: Request, res: Response) => {
    try {
      const { notificationId } = req.params;

      await ForumNotificationService.markNotificationAsRead(
        parseInt(notificationId)
      );

      res.status(200).json({
        success: true,
        message: "Đánh dấu thông báo là đã đọc",
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({
        success: false,
        message: "Không thể đánh dấu thông báo",
      });
    }
  }
);

router.post(
  "/read-all",
  authMiddleware,
  invalidateCacheMiddleware(["forum:notifications", "forum:unread:*"]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      await ForumNotificationService.markAllNotificationsAsRead(userId);

      res.status(200).json({
        success: true,
        message: "Đánh dấu tất cả thông báo là đã đọc",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({
        success: false,
        message: "Không thể đánh dấu tất cả thông báo",
      });
    }
  }
);

router.delete(
  "/:notificationId",
  authMiddleware,
  invalidateCacheMiddleware(["forum:notifications"]),
  async (req: Request, res: Response) => {
    try {
      const { notificationId } = req.params;

      await ForumNotificationService.deleteNotification(
        parseInt(notificationId)
      );

      res.status(200).json({
        success: true,
        message: "Xóa thông báo thành công",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({
        success: false,
        message: "Không thể xóa thông báo",
      });
    }
  }
);

export default router;
