import { Request, Response } from "express";
import ForumPostService from "../../services/forum/post.service.ts";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.ts";

export const createPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, categoryId, files } = req.body;
    const userId: string = req.userId!;
    const userRole: string = (req as any).user?.role || "STUDENT";

    if (!title || title.trim().length < 5 || title.length > 200) {
      res.status(400).json({
        success: false,
        message: "Title must be between 5 and 200 characters",
      });
      return;
    }

    if (!content || content.trim().length < 20) {
      res.status(400).json({
        success: false,
        message: "Content must be at least 20 characters",
      });
      return;
    }

    if (!categoryId) {
      res.status(400).json({
        success: false,
        message: "Category is required",
      });
      return;
    }

    const status = userRole === "ADMIN" ? "APPROVED" : "PENDING";
    const approvedBy = userRole === "ADMIN" ? userId : null;
    const approvedAt = userRole === "ADMIN" ? new Date() : null;

    const post = await ForumPostService.createPost({
      title: title.trim(),
      content: content.trim(),
      categoryId,
      userId,
      status,
      approvedBy,
      approvedAt,
      files: files || [],
    });

    const message =
      userRole === "ADMIN"
        ? "Bài viết được đăng ngay lập tức"
        : "Bài viết sẽ hiển thị sau khi được duyệt";

    res.status(201).json({
      success: true,
      message,
      data: post,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create post",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getPosts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const categoryId = req.query.categoryId
      ? parseInt(req.query.categoryId as string)
      : undefined;
    const sortBy = (req.query.sort as string) || "newest"; // newest, trending, most-comments
    const search = (req.query.search as string) || "";

    // Get current user ID if authenticated
    const userId = (req as AuthenticatedRequest).userId;

    console.log("getPosts - userId:", userId, "categoryId:", categoryId);

    const posts = await ForumPostService.getPosts({
      page,
      limit,
      categoryId,
      sortBy,
      search,
      status: "APPROVED", // Show approved posts to everyone
      userId: userId as string | undefined, // Also show user's own PENDING posts if authenticated
    });

    console.log("getPosts - posts.data length:", posts.data?.length);

    res.status(200).json({
      success: true,
      message: "Posts retrieved successfully",
      data: posts.data,
      pagination: {
        page,
        limit,
        total: posts.total,
        pages: Math.ceil(posts.total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch posts",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const postId = parseInt(id);
    const userId = (req as AuthenticatedRequest).userId;

    if (isNaN(postId)) {
      res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
      return;
    }

    const post = await ForumPostService.getPostById(postId, userId);

    if (!post) {
      res.status(404).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Post retrieved successfully",
      data: post,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch post",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updatePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, categoryId } = req.body;
    const postId = parseInt(id);
    const userId: string = req.userId!;

    if (isNaN(postId)) {
      res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
      return;
    }

    // Get post to check ownership
    const post = await ForumPostService.getPostById(postId);
    if (!post) {
      res.status(404).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    if (post.userId !== userId) {
      res.status(403).json({
        success: false,
        message: "You can only edit your own posts",
      });
      return;
    }

    // Validation
    if (title && (title.length < 5 || title.length > 200)) {
      res.status(400).json({
        success: false,
        message: "Title must be between 5 and 200 characters",
      });
      return;
    }

    if (content && content.trim().length < 20) {
      res.status(400).json({
        success: false,
        message: "Content must be at least 20 characters",
      });
      return;
    }

    const updated = await ForumPostService.updatePost(postId, {
      title: title?.trim(),
      content: content?.trim(),
      categoryId,
    });

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update post",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deletePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const postId = parseInt(id);
    const userId: string = req.userId!;
    const userRole: string = (req as any).user?.role || "STUDENT";

    if (isNaN(postId)) {
      res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
      return;
    }

    const post = await ForumPostService.getPostById(postId);
    if (!post) {
      res.status(404).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    // Only post owner or ADMIN can delete
    if (post.userId !== userId && userRole !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "You can only delete your own posts",
      });
      return;
    }

    await ForumPostService.deletePost(postId);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete post",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const likePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const postId = parseInt(id);
    const userId = req.userId!;

    console.log("[likePost] START: postId=", postId, "userId=", userId);

    if (isNaN(postId)) {
      console.log("[likePost] Invalid postId");
      res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
      return;
    }

    if (!userId) {
      console.log("[likePost] No userId");
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    console.log("[likePost] Getting post before like toggle");
    const post = await ForumPostService.getPostById(postId, userId);
    if (!post) {
      console.log("[likePost] Post not found:", postId);
      res.status(404).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    console.log("[likePost] Post before toggle:", {
      id: post.id,
      is_liked: post.is_liked,
      likes_count: post.likes_count,
    });

    const liked = await ForumPostService.toggleLike(postId, userId);
    console.log("[likePost] Toggle result: liked=", liked);

    const updatedPost = await ForumPostService.getPostById(postId, userId);
    console.log("[likePost] Post after toggle:", {
      id: updatedPost?.id,
      is_liked: updatedPost?.is_liked,
      likes_count: updatedPost?.likes_count,
    });

    const responseData = {
      is_liked: liked,
      likes_count: updatedPost?.likes_count || 0,
    };
    console.log("[likePost] Sending response:", responseData);

    res.status(200).json({
      success: true,
      message: liked ? "Post liked" : "Like removed",
      data: responseData,
    });
  } catch (error) {
    console.error("[likePost] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to like post",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const reportPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;
    const postId = parseInt(id);
    const userId = req.userId;

    if (isNaN(postId)) {
      res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }

    if (!reason) {
      res.status(400).json({
        success: false,
        message: "Report reason is required",
      });
      return;
    }

    const post = await ForumPostService.getPostById(postId);
    if (!post) {
      res.status(404).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    const report = await ForumPostService.reportPost({
      postId,
      userId,
      reason,
      description: description || "",
    });

    res.status(201).json({
      success: true,
      message:
        "Post reported successfully. Thank you for helping keep our community safe.",
      data: report,
    });
  } catch (error) {
    console.error("Error reporting post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to report post",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
