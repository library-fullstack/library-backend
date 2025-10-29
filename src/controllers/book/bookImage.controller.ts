import { Request, Response } from "express";
import {
  getImagesByBookId,
  addBookImage,
  deleteBookImage,
} from "../../services/book/bookImage.service.ts";

const getImagesByBookController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookId = Number(req.params.bookId);
    const images = await getImagesByBookId(bookId);
    res.status(200).json(images);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

const addBookImageController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await addBookImage(req.body);
    res.status(201).json({ message: "Thêm ảnh sách thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

const deleteBookImageController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const imageId = Number(req.params.imageId);
    await deleteBookImage(imageId);
    res.status(200).json({ message: "Xoá ảnh thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export {
  getImagesByBookController,
  addBookImageController,
  deleteBookImageController,
};
