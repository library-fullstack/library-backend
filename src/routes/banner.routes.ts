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

/**
 * Public routes - no auth required
 */
// GET active banner - cache 5 phút
bannerPublicRoutes.get(
  "/active",
  cacheMiddleware(300, "banners:active"),
  getActiveBannerController
);

// GET all banners - cache 5 phút
bannerPublicRoutes.get(
  "/",
  cacheMiddleware(300, "banners:list"),
  getAllBannersController
);

/**
 * Admin routes - require authentication and ADMIN role
 */
// POST upload image - requires admin
bannerAdminRoutes.post(
  "/upload",
  authMiddleware,
  authorize("ADMIN"),
  uploadBannerMiddleware.single("image"),
  uploadBannerToCloudinary,
  uploadBannerImageController
);

// GET all banners - for admin panel
bannerAdminRoutes.get(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  getAllBannersController
);

// GET banner by ID - requires admin
bannerAdminRoutes.get(
  "/:id",
  authMiddleware,
  authorize("ADMIN"),
  getBannerByIdController
);

// POST create banner - requires admin
bannerAdminRoutes.post(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["banners:*"]),
  createBannerController
);

// PUT update banner - requires admin
bannerAdminRoutes.put(
  "/:id",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["banners:*"]),
  updateBannerController
);

// DELETE banner - requires admin
bannerAdminRoutes.delete(
  "/:id",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["banners:*"]),
  deleteBannerController
);

// PATCH toggle status - requires admin
bannerAdminRoutes.patch(
  "/:id/status",
  authMiddleware,
  authorize("ADMIN"),
  invalidateCacheMiddleware(["banners:*"]),
  toggleBannerStatusController
);

export { bannerPublicRoutes, bannerAdminRoutes };
