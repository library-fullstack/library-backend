import { Router } from "express";
import {
  getSettingController,
  getAllSettingsController,
  updateSettingController,
  toggleSettingController,
  deleteSettingController,
} from "../controllers/settings.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../middlewares/cache.middleware";

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
