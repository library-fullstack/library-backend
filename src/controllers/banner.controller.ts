import { Request, Response } from "express";
import type { ApiError, AuthRequest } from "../types/errors.ts";
import bannerService from "../services/banner.service.ts";
import { bannerModel } from "../models/index.ts";
import { snakeToCamel, camelToSnake } from "../utils/case-converter.ts";

const uploadBannerImageController = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const cloudinaryUpload = req.cloudinaryUpload;

    if (!cloudinaryUpload) {
      res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: cloudinaryUpload.url,
        public_id: cloudinaryUpload.public_id,
      },
    });
  } catch (error) {
    const err = error as ApiError;
    console.error("[uploadBannerImageController] Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to upload image",
    });
  }
};

const getAllBannersController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 50, isActive } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Math.min(100, Number(limit)));

    const isActiveFilter =
      isActive === "true" ? true : isActive === "false" ? false : undefined;

    const { banners, total } = await bannerService.getAllBanners(
      pageNum,
      limitNum,
      isActiveFilter
    );

    res.status(200).json({
      success: true,
      message: "Banners retrieved successfully",
      data: {
        banners: snakeToCamel(banners),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    const err = error as ApiError;
    console.error("[getAllBannersController] Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch banners",
    });
  }
};

const getBannerByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Banner ID is required",
      });
      return;
    }

    const banner = await bannerService.getBannerById(id);

    if (!banner) {
      res.status(404).json({
        success: false,
        message: `Banner with id ${id} not found`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Banner retrieved successfully",
      data: snakeToCamel(banner),
    });
  } catch (error) {
    const err = error as ApiError;
    console.error("[getBannerByIdController] Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch banner",
    });
  }
};

const getActiveBannerController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const banner = await bannerService.getActiveBanner();

    res.status(200).json({
      success: true,
      message: "Active banner retrieved successfully",
      data: banner ? snakeToCamel(banner) : null,
    });
  } catch (error) {
    const err = error as ApiError;
    console.error("[getActiveBannerController] Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch active banner",
    });
  }
};

const createBannerController = async (
  req: Request<{}, {}, bannerModel.CreateBannerInput>,
  res: Response
): Promise<void> => {
  try {
    // Convert camelCase from frontend to snake_case
    const convertedData = camelToSnake(req.body) as Record<string, unknown>;

    const {
      image,
      overlay,
      title,
      subtitle,
      title_color,
      subtitle_color,
      button_color,
      button_text,
      event_type,
      start_date,
      end_date,
      is_active,
    } = convertedData as {
      image?: string;
      overlay?: "dark" | "light";
      title?: string;
      subtitle?: string;
      title_color?: string;
      subtitle_color?: string;
      button_color?: string;
      button_text?: string;
      event_type?: string;
      start_date?: string;
      end_date?: string;
      is_active?: boolean;
    };

    if (!image || !title || !subtitle) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: image, title, subtitle",
      });
      return;
    }

    const userId = (req as any).user?.id;

    const banner = await bannerService.createBanner(
      {
        image,
        overlay: overlay || "dark",
        title,
        subtitle,
        title_color: title_color || "#ffffff",
        subtitle_color: subtitle_color || "rgba(255,255,255,0.9)",
        button_color: button_color || "#ED553B",
        button_text: button_text || "View More",
        event_type: event_type || "DEFAULT",
        start_date,
        end_date,
        is_active: is_active || false,
      },
      userId
    );

    if (is_active) {
      await bannerService.deactivateOtherBanners(banner.id, userId);
    }

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: snakeToCamel(banner),
    });
  } catch (error) {
    const err = error as ApiError;
    console.error("[createBannerController] Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to create banner",
    });
  }
};

const updateBannerController = async (
  req: Request<{ id: string }, {}, bannerModel.UpdateBannerInput>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    // Convert camelCase from frontend to snake_case
    const data = camelToSnake(req.body) as Record<string, unknown>;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Banner ID is required",
      });
      return;
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({
        success: false,
        message: "No fields to update",
      });
      return;
    }

    const userId = (req as any).user?.id;

    const banner = await bannerService.updateBanner(id, data, userId);

    if (data.is_active === true) {
      await bannerService.deactivateOtherBanners(id, userId);
    }

    res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: snakeToCamel(banner),
    });
  } catch (error) {
    const err = error as ApiError;
    console.error("[updateBannerController] Error:", err);
    if (err.message.includes("not found")) {
      res.status(404).json({
        success: false,
        message: err.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: err.message || "Failed to update banner",
      });
    }
  }
};

const deleteBannerController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Banner ID is required",
      });
      return;
    }

    const deleted = await bannerService.deleteBanner(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: `Banner with id ${id} not found`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    const err = error as ApiError;
    console.error("[deleteBannerController] Error:", err);
    if (err.message.includes("not found")) {
      res.status(404).json({
        success: false,
        message: err.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: err.message || "Failed to delete banner",
      });
    }
  }
};

const toggleBannerStatusController = async (
  req: Request<{ id: string }, {}, { is_active: boolean }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Banner ID is required",
      });
      return;
    }

    if (is_active === undefined) {
      res.status(400).json({
        success: false,
        message: "is_active field is required",
      });
      return;
    }

    const userId = (req as any).user?.id;

    const banner = await bannerService.toggleBannerStatus(
      id,
      is_active,
      userId
    );

    if (is_active) {
      await bannerService.deactivateOtherBanners(id, userId);
    }

    res.status(200).json({
      success: true,
      message: `Banner ${is_active ? "activated" : "deactivated"} successfully`,
      data: snakeToCamel(banner),
    });
  } catch (error) {
    const err = error as ApiError;
    console.error("[toggleBannerStatusController] Error:", err);
    if (err.message.includes("not found")) {
      res.status(404).json({
        success: false,
        message: err.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: err.message || "Failed to toggle banner status",
      });
    }
  }
};

export {
  uploadBannerImageController,
  getAllBannersController,
  getBannerByIdController,
  getActiveBannerController,
  createBannerController,
  updateBannerController,
  deleteBannerController,
  toggleBannerStatusController,
};
