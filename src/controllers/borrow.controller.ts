import { Request, Response } from "express";
import type { AuthRequest } from "../types/errors.ts";
import BorrowService from "../services/borrow.service.ts";
import activityLogService from "../services/activityLog.service.ts";
import notificationService from "../services/notification.service.ts";
import { ActivityType } from "../models/activityLog.model.ts";
import {
  sendBorrowApprovedEmail,
  sendReturnedThankYouEmail,
} from "../utils/emailTemplates.ts";
import { BorrowStatus } from "../models/borrow.model.ts";
import { format, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import connection from "../config/db.ts";

export const BorrowController = {
  async createBorrow(req: AuthRequest, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: "Invalid request: items array required",
        });
        return;
      }

      const validItems = items.every(
        (item: any) =>
          item.book_id &&
          typeof item.book_id === "number" &&
          item.quantity &&
          typeof item.quantity === "number" &&
          item.quantity > 0
      );

      if (!validItems) {
        res.status(400).json({
          success: false,
          message: "Invalid item format: each item needs book_id and quantity",
        });
        return;
      }

      const result = await BorrowService.createBorrowFromCart(userId, items);

      const borrowId = result.data?.borrow_id || result.data?.id;

      await activityLogService.create({
        user_id: userId,
        type: ActivityType.BORROW,
        action: "CREATE_BORROW",
        target_type: "BORROW",
        target_id: borrowId?.toString(),
        description: `Tạo phiếu mượn ${items.length} đầu sách`,
        ip_address: req.ip || req.socket.remoteAddress,
        user_agent: req.get("user-agent"),
      });

      if (borrowId) {
        await notificationService.createBorrowNotification(
          userId,
          "BORROW_PENDING",
          borrowId,
          "Phiếu mượn đã được tạo",
          `Phiếu mượn ${items.length} đầu sách của bạn đang chờ xác nhận`
        );
      }

      res.status(201).json(result);
    } catch (error: any) {
      console.error("Error creating borrow:", error);

      if (error.code === "INSUFFICIENT_STOCK") {
        res.status(409).json({
          success: false,
          message: error.message,
          errors: error.errors,
          code: "INSUFFICIENT_STOCK",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi tạo yêu cầu mượn sách",
      });
    }
  },

  async getBorrowPreview(req: AuthRequest, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!id || isNaN(Number(id))) {
        res.status(400).json({ success: false, message: "Invalid borrow ID" });
        return;
      }

      const borrow = await BorrowService.getBorrowPreview(Number(id), userId);

      if (!borrow) {
        res
          .status(404)
          .json({ success: false, message: "Phiếu mượn không tồn tại" });
        return;
      }

      res.status(200).json({
        success: true,
        data: borrow,
      });
    } catch (error: any) {
      console.error("Error getting borrow preview:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi tải thông tin phiếu mượn",
      });
    }
  },

  async confirmBorrow(req: AuthRequest, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const { signature } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!id || isNaN(Number(id))) {
        res.status(400).json({ success: false, message: "Invalid borrow ID" });
        return;
      }

      if (
        !signature ||
        typeof signature !== "string" ||
        signature.trim().length === 0
      ) {
        res
          .status(400)
          .json({ success: false, message: "Chữ ký không hợp lệ" });
        return;
      }

      const result = await BorrowService.confirmBorrow({
        borrow_id: Number(id),
        user_id: userId,
        signature: signature.trim(),
      });

      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error confirming borrow:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Có lỗi xảy ra khi xác nhận phiếu mượn",
      });
    }
  },

  async getMyBorrows(req: AuthRequest, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { status } = req.query;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const borrows = await BorrowService.getUserBorrows(
        userId,
        status as string | undefined
      );

      res.status(200).json({
        success: true,
        data: borrows,
      });
    } catch (error: any) {
      console.error("Error getting user borrows:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi tải danh sách mượn sách",
      });
    }
  },

  async renewBorrow(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!id || isNaN(Number(id))) {
        res.status(400).json({ success: false, message: "Invalid borrow ID" });
        return;
      }

      const result = await BorrowService.renewBorrow(Number(id), userId);

      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error renewing borrow:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Có lỗi xảy ra khi gia hạn phiếu mượn",
      });
    }
  },

  async getAdminBorrows(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, status, search } = req.query;

      console.log("[getAdminBorrows Controller] Received params:", {
        page,
        limit,
        status,
        search,
      });

      const result = await BorrowService.getAdminBorrows({
        page: Number(page),
        limit: Number(limit),
        status: status as string | undefined,
        search: search as string | undefined,
      });

      console.log("[getAdminBorrows Controller] Result total:", result.total);

      res.status(200).json({
        success: true,
        data: result.borrows,
        pagination: {
          total: result.total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(result.total / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error("Error getting admin borrows:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi tải danh sách mượn sách",
      });
    }
  },

  async updateBorrowStatus(req: AuthRequest, res: Response) {
    try {
      const adminId = (req as any).user?.id;
      const { id } = req.params;
      const { status } = req.body;

      if (!adminId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!id || isNaN(Number(id))) {
        res.status(400).json({ success: false, message: "Invalid borrow ID" });
        return;
      }

      if (
        !status ||
        !Object.values(BorrowStatus).includes(status as BorrowStatus)
      ) {
        res
          .status(400)
          .json({ success: false, message: "Trạng thái không hợp lệ" });
        return;
      }

      await BorrowService.updateBorrowStatus(
        Number(id),
        status as BorrowStatus,
        adminId
      );

      const statusLabels: Record<string, string> = {
        PENDING: "chờ duyệt",
        APPROVED: "đã duyệt",
        REJECTED: "từ chối",
        BORROWED: "đã mượn",
        RETURNED: "đã trả",
        OVERDUE: "quá hạn",
      };

      await activityLogService.create({
        user_id: adminId,
        type: ActivityType.BORROW,
        action: `UPDATE_STATUS_${status}`,
        target_type: "BORROW",
        target_id: id.toString(),
        description: `Cập nhật trạng thái phiếu mượn #${id} thành ${statusLabels[status] || status}`,
        ip_address: req.ip || req.socket.remoteAddress,
        user_agent: req.get("user-agent"),
      });

      const borrow = await BorrowService.getBorrowById(Number(id));
      if (borrow && borrow.user_id) {
        if (status === BorrowStatus.APPROVED) {
          await notificationService.createBorrowNotification(
            borrow.user_id,
            "BORROW_APPROVED",
            Number(id),
            "Phiếu mượn đã được duyệt",
            `Phiếu mượn #${id} của bạn đã được duyệt. Vui lòng đến thư viện để nhận sách.`
          );
        } else if (status === BorrowStatus.CANCELLED) {
          await notificationService.createBorrowNotification(
            borrow.user_id,
            "BORROW_REJECTED",
            Number(id),
            "Phiếu mượn bị từ chối",
            `Phiếu mượn #${id} của bạn đã bị từ chối.`
          );
        }
      }

      if (status === BorrowStatus.RETURNED) {
        try {
          const borrow = await BorrowService.getBorrowById(Number(id));
          if (borrow) {
            const dueDate = new Date(borrow.due_date);
            const returnDate = new Date();
            const daysOverdue = Math.floor(
              (returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysOverdue >= 3) {
              const bookCount = borrow.items?.length || 1;
              const fineAmount = daysOverdue * bookCount * 2000;

              await connection.query(
                "UPDATE borrows SET fine = ? WHERE id = ?",
                [fineAmount, Number(id)]
              );

              console.log(
                `[FINE] Borrow #${id}: ${daysOverdue} days overdue, ${bookCount} books, fine = ${fineAmount} VND`
              );
            }
          }
        } catch (fineError: any) {
          console.error("Error calculating fine:", fineError);
        }
      }

      try {
        const borrow = await BorrowService.getBorrowById(Number(id));

        if (borrow && borrow.email) {
          const calculatePickupDate = (fromDate: Date): string => {
            const nextDay = addDays(fromDate, 1);
            const dayOfWeek = nextDay.getDay();

            if (dayOfWeek === 0) {
              return format(addDays(nextDay, 1), "dd/MM/yyyy (EEEE)", {
                locale: vi,
              });
            }
            if (dayOfWeek === 6) {
              return format(addDays(nextDay, 2), "dd/MM/yyyy (EEEE)", {
                locale: vi,
              });
            }

            return format(nextDay, "dd/MM/yyyy (EEEE)", { locale: vi });
          };

          if (status === BorrowStatus.APPROVED) {
            const pickupDate = calculatePickupDate(new Date());
            const dueDate = format(new Date(borrow.due_date), "dd/MM/yyyy", {
              locale: vi,
            });
            const ticketNumber = `BRW-${borrow.id.toString().padStart(6, "0")}`;

            await sendBorrowApprovedEmail(
              borrow.email,
              borrow.fullname,
              ticketNumber,
              borrow.items || [],
              pickupDate,
              dueDate
            );
          } else if (status === BorrowStatus.RETURNED) {
            const returnDate = format(new Date(), "dd/MM/yyyy", { locale: vi });
            const ticketNumber = `BRW-${borrow.id.toString().padStart(6, "0")}`;

            await sendReturnedThankYouEmail(
              borrow.email,
              borrow.fullname,
              ticketNumber,
              borrow.items || [],
              returnDate
            );
          }
        }
      } catch (emailError: any) {
        console.error("Error sending email notification:", emailError);
      }

      res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái thành công",
      });
    } catch (error: any) {
      console.error("Error updating borrow status:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Có lỗi xảy ra khi cập nhật trạng thái",
      });
    }
  },
};

export default BorrowController;
