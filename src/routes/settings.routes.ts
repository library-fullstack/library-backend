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

settingsAdminRoutes.get(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  cacheMiddleware(600, "settings:all"),
  getAllSettingsController
);

settingsAdminRoutes.get(
  "/:key",
  authMiddleware,
  authorize("ADMIN"),
  cacheMiddleware(600, "settings"),
  getSettingController
);

settingsAdminRoutes.put(
  "/:key",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["settings:*"]),
  updateSettingController
);

settingsAdminRoutes.patch(
  "/:key/toggle",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["settings:*"]),
  toggleSettingController
);

settingsAdminRoutes.delete(
  "/:key",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["settings:*"]),
  deleteSettingController
);

export { settingsAdminRoutes };
