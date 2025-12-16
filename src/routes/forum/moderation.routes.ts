import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import {
  requireModerator,
  requireAdmin,
  requireOwnerOrModerator,
} from "../../middlewares/forum-auth.middleware.ts";
import ForumModerationService from "../../services/forum/moderation.service.ts";
import ForumPostService from "../../services/forum/post.service.ts";
import {
  getPendingPosts,
  getReports,
  getActivityLogs,
  getNotifications,
  approvePostByModerator,
  rejectPostByModerator,
  resolveReport,
} from "../../controllers/forum/moderation.controller.ts";
import {
  getForumSettings,
  updateForumSettings,
} from "../../controllers/forum/settings.controller.ts";

const router = Router();

/**
 * POST /forum/moderation/posts/:id/approve
 * Approve a pending post (moderator+)
 */
router.post(
  "/posts/:id/approve",
  authMiddleware,
  requireModerator,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const result = await ForumModerationService.approvePost(
        parseInt(id),
        userId
      );

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: "Bài viết không tìm thấy hoặc không chờ duyệt",
        });
      }

      return res.json({
        success: true,
        message: "Bài viết đã được phê duyệt",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi phê duyệt bài viết",
      });
    }
  }
);

/**
 * POST /forum/moderation/posts/:id/reject
 * Reject a pending post (moderator+)
 */
router.post(
  "/posts/:id/reject",
  authMiddleware,
  requireModerator,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const result = await ForumModerationService.rejectPost(
        parseInt(id),
        userId
      );

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: "Bài viết không tìm thấy hoặc không chờ duyệt",
        });
      }

      return res.json({
        success: true,
        message: "Bài viết đã bị từ chối",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi từ chối bài viết",
      });
    }
  }
);

/**
 * POST /forum/moderation/posts/:id/pin
 * Pin/unpin a post (admin only)
 */
router.post(
  "/posts/:id/pin",
  authMiddleware,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await ForumModerationService.togglePinPost(parseInt(id));

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: "Bài viết không tìm thấy",
        });
      }

      return res.json({
        success: true,
        message: "Trạng thái pin bài viết đã được cập nhật",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi pin bài viết",
      });
    }
  }
);

/**
 * POST /forum/moderation/posts/:id/lock
 * Lock/unlock a post (moderator+)
 */
router.post(
  "/posts/:id/lock",
  authMiddleware,
  requireModerator,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const result = await ForumModerationService.toggleLockPost(
        parseInt(id),
        userId
      );

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: "Bài viết không tìm thấy",
        });
      }

      return res.json({
        success: true,
        message: "Trạng thái khóa bài viết đã được cập nhật",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi khóa bài viết",
      });
    }
  }
);

/**
 * POST /forum/moderation/users/:userId/ban
 * Ban a user (admin only)
 */
router.post(
  "/users/:userId/ban",
  authMiddleware,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      const result = await ForumModerationService.banUser(userId, reason);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: "Người dùng không tìm thấy",
        });
      }

      return res.json({
        success: true,
        message: "Người dùng đã bị ban",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi ban người dùng",
      });
    }
  }
);

/**
 * POST /forum/moderation/users/:userId/unban
 * Unban a user (admin only)
 */
router.post(
  "/users/:userId/unban",
  authMiddleware,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const result = await ForumModerationService.unbanUser(userId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: "Người dùng không tìm thấy hoặc không bị ban",
        });
      }

      return res.json({
        success: true,
        message: "Người dùng đã được bỏ ban",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi bỏ ban người dùng",
      });
    }
  }
);

/**
 * GET /forum/moderation/pending-posts?page=1&limit=20
 * Get all pending posts (moderator+)
 */
router.get(
  "/pending-posts",
  authMiddleware,
  requireModerator,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "20");

      const { posts, total } = await ForumModerationService.getPendingPosts(
        page,
        limit
      );

      return res.json({
        success: true,
        data: posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi lấy danh sách bài viết chờ duyệt",
      });
    }
  }
);

/**
 * GET /forum/moderation/activity-log?page=1&limit=50
 * Get moderation activity log (moderator+)
 */
router.get(
  "/activity-log",
  authMiddleware,
  requireModerator,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "50");

      const { logs, total } = await ForumModerationService.getActivityLog(
        page,
        limit
      );

      return res.json({
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi lấy activity log",
      });
    }
  }
);

/**
 * GET /forum/moderation/banned-users?page=1&limit=20
 * Get all banned users (moderator+)
 */
router.get(
  "/banned-users",
  authMiddleware,
  requireModerator,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "20");

      const { users, total } = await ForumModerationService.getBannedUsers(
        page,
        limit
      );

      return res.json({
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi lấy danh sách người dùng bị ban",
      });
    }
  }
);

router.get(
  "/dashboard/pending-posts",
  authMiddleware,
  requireModerator,
  getPendingPosts
);

router.get("/dashboard/reports", authMiddleware, requireModerator, getReports);

router.get(
  "/dashboard/activity-logs",
  authMiddleware,
  requireModerator,
  getActivityLogs
);

router.get(
  "/dashboard/notifications",
  authMiddleware,
  requireModerator,
  getNotifications
);

router.post(
  "/dashboard/approve-post/:id",
  authMiddleware,
  requireModerator,
  approvePostByModerator
);

router.post(
  "/dashboard/reject-post/:id",
  authMiddleware,
  requireModerator,
  rejectPostByModerator
);

router.post(
  "/dashboard/resolve-report/:id",
  authMiddleware,
  requireModerator,
  resolveReport
);

/**
 * GET /forum/moderation/settings
 * Get forum settings (admin only)
 */
router.get("/settings", authMiddleware, requireAdmin, getForumSettings);

/**
 * PUT /forum/moderation/settings
 * Update forum settings (admin only)
 */
router.put("/settings", authMiddleware, requireAdmin, updateForumSettings);

export default router;
