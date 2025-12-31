import { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import ForumSettingsService from "../../services/forum/settings.service";

export const getForumSettings = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const settings = await ForumSettingsService.getSettings();

    res.status(200).json({
      success: true,
      message: "Forum settings retrieved",
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching forum settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch forum settings",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateForumSettings = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const settings = req.body;

    await ForumSettingsService.updateSettings(settings);

    res.status(200).json({
      success: true,
      message: "Forum settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating forum settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update forum settings",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
