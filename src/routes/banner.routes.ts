import { Router } from "express";
import {
  uploadBannerImageController,
  getAllBannersController,
  getBannerByIdController,
  getActiveBannerController,
  createBannerController,
  updateBannerController,
  deleteBannerController,
  toggleBannerStatusController,
} from "../controllers/banner.controller.ts";
import { authorize } from "../middlewares/authorize.middleware.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import {
  uploadBannerMiddleware,
  uploadBannerToCloudinary,
} from "../middlewares/banner-upload.middleware.ts";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../middlewares/cache.middleware.ts";

const bannerPublicRoutes = Router();
const bannerAdminRoutes = Router();

bannerPublicRoutes.get(
  "/active",
  cacheMiddleware(10, "banners:active"),
  getActiveBannerController
);

bannerPublicRoutes.get(
  "/",
  cacheMiddleware(10, "banners:list"),
  getAllBannersController
);

bannerAdminRoutes.post(
  "/upload",
  authMiddleware,
  authorize("ADMIN"),
  uploadBannerMiddleware.single("image"),
  uploadBannerToCloudinary,
  uploadBannerImageController
);

bannerAdminRoutes.get(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  getAllBannersController
);

bannerAdminRoutes.get(
  "/:id",
  authMiddleware,
  authorize("ADMIN"),
  getBannerByIdController
);

bannerAdminRoutes.post(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["banners:*"]),
  createBannerController
);

bannerAdminRoutes.put(
  "/:id",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["banners:*"]),
  updateBannerController
);

bannerAdminRoutes.delete(
  "/:id",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["banners:*"]),
  deleteBannerController
);

bannerAdminRoutes.patch(
  "/:id/status",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["banners:*"]),
  toggleBannerStatusController
);

export { bannerPublicRoutes, bannerAdminRoutes };
