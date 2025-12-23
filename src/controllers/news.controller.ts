import { Request, Response } from "express";
import NewsService from "../services/news.service.ts";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import type {
  CreateNewsInput,
  UpdateNewsInput,
  NewsListFilter,
} from "../models/news.model.ts";

export const getAllNews = async (req: Request, res: Response) => {
  try {
    const filter: NewsListFilter = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      category: req.query.category as any,
      status: req.query.status as any,
      search: req.query.search as string,
      author_id: req.query.author_id as string,
    };

    const result = await NewsService.getAll(filter);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    console.error("[News Controller] Get all error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách tin tức",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getNewsById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const news = await NewsService.getById(id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tin tức",
      });
    }

    res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error("[News Controller] Get by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin tin tức",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getNewsBySlug = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;

    const news = await NewsService.getBySlug(slug);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tin tức",
      });
    }

    res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error("[News Controller] Get by slug error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin tin tức",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createNews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, category, status, thumbnail_url } = req.body;
    const author_id = req.userId!;

    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin (tiêu đề, nội dung, danh mục)",
      });
    }

    if (title.length < 5 || title.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề phải từ 5-150 ký tự",
      });
    }

    if (content.length < 20) {
      return res.status(400).json({
        success: false,
        message: "Nội dung phải có ít nhất 20 ký tự",
      });
    }

    const input: CreateNewsInput = {
      title: title.trim(),
      content: content.trim(),
      category,
      status: status || "PUBLISHED",
      author_id,
      thumbnail_url,
    };

    const news = await NewsService.create(input);

    res.status(201).json({
      success: true,
      message: "Tạo tin tức thành công",
      data: news,
    });
  } catch (error) {
    console.error("[News Controller] Create error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tạo tin tức",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateNews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const { title, content, category, status, thumbnail_url } = req.body;

    if (title !== undefined && (title.length < 5 || title.length > 150)) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề phải từ 5-150 ký tự",
      });
    }

    if (content !== undefined && content.length < 20) {
      return res.status(400).json({
        success: false,
        message: "Nội dung phải có ít nhất 20 ký tự",
      });
    }

    const input: UpdateNewsInput = {
      title: title?.trim(),
      content: content?.trim(),
      category,
      status,
      thumbnail_url,
    };

    const news = await NewsService.update(id, input);

    res.status(200).json({
      success: true,
      message: "Cập nhật tin tức thành công",
      data: news,
    });
  } catch (error) {
    console.error("[News Controller] Update error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật tin tức",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteNews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const news = await NewsService.getById(id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tin tức",
      });
    }

    await NewsService.delete(id);

    res.status(200).json({
      success: true,
      message: "Xóa tin tức thành công",
    });
  } catch (error) {
    console.error("[News Controller] Delete error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể xóa tin tức",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getLatestNews = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const news = await NewsService.getLatestNews(limit);

    res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error("[News Controller] Get latest error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy tin tức mới nhất",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
