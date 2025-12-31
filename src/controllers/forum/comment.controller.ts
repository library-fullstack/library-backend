import { Request, Response } from "express";
import type { AuthRequest } from "../../types/errors";
import ForumCommentService from "../../services/forum/comment.service";
import ForumNotificationService from "../../services/forum/notification.service";
import ForumPostService from "../../services/forum/post.service";
import notificationService from "../../services/notification.service";

export const ForumCommentController = {
  async getCommentsByPost(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const postIdNum = parseInt(postId as string);

      if (isNaN(postIdNum)) {
        res.status(400).json({
          success: false,
          message: "Invalid post ID",
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const userId = (req as AuthRequest).user?.id;

      const { comments, total } = await ForumCommentService.getCommentsByPostId(
        postIdNum,
        page,
        limit,
        userId
      );

      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const replies = await ForumCommentService.getRepliesByParentId(
            comment.id,
            userId
          );
          return { ...comment, replies };
        })
      );

      res.status(200).json({
        success: true,
        data: commentsWithReplies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error getting comments:", error);
      res.status(500).json({
        success: false,
        message: "Không thể lấy danh sách bình luận",
      });
    }
  },

  async getReplies(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const id = parseInt(commentId);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid comment ID",
        });
        return;
      }

      const userId = (req as AuthRequest).user?.id;

      const replies = await ForumCommentService.getRepliesByParentId(
        id,
        userId
      );

      res.status(200).json({
        success: true,
        data: replies,
      });
    } catch (error) {
      console.error("Error getting replies:", error);
      res.status(500).json({
        success: false,
        message: "Không thể lấy danh sách trả lời",
      });
    }
  },

  async createComment(
    input: {
      postId: number;
      userId: string;
      content: string;
      parentCommentId?: number | null;
    },
    req: any,
    res: Response
  ): Promise<any> {
    try {
      if (!input.postId || !input.userId || !input.content) {
        res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
        return null;
      }

      const comment = await ForumCommentService.createComment(input.userId, {
        post_id: input.postId,
        parent_id: input.parentCommentId || null,
        content: input.content,
      });

      if (input.parentCommentId) {
        const parentComment = await ForumCommentService.getCommentById(
          input.parentCommentId as any
        );
        if (
          parentComment &&
          typeof parentComment.user_id === "string" &&
          parentComment.user_id !== input.userId
        ) {
          await ForumNotificationService.notifyCommentReply(
            input.parentCommentId,
            parentComment.user_id,
            input.userId,
            req.user?.full_name || "Người dùng",
            input.content.substring(0, 100)
          );
        }
      } else {
        const post = await ForumPostService.getPostById(input.postId);
        if (post && post.userId !== input.userId) {
          await notificationService.createForumNotification(
            post.userId,
            "POST_COMMENTED",
            input.postId,
            "Có bình luận mới",
            `${req.user?.full_name || "Ai đó"} đã bình luận vào bài viết "${post.title}"`
          );
        }
      }

      return comment;
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  },

  async updateComment(
    commentId: number,
    input: { content: string },
    req: any,
    res: Response
  ): Promise<any> {
    try {
      return await ForumCommentService.updateComment(commentId, input);
    } catch (error) {
      console.error("Error updating comment:", error);
      throw error;
    }
  },

  async deleteComment(
    commentId: number,
    req: any,
    res: Response
  ): Promise<void> {
    try {
      const comment = await ForumCommentService.getCommentById(
        commentId as any
      );
      if (comment) {
        await ForumPostService.updateCommentCount(comment.post_id, -1);
      }
      await ForumCommentService.deleteComment(commentId);
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  },

  async toggleLike(
    commentId: number,
    userId: string,
    req: any,
    res: Response
  ): Promise<{ likes_count: number; is_liked: boolean }> {
    try {
      return await ForumCommentService.toggleLike(commentId, userId);
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  },

  async getCommentById(commentId: number): Promise<any> {
    return await ForumCommentService.getCommentById(commentId as any);
  },

  async createCommentOriginal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Bạn cần đăng nhập để bình luận",
        });
        return;
      }

      const { post_id, parent_id, content } = req.body;

      if (!post_id || !content) {
        res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp nội dung bình luận",
        });
        return;
      }

      const comment = await ForumCommentService.createComment(userId, {
        post_id,
        parent_id: parent_id || null,
        content,
      });

      if (parent_id) {
        const parentComment =
          await ForumCommentService.getCommentById(parent_id);
        if (parentComment && parentComment.user_id) {
          await ForumNotificationService.notifyCommentReply(
            parent_id,
            parentComment.user_id,
            userId,
            (req as any).user?.full_name || "Người dùng",
            content.substring(0, 100)
          );
        }
      }

      res.status(201).json({
        success: true,
        message: "Bình luận được tạo thành công",
        data: comment,
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({
        success: false,
        message: "Không thể tạo bình luận",
      });
    }
  },

  async updateCommentOriginal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { commentId } = req.params;
      const { content } = req.body;

      const comment = await ForumCommentService.getCommentById(
        parseInt(commentId)
      );

      if (!comment) {
        res.status(404).json({
          success: false,
          message: "Bình luận không tồn tại",
        });
        return;
      }

      if (comment.user_id !== userId) {
        res.status(403).json({
          success: false,
          message: "Bạn không có quyền chỉnh sửa bình luận này",
        });
        return;
      }

      await ForumCommentService.updateComment(parseInt(commentId), {
        content,
      });

      res.status(200).json({
        success: true,
        message: "Cập nhật bình luận thành công",
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({
        success: false,
        message: "Không thể cập nhật bình luận",
      });
    }
  },

  async deleteCommentOriginal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { commentId } = req.params;

      const comment = await ForumCommentService.getCommentById(
        parseInt(commentId)
      );

      if (!comment) {
        res.status(404).json({
          success: false,
          message: "Bình luận không tồn tại",
        });
        return;
      }

      if (comment.user_id !== userId && (req as any).user?.role !== "ADMIN") {
        res.status(403).json({
          success: false,
          message: "Bạn không có quyền xóa bình luận này",
        });
        return;
      }

      await ForumCommentService.deleteComment(parseInt(commentId));

      res.status(200).json({
        success: true,
        message: "Xóa bình luận thành công",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({
        success: false,
        message: "Không thể xóa bình luận",
      });
    }
  },

  async toggleCommentLike(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { commentId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Bạn cần đăng nhập để thích bình luận",
        });
        return;
      }

      const result = await ForumCommentService.toggleLike(
        parseInt(commentId),
        userId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error toggling comment like:", error);
      res.status(500).json({
        success: false,
        message: "Không thể thích bình luận",
      });
    }
  },

  async hideComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userRole = (req as any).user?.role;
      const { commentId } = req.params;

      if (!userRole || !["ADMIN", "MODERATOR"].includes(userRole)) {
        res.status(403).json({
          success: false,
          message: "Bạn không có quyền ẩn bình luận",
        });
        return;
      }

      await ForumCommentService.hideComment(parseInt(commentId));

      res.status(200).json({
        success: true,
        message: "Ẩn bình luận thành công",
      });
    } catch (error) {
      console.error("Error hiding comment:", error);
      res.status(500).json({
        success: false,
        message: "Không thể ẩn bình luận",
      });
    }
  },

  async showComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userRole = (req as any).user?.role;
      const { commentId } = req.params;

      if (!userRole || !["ADMIN", "MODERATOR"].includes(userRole)) {
        res.status(403).json({
          success: false,
          message: "Bạn không có quyền hiển thị bình luận",
        });
        return;
      }

      await ForumCommentService.showComment(parseInt(commentId));

      res.status(200).json({
        success: true,
        message: "Hiển thị bình luận thành công",
      });
    } catch (error) {
      console.error("Error showing comment:", error);
      res.status(500).json({
        success: false,
        message: "Không thể hiển thị bình luận",
      });
    }
  },

  async reportComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { commentId } = req.params;
      const { reason } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Bạn cần đăng nhập để báo cáo",
        });
        return;
      }

      if (!reason || reason.trim().length < 10) {
        res.status(400).json({
          success: false,
          message: "Lý do báo cáo phải có ít nhất 10 ký tự",
        });
        return;
      }

      const comment = await ForumCommentService.getCommentById(
        parseInt(commentId)
      );

      if (!comment) {
        res.status(404).json({
          success: false,
          message: "Không tìm thấy bình luận",
        });
        return;
      }

      await ForumCommentService.reportComment({
        commentId: parseInt(commentId),
        userId,
        reason: reason.trim(),
      });

      res.status(201).json({
        success: true,
        message: "Báo cáo bình luận thành công",
      });
    } catch (error) {
      console.error("Error reporting comment:", error);
      res.status(500).json({
        success: false,
        message: "Không thể báo cáo bình luận",
      });
    }
  },
};
