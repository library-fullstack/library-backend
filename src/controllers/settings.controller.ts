import { Request, Response } from "express";
import SettingsService from "../services/settings.service.ts";

/**
 * Get a setting by key
 * GET /api/v1/admin/settings/:key
 */
export const getSettingController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { key } = req.params;

    if (!key) {
      res.status(400).json({
        success: false,
        message: "Setting key is required",
      });
      return;
    }

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
    const err = error as ApiError;
    console.error("Error in getSettingController:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

/**
 * Get all settings
 * GET /api/v1/admin/settings
 */
export const getAllSettingsController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const settings = await SettingsService.getAllSettings();

    res.status(200).json({
      success: true,
      message: "Settings retrieved successfully",
      data: settings,
    });
  } catch (error) {
    const err = error as ApiError;
    console.error("Error in getAllSettingsController:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

/**
 * Update a setting by key
 * PUT /api/v1/admin/settings/:key
 */
export const updateSettingController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { key } = req.params;
    const { setting_value, description } = req.body;

    if (!key) {
      res.status(400).json({
        success: false,
        message: "Setting key is required",
      });
      return;
    }

    if (setting_value === undefined) {
      res.status(400).json({
        success: false,
        message: "Setting value is required",
      });
      return;
    }

    // Check if setting exists, if not create it
    let setting = await SettingsService.getSettingByKey(key);
    if (!setting) {
      setting = await SettingsService.createSetting({
        setting_key: key,
        setting_value,
        description,
      });
    } else {
      setting = await SettingsService.updateSettingByKey(key, {
        setting_value,
        description,
      });
    }

    res.status(200).json({
      success: true,
      message: "Setting updated successfully",
      data: setting,
    });
  } catch (error) {
    const err = error as ApiError;
    console.error("Error in updateSettingController:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

/**
 * Toggle a boolean setting
 * PATCH /api/v1/admin/settings/:key/toggle
 */
export const toggleSettingController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { key } = req.params;

    if (!key) {
      res.status(400).json({
        success: false,
        message: "Setting key is required",
      });
      return;
    }

    const newValue = await SettingsService.toggleBooleanSetting(key);

    res.status(200).json({
      success: true,
      message: "Setting toggled successfully",
      data: {
        key,
        value: newValue,
      },
    });
  } catch (error) {
    const err = error as ApiError;
    console.error("Error in toggleSettingController:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

/**
 * Delete a setting by key
 * DELETE /api/v1/admin/settings/:key
 */
export const deleteSettingController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { key } = req.params;

    if (!key) {
      res.status(400).json({
        success: false,
        message: "Setting key is required",
      });
      return;
    }

    const deleted = await SettingsService.deleteSettingByKey(key);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Setting not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Setting deleted successfully",
    });
  } catch (error) {
    const err = error as ApiError;
    console.error("Error in deleteSettingController:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

