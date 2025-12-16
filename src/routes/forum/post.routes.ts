import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../../middlewares/cache.middleware.ts";
import { verifyAccessToken } from "../../utils/token.ts";
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  reportPost,
} from "../../controllers/forum/post.controller.ts";
import { ForumCommentController } from "../../controllers/forum/comment.controller.ts";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.ts";

const router = Router();

// Optional auth middleware - tries to authenticate but doesn't fail if no token
const optionalAuth = (req: any, res: any, next: any) => {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.split(" ")[1];
    try {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        req.userId = decoded.userId;
        (req as any).user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      }
    } catch (err) {
      // Ignore auth errors for optional auth
    }
  }
  next();
};

// GET - List all posts with filters (PUBLIC with optional auth)
router.get("/", optionalAuth, cacheMiddleware(300, "forum:posts"), getPosts);

// POST - Create new post
router.post(
  "/",
  authMiddleware,
  invalidateCacheMiddleware(["forum:*"]),
  createPost
);

// GET - Get single post by ID (PUBLIC)
// No caching since detail view changes frequently (likes, comments)
router.get("/:id", getPostById);

// PATCH - Update post (owner only)
router.patch(
  "/:id",
  authMiddleware,
  invalidateCacheMiddleware(["forum:*"]),
  updatePost
);

// DELETE - Delete post (owner only)
router.delete(
  "/:id",
  authMiddleware,
  invalidateCacheMiddleware(["forum:*"]),
  deletePost
);

// POST - Like/Unlike post
router.post(
  "/:id/like",
  authMiddleware,
  invalidateCacheMiddleware(["forum:*"]),
  likePost
);

// POST - Report post
router.post(
  "/:id/report",
  authMiddleware,
  invalidateCacheMiddleware(["forum:reports"]),
  reportPost
);

// GET - Get comments for a post
router.get(
  "/:id/comments",
  cacheMiddleware(300, "forum:comments:post:"),
  async (req: AuthenticatedRequest, res) => {
    await ForumCommentController.getCommentsByPost(req, res);
  }
);

export default router;
