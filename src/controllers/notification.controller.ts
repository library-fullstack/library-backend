import { Response } from "express";
import type { AuthRequest } from "../types/errors";
import notificationService from "../services/notification.service";

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 50)
    );
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

    const result = await notificationService.getUserNotifications(
      userId,
      limit,
      offset
    );

    res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: {
        limit,
        offset,
        total: result.total,
      },
    });
  } catch (error: any) {
    console.error("[getNotifications]", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch notifications",
    });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const count = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    console.error("[getUnreadCount]", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get unread count",
    });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;

    await notificationService.markAsRead(parseInt(id), userId);

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error: any) {
    console.error("[markAsRead]", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to mark notification as read",
    });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error: any) {
    console.error("[markAllAsRead]", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to mark all as read",
    });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;

    await notificationService.deleteNotification(parseInt(id), userId);

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error: any) {
    console.error("[deleteNotification]", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete notification",
    });
  }
};
