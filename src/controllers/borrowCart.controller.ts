import { Request, Response } from "express";
import type { ApiError, AuthRequest } from "../types/errors.ts";
import BorrowCartService from "../services/borrowCart.service.ts";

export const BorrowCartController = {
  async getCart(req: AuthRequest, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { items, summary } =
        await BorrowCartService.getCartWithSummary(userId);

      console.log(
        `[getCart] User ${userId} has ${items?.length || 0} items in cart`
      );

      res.json({
        success: true,
        data: {
          items,
          summary,
        },
      });
    } catch (error) {
      const err = error as ApiError;
      console.error("Error getting cart:", error);
      throw error;
    }
  },

  async addItem(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { bookId, quantity } = req.body;

      console.log(
        `[addItem] Received: bookId=${bookId}, quantity=${quantity}, userId=${userId}`
      );

      if (!userId) {
        console.log(`[addItem] No userId`);
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!bookId || quantity === undefined || quantity < 1) {
        console.log(
          `[addItem] Invalid params: bookId=${bookId}, quantity=${quantity}`
        );
        res.status(400).json({
          success: false,
          message: "Invalid request: bookId and quantity required",
        });
        return;
      }

      await BorrowCartService.addItem(userId, bookId, quantity);
      const { items, summary } =
        await BorrowCartService.getCartWithSummary(userId);

      res.status(201).json({
        success: true,
        data: {
          items,
          summary,
        },
      });
    } catch (error) {
      const err = error as any;
      console.error("Error adding item to cart:", error);

      if (err.code === "OUT_OF_STOCK") {
        console.log(`[addItem] OUT_OF_STOCK: ${err.message}`);
        return res.status(400).json({
          success: false,
          message: err.message,
          code: "OUT_OF_STOCK",
        });
      }

      if (err.code === "EXCEEDS_AVAILABILITY") {
        console.log(`[addItem] EXCEEDS_AVAILABILITY: ${err.message}`);
        return res.status(400).json({
          success: false,
          message: err.message,
          code: "EXCEEDS_AVAILABILITY",
        });
      }

      // Handle database duplicate entry error
      if (err.code === "ER_DUP_ENTRY") {
        console.log(`[addItem] ER_DUP_ENTRY`);
        return res.status(409).json({
          success: false,
          message:
            "This item is already in your cart. Try updating quantity instead.",
        });
      }

      if (err.code === "ER_LOCK_DEADLOCK") {
        console.log(
          `[addItem] DEADLOCK detected - instructing client to retry`
        );
        return res.status(409).json({
          success: false,
          message:
            "Có người khác đang thao tác với cuốn sách này. Vui lòng thử lại.",
          code: "CONFLICT",
        });
      }

      throw error;
    }
  },

  async updateQuantity(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { bookId, quantity } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!bookId || quantity === undefined || quantity < 0) {
        res.status(400).json({
          success: false,
          message: "Invalid request: bookId and quantity required",
        });
        return;
      }

      await BorrowCartService.updateQuantity(userId, bookId, quantity);
      const { items, summary } =
        await BorrowCartService.getCartWithSummary(userId);

      res.json({
        success: true,
        data: {
          items,
          summary,
        },
      });
    } catch (error) {
      const err = error as any;
      console.error("Error updating cart item:", error);

      if (err.code === "OUT_OF_STOCK") {
        console.log(`[updateQuantity] OUT_OF_STOCK: ${err.message}`);
        return res.status(400).json({
          success: false,
          message: err.message,
          code: "OUT_OF_STOCK",
        });
      }

      if (err.code === "EXCEEDS_AVAILABILITY") {
        console.log(`[updateQuantity] EXCEEDS_AVAILABILITY: ${err.message}`);
        return res.status(400).json({
          success: false,
          message: err.message,
          code: "EXCEEDS_AVAILABILITY",
        });
      }

      if (err.code === "ER_LOCK_DEADLOCK") {
        console.log(
          `[updateQuantity] DEADLOCK detected - instructing client to retry`
        );
        return res.status(409).json({
          success: false,
          message:
            "Có người khác đang thao tác với cuốn sách này. Vui lòng thử lại.",
          code: "CONFLICT",
        });
      }

      throw error;
    }
  },

  async removeItem(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { bookId } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!bookId) {
        res.status(400).json({
          success: false,
          message: "Invalid request: bookId required",
        });
        return;
      }

      await BorrowCartService.removeItem(userId, bookId);
      const { items, summary } =
        await BorrowCartService.getCartWithSummary(userId);

      res.json({
        success: true,
        data: {
          items,
          summary,
        },
      });
    } catch (error) {
      const err = error as ApiError;
      console.error("Error removing cart item:", error);
      throw error;
    }
  },

  async clearCart(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      await BorrowCartService.clearCart(userId);

      res.json({
        success: true,
        data: { message: "Cart cleared" },
      });
    } catch (error) {
      const err = error as ApiError;
      console.error("Error clearing cart:", error);
      throw error;
    }
  },

  async getCartSummary(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const summary = await BorrowCartService.getCartSummary(userId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      const err = error as ApiError;
      console.error("Error getting cart summary:", error);
      throw error;
    }
  },
};

export default BorrowCartController;
