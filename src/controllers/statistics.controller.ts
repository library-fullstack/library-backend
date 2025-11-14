import { Request, Response } from "express";
import statisticsService from "../services/statistics.service.ts";

const getDashboardStatsController = async (req: Request, res: Response) => {
  try {
    const stats = await statisticsService.getDashboardStatistics();
    console.log("[getDashboardStatsController] Stats:", stats);
    res.status(200).json(stats);
  } catch (error: any) {
    console.error("[getDashboardStatsController]", error);
    res.status(500).json({
      message: error.message || "Failed to fetch dashboard statistics",
    });
  }
};

const getBorrowManagementController = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    const result = await statisticsService.getBorrowManagement({
      page: Number(page),
      limit: Number(limit),
      search: search as string,
      status: status as string,
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error("[getBorrowManagementController]", error);
    res.status(500).json({
      message: error.message || "Failed to fetch borrow management data",
    });
  }
};

const updateBorrowStatusController = async (req: Request, res: Response) => {
  try {
    const { borrow_id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ message: "Status is required" });
      return;
    }

    await statisticsService.updateBorrowStatus(Number(borrow_id), status);

    res.status(200).json({ message: "Borrow status updated successfully" });
  } catch (error: any) {
    console.error("[updateBorrowStatusController]", error);
    res.status(500).json({
      message: error.message || "Failed to update borrow status",
    });
  }
};

const getBookManagementController = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    const result = await statisticsService.getBookManagement({
      page: Number(page),
      limit: Number(limit),
      search: search as string,
      status: status as string,
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error("[getBookManagementController]", error);
    res.status(500).json({
      message: error.message || "Failed to fetch book management data",
    });
  }
};

const getUserManagementController = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;

    const result = await statisticsService.getUserManagement({
      page: Number(page),
      limit: Number(limit),
      search: search as string,
      role: role as string,
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error("[getUserManagementController]", error);
    res.status(500).json({
      message: error.message || "Failed to fetch user management data",
    });
  }
};

export {
  getDashboardStatsController,
  getBorrowManagementController,
  updateBorrowStatusController,
  getBookManagementController,
  getUserManagementController,
};
