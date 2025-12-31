import { Request, Response } from "express";
import activityLogService from "../services/activityLog.service";

export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const activities = await activityLogService.getRecentActivities(limit);

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error: any) {
    console.error("[getRecentActivities]", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch recent activities",
    });
  }
};

export const getActivitiesByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const activities = await activityLogService.getActivitiesByUser(
      userId,
      limit
    );

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error: any) {
    console.error("[getActivitiesByUser]", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user activities",
    });
  }
};

export const createActivityLog = async (req: Request, res: Response) => {
  try {
    const logId = await activityLogService.create(req.body);

    res.status(201).json({
      success: true,
      message: "Activity log created successfully",
      data: { id: logId },
    });
  } catch (error: any) {
    console.error("[createActivityLog]", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create activity log",
    });
  }
};
