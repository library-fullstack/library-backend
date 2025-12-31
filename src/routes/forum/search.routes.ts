import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../../middlewares/cache.middleware";
import ForumPostService from "../../services/forum/post.service";

const router = Router();

router.get(
  "/",
  authMiddleware,
  cacheMiddleware(600, "forum:search:"),
  async (req, res) => {
    try {
      const q = (req.query.q as string) || "";
      const categoryId = req.query.categoryId
        ? parseInt(req.query.categoryId as string)
        : undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const sortBy = (req.query.sort as string) || "newest";

      if (q.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: "Search query must be at least 2 characters",
        });
        return;
      }

      const results = await ForumPostService.getPosts({
        page,
        limit,
        search: q,
        categoryId,
        sortBy,
        status: "approved",
      });

      res.status(200).json({
        success: true,
        message: "Search completed successfully",
        data: results.data,
        pagination: {
          page,
          limit,
          total: results.total,
          pages: Math.ceil(results.total / limit),
        },
      });
    } catch (error) {
      console.error("Error searching posts:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search posts",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

router.get(
  "/trending",
  authMiddleware,
  cacheMiddleware(300, "forum:trending"),
  async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

      const trending = await ForumPostService.getPosts({
        page: 1,
        limit,
        sortBy: "trending",
        status: "approved",
      });

      res.status(200).json({
        success: true,
        message: "Trending posts retrieved successfully",
        data: trending.data,
      });
    } catch (error) {
      console.error("Error fetching trending posts:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch trending posts",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

router.get(
  "/category/:categoryId",
  authMiddleware,
  cacheMiddleware(300, "forum:category:"),
  async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const sortBy = (req.query.sort as string) || "newest";

      if (isNaN(categoryId)) {
        res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
        return;
      }

      const posts = await ForumPostService.getPosts({
        page,
        limit,
        categoryId,
        sortBy,
        status: "approved",
      });

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
      console.error("Error fetching posts by category:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch posts",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
