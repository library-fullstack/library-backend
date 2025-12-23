import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../../middlewares/cache.middleware.ts";
import { ForumCommentController } from "../../controllers/forum/comment.controller.ts";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.ts";

const router = Router();

router.get(
  "/post/:postId",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    await ForumCommentController.getCommentsByPost(req, res);
  }
);

router.post(
  "/",
  authMiddleware,
  invalidateCacheMiddleware(["forum:comments:*", "forum:*"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const postId = req.body.postId || req.body.post_id;
      const parentCommentId = req.body.parentCommentId || req.body.parent_id;
      const { content } = req.body;
      const userId = req.userId;

      console.log("[Forum Comment Create] Received:", {
        postId,
        parentCommentId,
        contentLength: content?.length,
        userId,
      });

      if (!postId) {
        res.status(400).json({
          success: false,
          message: "Post ID is required",
        });
        return;
      }

      if (!content || content.trim().length < 3) {
        res.status(400).json({
          success: false,
          message: "Comment must be at least 3 characters",
        });
        return;
      }

      const postQuery = `SELECT is_locked FROM forum_posts WHERE id = ?`;
      const connection = (await import("../../config/db.ts")).default;
      const [postResult] = await connection.query(postQuery, [postId]);
      const post = (postResult as any[])[0];

      if (post && post.is_locked) {
        res.status(403).json({
          success: false,
          message: "Bài viết này đã bị khóa bình luận",
        });
        return;
      }

      const comment = await ForumCommentController.createComment(
        {
          postId,
          userId: userId!,
          content: content.trim(),
          parentCommentId: parentCommentId || null,
        },
        req,
        res
      );

      res.status(201).json({
        success: true,
        message: "Comment created successfully",
        data: comment,
      });
    } catch (error) {
      console.error("[Forum Comment Create] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create comment",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

router.patch(
  "/:commentId",
  authMiddleware,
  invalidateCacheMiddleware(["forum:comments:*", "forum:*"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.userId;

      if (!content || content.trim().length < 3) {
        res.status(400).json({
          success: false,
          message: "Comment must be at least 3 characters",
        });
        return;
      }

      const comment = await ForumCommentController.getCommentById(
        parseInt(commentId)
      );

      if (!comment) {
        res.status(404).json({
          success: false,
          message: "Comment not found",
        });
        return;
      }

      if (comment.user_id !== userId) {
        res.status(403).json({
          success: false,
          message: "You can only edit your own comments",
        });
        return;
      }

      const updated = await ForumCommentController.updateComment(
        parseInt(commentId),
        { content: content.trim() },
        req,
        res
      );

      res.status(200).json({
        success: true,
        message: "Comment updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update comment",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

router.delete(
  "/:commentId",
  authMiddleware,
  invalidateCacheMiddleware(["forum:comments:*", "forum:*"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.userId;

      const comment = await ForumCommentController.getCommentById(
        parseInt(commentId)
      );

      if (!comment) {
        res.status(404).json({
          success: false,
          message: "Comment not found",
        });
        return;
      }

      if (comment.user_id !== userId) {
        res.status(403).json({
          success: false,
          message: "You can only delete your own comments",
        });
        return;
      }

      await ForumCommentController.deleteComment(parseInt(commentId), req, res);

      res.status(200).json({
        success: true,
        message: "Comment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete comment",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

router.post(
  "/:commentId/like",
  authMiddleware,
  invalidateCacheMiddleware(["forum:comments:*"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.userId;

      const liked = await ForumCommentController.toggleLike(
        parseInt(commentId),
        userId!,
        req,
        res
      );

      res.status(200).json({
        success: true,
        message: liked ? "Comment liked" : "Like removed",
        data: { liked },
      });
    } catch (error) {
      console.error("Error liking comment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to like comment",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

router.post(
  "/:commentId/report",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    await ForumCommentController.reportComment(req, res);
  }
);

export default router;
