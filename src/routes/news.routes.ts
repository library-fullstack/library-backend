import { Router } from "express";
import {
  getAllNews,
  getNewsById,
  getNewsBySlug,
  createNews,
  updateNews,
  deleteNews,
  getLatestNews,
} from "../controllers/news.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";

const router = Router();

router.get("/", getAllNews);
router.get("/latest", getLatestNews);
router.get("/:id", getNewsById);
router.get("/slug/:slug", getNewsBySlug);

router.post("/", authenticate, authorize("ADMIN", "LIBRARIAN"), createNews);
router.put("/:id", authenticate, authorize("ADMIN", "LIBRARIAN"), updateNews);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "LIBRARIAN"),
  deleteNews
);

export default router;
