import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../../middlewares/cache.middleware";
import { verifyAccessToken } from "../../utils/token";
import {
  createPost,
  getPosts,
  getMyPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  reportPost,
} from "../../controllers/forum/post.controller";
import { ForumCommentController } from "../../controllers/forum/comment.controller";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";

const router = Router();

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
    } catch (err) {}
  }
  next();
};

router.get("/", optionalAuth, cacheMiddleware(300, "forum:posts"), getPosts);

router.get("/my-posts", authMiddleware, getMyPosts);

router.post(
  "/",
  authMiddleware,
  invalidateCacheMiddleware(["forum:*"]),
  createPost
);

router.get("/:id", getPostById);

router.patch(
  "/:id",
  authMiddleware,
  invalidateCacheMiddleware(["forum:*"]),
  updatePost
);

router.delete(
  "/:id",
  authMiddleware,
  invalidateCacheMiddleware(["forum:*"]),
  deletePost
);

router.post(
  "/:id/like",
  authMiddleware,
  invalidateCacheMiddleware(["forum:*"]),
  likePost
);

router.post(
  "/:id/report",
  authMiddleware,
  invalidateCacheMiddleware(["forum:reports"]),
  reportPost
);

router.get(
  "/:id/comments",
  cacheMiddleware(300, "forum:comments:post:"),
  async (req: AuthenticatedRequest, res) => {
    await ForumCommentController.getCommentsByPost(req, res);
  }
);

export default router;
