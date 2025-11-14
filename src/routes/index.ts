import express from "express";
import bookRouter from "./book/book.routes.ts";
import authorRouter from "./book/bookAuthor.route.ts";
import categoryRouter from "./book/bookCategory.route.ts";
import imageRouter from "./book/bookImage.route.ts";
import publisherRouter from "./book/publisher.route.ts";
import tagRouter from "./book/tag.route.ts";
import authRoute from "./auth.routes.ts";
import adminRoute from "./admin.routes.ts";
import userRoute from "./user.routes.ts";
import statisticsRoute from "./statistics.routes.ts";
import forumPostRoute from "./forum/post.routes.ts";
import borrowCartRoute from "./borrowCart.routes.ts";
import borrowRoute from "./borrow.routes.ts";
import { bannerPublicRoutes, bannerAdminRoutes } from "./banner.routes.ts";
import { settingsAdminRoutes } from "./settings.routes.ts";
import metricsRoute from "./metrics.routes.ts";
import SettingsService from "../services/settings.service.ts";

const router = express.Router();

router.use("/auth", authRoute);
router.use("/admin", adminRoute);
router.use("/users", userRoute);
router.use("/statistics", statisticsRoute);
router.use("/books", bookRouter);
router.use("/authors", authorRouter);
router.use("/categories", categoryRouter);
router.use("/images", imageRouter);
router.use("/publishers", publisherRouter);
router.use("/tags", tagRouter);
router.use("/forum/posts", forumPostRoute);
router.use("/cart", borrowCartRoute);
router.use("/borrows", borrowRoute);

// Banner routes - public and admin
router.use("/banners", bannerPublicRoutes);
router.use("/admin/banners", bannerAdminRoutes);

// Settings routes - admin only
router.use("/admin/settings", settingsAdminRoutes);

// Metrics routes - admin only (no auth middleware here, handled in metrics.routes.ts if needed)
router.use("/metrics", metricsRoute);

// Public settings endpoint - for fetching disable_event_effects (no auth required)
// Cache 10 phút
import { cacheMiddleware } from "../middlewares/cache.middleware.ts";

router.get(
  "/settings/:key",
  cacheMiddleware(600, "settings:public"),
  async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await SettingsService.getSettingByKey(key);

      if (!setting) {
        res.status(404).json({
          success: false,
          message: "Setting not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Setting retrieved successfully",
        data: setting,
      });
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

export default router;
