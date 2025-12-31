import express from "express";
import bookRouter from "./book/book.routes";
import bookUploadRouter from "./book/upload.routes";
import authorRouter from "./book/bookAuthor.route";
import categoryRouter from "./book/bookCategory.route";
import imageRouter from "./book/bookImage.route";
import publisherRouter from "./book/publisher.route";
import tagRouter from "./book/tag.route";
import authRoute from "./auth.routes";
import adminRoute from "./admin.routes";
import userRoute from "./user.routes";
import statisticsRoute from "./statistics.routes";
import forumPostRoute from "./forum/post.routes";
import forumCommentRoute from "./forum/comment.routes";
import forumCategoryRoute from "./forum/category.routes";
import forumSearchRoute from "./forum/search.routes";
import forumUploadRoute from "./forum/upload.routes";
import forumModerationRoute from "./forum/moderation.routes";
import borrowCartRoute from "./borrowCart.routes";
import borrowRoute from "./borrow.routes";
import bookFavouriteRoute from "./bookFavourite.routes";
import { bannerPublicRoutes, bannerAdminRoutes } from "./banner.routes";
import { settingsAdminRoutes } from "./settings.routes";
import metricsRoute from "./metrics.routes";
import newsRoute from "./news.routes";
import eventsRoute from "./events.routes";
import activityLogRoute from "./activityLog.routes";
import systemSettingsRoute from "./systemSettings.routes";
import uploadRoute from "./upload.routes";
import notificationRoute from "./notification.routes";
import SettingsService from "../services/settings.service";

const router = express.Router();

import connection from "../config/db";
router.get("/health", async (req, res) => {
  try {
    await connection.query("SELECT 1");

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.use("/auth", authRoute);
router.use("/admin", adminRoute);
router.use("/user", userRoute);
router.use("/users", (req, res, next) => {
  const isAdminOperation =
    (req.method === "GET" && req.path === "/") ||
    (req.method === "POST" && req.path === "/") ||
    (req.method === "PUT" && req.path.match(/^\/[a-f0-9-]+$/)) ||
    (req.method === "DELETE" && req.path.match(/^\/[a-f0-9-]+$/));

  if (isAdminOperation) {
    return adminRoute(req, res, next);
  }
  return userRoute(req, res, next);
});
router.use("/statistics", statisticsRoute);
router.use("/books/upload", bookUploadRouter);
router.use("/books", bookRouter);
router.use("/authors", authorRouter);
router.use("/categories", categoryRouter);
router.use("/images", imageRouter);
router.use("/publishers", publisherRouter);
router.use("/tags", tagRouter);
router.use("/forum/posts", forumPostRoute);
router.use("/forum/comments", forumCommentRoute);
router.use("/forum/categories", forumCategoryRoute);
router.use("/forum/search", forumSearchRoute);
router.use("/forum/upload", forumUploadRoute);
router.use("/forum/moderation", forumModerationRoute);
router.use("/cart", borrowCartRoute);
router.use("/borrows", borrowRoute);
router.use("/bookFavourite", bookFavouriteRoute);

router.use("/banners", bannerPublicRoutes);
router.use("/admin/banners", bannerAdminRoutes);

router.use("/admin/settings", settingsAdminRoutes);

router.use("/news", newsRoute);
router.use("/events", eventsRoute);
router.use("/activity-logs", activityLogRoute);
router.use("/system-settings", systemSettingsRoute);
router.use("/admin/upload", uploadRoute);
router.use("/notifications", notificationRoute);

router.use("/metrics", metricsRoute);

import { cacheMiddleware } from "../middlewares/cache.middleware";

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
