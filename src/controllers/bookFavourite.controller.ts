import { Request, Response } from "express";
import type { ApiError, AuthRequest } from "../types/errors";
import BookFavouriteService from "../services/bookFavourite.service";

export const BookFavouriteController = {
  async getFavourites(req: AuthRequest, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const favourites = await BookFavouriteService.getFavourites(userId);

      res.json({
        success: true,
        data: favourites,
      });
    } catch (error) {
      const err = error as ApiError;
      console.error("Error getting favourites:", error);
      throw error;
    }
  },

  async addFavourite(req: Request, res: Response) {
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

      await BookFavouriteService.addFavourite(userId, bookId);
      const favourites = await BookFavouriteService.getFavourites(userId);

      res.status(201).json({
        success: true,
        data: favourites,
      });
    } catch (error) {
      const err = error as any;
      console.error("Error adding favourite:", error);

      if (err.code === "BOOK_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: err.message,
          code: "BOOK_NOT_FOUND",
        });
      }

      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          success: false,
          message: "Sách này đã có trong danh sách yêu thích",
        });
      }

      throw error;
    }
  },

  async removeFavourite(req: Request, res: Response) {
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

      await BookFavouriteService.removeFavourite(userId, bookId);
      const favourites = await BookFavouriteService.getFavourites(userId);

      res.json({
        success: true,
        data: favourites,
      });
    } catch (error) {
      const err = error as ApiError;
      console.error("Error removing favourite:", error);
      throw error;
    }
  },

  async checkFavourite(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { bookId } = req.params;

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

      const result = await BookFavouriteService.checkFavourite(
        userId,
        parseInt(bookId)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const err = error as ApiError;
      console.error("Error checking favourite:", error);
      throw error;
    }
  },

  async getFavouriteCount(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const count = await BookFavouriteService.getFavouriteCount(userId);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      const err = error as ApiError;
      console.error("Error getting favourite count:", error);
      throw error;
    }
  },
};

export default BookFavouriteController;
