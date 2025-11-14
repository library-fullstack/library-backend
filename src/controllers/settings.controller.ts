import { Request, Response } from "express";
import SettingsService from "../services/settings.service.ts";

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
    console.error("Error in getSettingController:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

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
    console.error("Error in getAllSettingsController:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

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
    console.error("Error in updateSettingController:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

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
    console.error("Error in toggleSettingController:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

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
    console.error("Error in deleteSettingController:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};
