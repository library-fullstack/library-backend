import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../../middlewares/cache.middleware.ts";
import {
  requireRole,
  requireAdmin,
} from "../../middlewares/forum-auth.middleware.ts";
import {
  ForumCategoryController,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from "../../controllers/forum/category.controller.ts";

const router = Router();

// GET - Get all categories (PUBLIC)
router.get("/", cacheMiddleware(600, "forum:categories"), async (req, res) => {
  await ForumCategoryController.getAllCategories(req, res);
});

// GET - Get single category (PUBLIC)
router.get(
  "/:id",
  cacheMiddleware(600, "forum:category:"),
  async (req, res) => {
    await ForumCategoryController.getCategoryById(req, res);
  }
);

// POST - Create category (ADMIN only)
router.post(
  "/",
  authMiddleware,
  requireRole(["ADMIN"]),
  invalidateCacheMiddleware(["forum:categories"]),
  async (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name || name.trim().length < 3) {
        res.status(400).json({
          success: false,
          message: "Category name must be at least 3 characters",
        });
        return;
      }

      const category = await ForumCategoryController.createCategory(
        {
          name: name.trim(),
          description: description?.trim() || "",
        },
        req,
        res
      );

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
  }
);

// PATCH - Update category (ADMIN only)
router.patch(
  "/:id",
  authMiddleware,
  requireRole(["ADMIN"]),
  invalidateCacheMiddleware(["forum:categories", "forum:category:"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const category = await ForumCategoryController.updateCategory(
        parseInt(id),
        {
          name: name?.trim(),
          description: description?.trim(),
        },
        req,
        res
      );

      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: category,
      });
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update category",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// DELETE - Delete category (ADMIN only)
router.delete(
  "/:id",
  authMiddleware,
  requireRole(["ADMIN"]),
  invalidateCacheMiddleware(["forum:categories", "forum:category:"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      await ForumCategoryController.deleteCategory(parseInt(id), req, res);

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
  }
);

// Admin routes for managing categories with permissions
router.post(
  "/admin/create",
  authMiddleware,
  requireAdmin,
  invalidateCacheMiddleware(["forum:*"]),
  adminCreateCategory
);

router.put(
  "/admin/:id",
  authMiddleware,
  requireAdmin,
  invalidateCacheMiddleware(["forum:*"]),
  adminUpdateCategory
);

router.delete(
  "/admin/:id",
  authMiddleware,
  requireAdmin,
  invalidateCacheMiddleware(["forum:*"]),
  adminDeleteCategory
);

export default router;
