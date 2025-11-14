import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../../middlewares/cache.middleware.ts";

const router = Router();

// Placeholder routes - implement later
router.get(
  "/",
  authMiddleware,
  cacheMiddleware(300, "forum:posts"),
  async (req, res) => {
    // TODO: Implement get all posts
    res.json({ message: "Forum posts endpoint - coming soon", posts: [] });
  }
);

router.get(
  "/:id",
  authMiddleware,
  cacheMiddleware(300, "forum:post:detail"),
  async (req, res) => {
    // TODO: Implement get post by id
    res.json({ message: "Forum post detail - coming soon", post: null });
  }
);

router.post(
  "/",
  authMiddleware,
  invalidateCacheMiddleware(["forum:*"]),
  async (req, res) => {
    // TODO: Implement create post
    res.status(501).json({ message: "Create post - not implemented yet" });
  }
);

export default router;
