import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";

const router = Router();

// Placeholder routes - implement later
router.get("/", authMiddleware, async (req, res) => {
  // TODO: Implement get all posts
  res.json({ message: "Forum posts endpoint - coming soon", posts: [] });
});

router.get("/:id", authMiddleware, async (req, res) => {
  // TODO: Implement get post by id
  res.json({ message: "Forum post detail - coming soon", post: null });
});

router.post("/", authMiddleware, async (req, res) => {
  // TODO: Implement create post
  res.status(501).json({ message: "Create post - not implemented yet" });
});

export default router;
