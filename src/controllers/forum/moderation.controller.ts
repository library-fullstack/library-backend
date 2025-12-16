import { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.ts";
import ForumModerationService from "../../services/forum/moderation.service.ts";
import ForumPostService from "../../services/forum/post.service.ts";
import connection from "../../config/db.ts";

export const getPendingPosts = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const { posts, total } = await ForumModerationService.getPendingPosts(
      page,
      limit
    );

    res.status(200).json({
      success: true,
      message: "Pending posts retrieved",
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching pending posts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending posts",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const status = (req.query.status as string) || "OPEN";

    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*) as total FROM forum_reports 
      WHERE status = ?
    `;
    const [[{ total }]] = await connection.execute(countQuery, [status]);

    const query = `
      SELECT 
        r.id, r.target_type, r.target_post_id, r.target_comment_id,
        r.reporter_id, r.reason, r.status, r.handled_by, r.resolution_note,
        r.created_at, r.updated_at,
        u_reporter.full_name as reporter_name, u_reporter.avatar_url as reporter_avatar,
        u_handler.full_name as handler_name,
        p.title as post_title,
        c.content as comment_content
      FROM forum_reports r
      LEFT JOIN users u_reporter ON r.reporter_id = u_reporter.id
      LEFT JOIN users u_handler ON r.handled_by = u_handler.id
      LEFT JOIN forum_posts p ON r.target_post_id = p.id
      LEFT JOIN forum_comments c ON r.target_comment_id = c.id
      WHERE r.status = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [reports] = await connection.query(query, [status, limit, offset]);

    res.status(200).json({
      success: true,
      message: "Reports retrieved",
      data: reports || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getActivityLogs = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const type = (req.query.type as string) || "FORUM";

    const { logs, total } = await ForumModerationService.getActivityLog(
      page,
      limit,
      type
    );

    res.status(200).json({
      success: true,
      message: "Activity logs retrieved",
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activity logs",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*) as total FROM user_notifications 
      WHERE user_id = ?
    `;
    const [[{ total }]] = await connection.execute(countQuery, [userId]);

    const query = `
      SELECT id, user_id, ntype, payload, read_at, created_at
      FROM user_notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [notifications] = await connection.execute(query, [
      userId,
      limit,
      offset,
    ]);

    res.status(200).json({
      success: true,
      message: "Notifications retrieved",
      data: notifications || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const approvePostByModerator = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = (req as any).user?.role;

    const postId = parseInt(id);

    if (isNaN(postId)) {
      res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
      return;
    }

    const post = await ForumPostService.getPostById(postId);

    if (!post || post.status !== "PENDING") {
      res.status(404).json({
        success: false,
        message: "Post not found or not pending approval",
      });
      return;
    }

    const posterRole = post.userRole || "STUDENT";

    if (userRole === "MODERATOR" && posterRole === "MODERATOR") {
      res.status(403).json({
        success: false,
        message:
          "Moderator posts must be approved by admin. Please send to admin for review.",
      });
      return;
    }

    if (userRole !== "ADMIN" && userRole !== "MODERATOR") {
      res.status(403).json({
        success: false,
        message: "Only admin or moderator can approve posts",
      });
      return;
    }

    const result = await ForumModerationService.approvePost(postId, userId);

    if (!result.success) {
      res.status(404).json({
        success: false,
        message: "Failed to approve post",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Post approved successfully",
    });
  } catch (error) {
    console.error("Error approving post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve post",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const rejectPostByModerator = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.userId!;

    const postId = parseInt(id);

    if (isNaN(postId)) {
      res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
      return;
    }

    if (!reason || reason.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
      return;
    }

    const post = await ForumPostService.getPostById(postId);

    if (!post || post.status !== "PENDING") {
      res.status(404).json({
        success: false,
        message: "Post not found or not pending approval",
      });
      return;
    }

    const result = await ForumModerationService.rejectPost(postId, userId);

    if (!result.success) {
      res.status(404).json({
        success: false,
        message: "Failed to reject post",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Post rejected successfully",
      data: { reason },
    });
  } catch (error) {
    console.error("Error rejecting post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject post",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const resolveReport = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { action, note } = req.body;
    const userId = req.userId!;

    const reportId = parseInt(id);

    if (isNaN(reportId)) {
      res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
      return;
    }

    if (!["approve", "dismiss"].includes(action)) {
      res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'approve' or 'dismiss'",
      });
      return;
    }

    const query = `
      UPDATE forum_reports
      SET status = ?, handled_by = ?, resolution_note = ?, updated_at = NOW()
      WHERE id = ? AND status = 'OPEN'
    `;

    const status = action === "approve" ? "RESOLVED" : "DISMISSED";
    const [result] = await connection.execute(query, [
      status,
      userId,
      note || null,
      reportId,
    ]);

    if ((result as any).affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: "Report not found or already resolved",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Report ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("Error resolving report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resolve report",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
