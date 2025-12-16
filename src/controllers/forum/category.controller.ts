import { Request, Response } from "express";
import type { AuthRequest } from "../../types/errors.ts";
import ForumCategoryService from "../../services/forum/category.service.ts";

export const ForumCategoryController = {
  async getAllCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await ForumCategoryService.getAllCategories();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error("Error getting categories:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Error details:", errorMessage);
      res.status(500).json({
        success: false,
        message: "Không thể lấy danh sách chủ đề",
        error:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      });
    }
  },

  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const category = await ForumCategoryService.getCategoryWithChildren(
        parseInt(id)
      );

      if (!category) {
        res.status(404).json({
          success: false,
          message: "Chủ đề không tồn tại",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      console.error("Error getting category:", error);
      res.status(500).json({
        success: false,
        message: "Không thể lấy thông tin chủ đề",
      });
    }
  },

  // Helper method for creating category
  async createCategory(
    input: { name: string; description?: string },
    req: Request,
    res: Response
  ): Promise<unknown> {
    try {
      const category = await ForumCategoryService.createCategory({
        name: input.name,
        slug: input.name.toLowerCase().replace(/\s+/g, "-"),
        description: input.description || "",
      });
      return category;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },

  // Helper method for updating category
  async updateCategory(
    categoryId: number,
    input: { name?: string; description?: string },
    req: Request,
    res: Response
  ): Promise<unknown> {
    try {
      const updates: Record<string, unknown> = {};
      if (input.name) updates.name = input.name;
      if (input.description) updates.description = input.description;

      const updated = await ForumCategoryService.updateCategory(
        categoryId,
        updates as any
      );
      return updated;
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  },

  // Helper method for deleting category
  async deleteCategory(
    categoryId: number,
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      await ForumCategoryService.deleteCategory(categoryId);
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  },

  async createCategoryOriginal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userRole = (req as any).user?.role;

      if (!userRole || !["ADMIN", "MODERATOR"].includes(userRole)) {
        res.status(403).json({
          success: false,
          message: "Bạn không có quyền tạo chủ đề",
        });
        return;
      }

      const { name, slug, parent_id, description, sort_order, is_locked } =
        req.body;

      if (!name || !slug) {
        res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp tên và slug cho chủ đề",
        });
        return;
      }

      const category = await ForumCategoryService.createCategory({
        name,
        slug,
        parent_id,
        description,
        sort_order,
        is_locked,
      });

      res.status(201).json({
        success: true,
        message: "Tạo chủ đề thành công",
        data: category,
      });
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({
        success: false,
        message: "Không thể tạo chủ đề",
      });
    }
  },

  async updateCategoryOriginal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userRole = (req as any).user?.role;

      if (!userRole || !["ADMIN", "MODERATOR"].includes(userRole)) {
        res.status(403).json({
          success: false,
          message: "Bạn không có quyền chỉnh sửa chủ đề",
        });
        return;
      }

      const { id } = req.params;
      const updates = req.body;

      await ForumCategoryService.updateCategory(parseInt(id), updates);

      res.status(200).json({
        success: true,
        message: "Cập nhật chủ đề thành công",
      });
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({
        success: false,
        message: "Không thể cập nhật chủ đề",
      });
    }
  },

  async deleteCategoryOriginal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userRole = (req as any).user?.role;

      if (userRole !== "ADMIN") {
        res.status(403).json({
          success: false,
          message: "Chỉ admin mới có thể xóa chủ đề",
        });
        return;
      }

      const { id } = req.params;

      await ForumCategoryService.deleteCategory(parseInt(id));

      res.status(200).json({
        success: true,
        message: "Xóa chủ đề thành công",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({
        success: false,
        message: "Không thể xóa chủ đề",
      });
    }
  },
};

// Admin methods
export const adminCreateCategory = async (req: any, res: Response) => {
  try {
    const { name, slug, description, sort_order, is_locked, allowed_roles } =
      req.body;

    if (!name || !slug) {
      res.status(400).json({
        success: false,
        message: "Name and slug are required",
      });
      return;
    }

    const category = await ForumCategoryService.createCategory({
      name,
      slug,
      description,
      sort_order,
      is_locked,
      allowed_roles,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const adminUpdateCategory = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, description, sort_order, is_locked, allowed_roles } =
      req.body;

    const categoryId = parseInt(id);
    if (isNaN(categoryId)) {
      res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
      return;
    }

    await ForumCategoryService.updateCategory(categoryId, {
      name,
      slug,
      description,
      sort_order,
      is_locked,
      allowed_roles,
    });

    const updated =
      await ForumCategoryService.getCategoryWithChildren(categoryId);

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const adminDeleteCategory = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
      return;
    }

    await ForumCategoryService.deleteCategory(categoryId);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
