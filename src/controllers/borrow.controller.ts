import { Request, Response } from "express";
import type { AuthRequest } from "../types/errors.ts";
import BorrowService from "../services/borrow.service.ts";

export const BorrowController = {
  /**
   * Create borrow from cart items
   * POST /api/v1/borrows
   */
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

      // Validate items format
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

      res.status(201).json(result);
    } catch (error: any) {
      console.error("Error creating borrow:", error);

      // Handle insufficient stock error with detailed information
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
};

export default BorrowController;
