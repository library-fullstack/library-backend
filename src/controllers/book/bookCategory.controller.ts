import { Request, Response } from "express";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/book/bookCategory.service.ts";

const getAllCategoriesController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await getAllCategories();
    res.status(200).json(categories);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

const createCategoryController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, parent_id } = req.body;
    await createCategory(name, parent_id);
    res.status(201).json({ message: "Thêm danh mục thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

const updateCategoryController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { name, parent_id } = req.body;
    await updateCategory(id, name, parent_id);
    res.status(200).json({ message: "Cập nhật danh mục thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

const deleteCategoryController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await deleteCategory(id);
    res.status(200).json({ message: "Xoá danh mục thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export {
  getAllCategoriesController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
};
