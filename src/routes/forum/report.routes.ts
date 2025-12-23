import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../../middlewares/cache.middleware.ts";
import ForumReportService from "../../services/forum/report.service.ts";

const router = Router();

router.post(
  "/",
  authMiddleware,
  invalidateCacheMiddleware(["forum:reports"]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { target_type, target_post_id, target_comment_id, reason } =
        req.body;

      if (!target_type || !reason) {
        res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp kiểu báo cáo và lý do",
        });
        return;
      }

      const report = await ForumReportService.createReport(
        {
          target_type,
          target_post_id,
          target_comment_id,
          reason,
        },
        userId
      );

      res.status(201).json({
        success: true,
        message: "Báo cáo được gửi thành công",
        data: report,
      });
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({
        success: false,
        message: "Không thể gửi báo cáo",
      });
    }
  }
);

router.get(
  "/",
  authMiddleware,
  cacheMiddleware(300, "forum:reports"),
  async (req: Request, res: Response) => {
    try {
      const userRole = (req as any).user?.role;

      if (!userRole || !["ADMIN", "MODERATOR"].includes(userRole)) {
        res.status(403).json({
          success: false,
          message: "Bạn không có quyền xem báo cáo",
        });
        return;
      }

      const status = req.query.status as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      let result;
      if (status) {
        result = await ForumReportService.getReportsByStatus(
          status,
          page,
          limit
        );
      } else {
        result = await ForumReportService.getAllReports(page, limit);
      }

      res.status(200).json({
        success: true,
        data: result.reports,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      console.error("Error getting reports:", error);
      res.status(500).json({
        success: false,
        message: "Không thể lấy danh sách báo cáo",
      });
    }
  }
);

router.put(
  "/:reportId",
  authMiddleware,
  invalidateCacheMiddleware(["forum:reports"]),
  async (req: Request, res: Response) => {
    try {
      const userRole = (req as any).user?.role;

      if (!userRole || !["ADMIN", "MODERATOR"].includes(userRole)) {
        res.status(403).json({
          success: false,
          message: "Bạn không có quyền cập nhật báo cáo",
        });
        return;
      }

      const { reportId } = req.params;
      const { status, resolution_note } = req.body;

      await ForumReportService.updateReport(parseInt(reportId), {
        status,
        handled_by: (req as any).user?.id,
        resolution_note,
      });

      res.status(200).json({
        success: true,
        message: "Cập nhật báo cáo thành công",
      });
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({
        success: false,
        message: "Không thể cập nhật báo cáo",
      });
    }
  }
);

export default router;
