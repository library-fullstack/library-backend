import { Request, Response } from "express";
import systemSettingsService from "../services/systemSettings.service";

export const getAllSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await systemSettingsService.getAll();

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error("[getAllSettings]", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch settings",
    });
  }
};

export const getSettingByKey = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const setting = await systemSettingsService.getByKey(key);

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: "Setting not found",
      });
    }

    res.status(200).json({
      success: true,
      data: setting,
    });
  } catch (error: any) {
    console.error("[getSettingByKey]", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch setting",
    });
  }
};

export const createSetting = async (req: Request, res: Response) => {
  try {
    const { setting_key, setting_value, description } = req.body;

    if (!setting_key || !setting_value) {
      return res.status(400).json({
        success: false,
        message: "setting_key and setting_value are required",
      });
    }

    const existing = await systemSettingsService.getByKey(setting_key);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Setting with this key already exists",
      });
    }

    const id = await systemSettingsService.create({
      setting_key,
      setting_value,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Setting created successfully",
      data: { id },
    });
  } catch (error: any) {
    console.error("[createSetting]", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create setting",
    });
  }
};

export const updateSetting = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { setting_value, description } = req.body;

    if (!setting_value) {
      return res.status(400).json({
        success: false,
        message: "setting_value is required",
      });
    }

    const updated = await systemSettingsService.update(key, {
      setting_value,
      description,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Setting not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Setting updated successfully",
    });
  } catch (error: any) {
    console.error("[updateSetting]", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update setting",
    });
  }
};

export const upsertSetting = async (req: Request, res: Response) => {
  try {
    const { setting_key, setting_value, description } = req.body;

    if (!setting_key || !setting_value) {
      return res.status(400).json({
        success: false,
        message: "setting_key and setting_value are required",
      });
    }

    await systemSettingsService.upsert(setting_key, setting_value, description);

    res.status(200).json({
      success: true,
      message: "Setting saved successfully",
    });
  } catch (error: any) {
    console.error("[upsertSetting]", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to save setting",
    });
  }
};

export const deleteSetting = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    const deleted = await systemSettingsService.delete(key);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Setting not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Setting deleted successfully",
    });
  } catch (error: any) {
    console.error("[deleteSetting]", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete setting",
    });
  }
};
