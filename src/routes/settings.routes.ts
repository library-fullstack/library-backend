import { Router } from "express";
import {
  getSettingController,
  getAllSettingsController,
  updateSettingController,
  toggleSettingController,
  deleteSettingController,
} from "../controllers/settings.controller.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { authorize } from "../middlewares/authorize.middleware.ts";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../middlewares/cache.middleware.ts";

const settingsAdminRoutes = Router();

/**
 * Admin routes - require authentication and ADMIN role
 */

// GET all settings - đặt trước /:key
settingsAdminRoutes.get(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  cacheMiddleware(600, "settings:all"),
  getAllSettingsController
);

// GET a setting by key - cache 10 phút
settingsAdminRoutes.get(
  "/:key",
  authMiddleware,
  authorize("ADMIN"),
  cacheMiddleware(600, "settings"),
  getSettingController
);

// PUT update a setting by key
settingsAdminRoutes.put(
  "/:key",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["settings:*"]),
  updateSettingController
);

// PATCH toggle a boolean setting by key
settingsAdminRoutes.patch(
  "/:key/toggle",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["settings:*"]),
  toggleSettingController
);

// DELETE a setting by key
settingsAdminRoutes.delete(
  "/:key",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["settings:*"]),
  deleteSettingController
);

export { settingsAdminRoutes };
