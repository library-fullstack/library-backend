import { Request, Response } from "express";
import {
  getAllTags,
  createTag,
  attachTagToBook,
  detachTagFromBook,
} from "../../services/book/tag.service.ts";

const getAllTagsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tags = await getAllTags();
    res.status(200).json(tags);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

const createTagController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.body;
    await createTag(name);
    res.status(201).json({ message: "Thêm tag thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

const attachTagToBookController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { book_id, tag_id } = req.body;
    await attachTagToBook(book_id, tag_id);
    res.status(201).json({ message: "Gắn tag cho sách thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

const detachTagFromBookController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { book_id, tag_id } = req.body;
    await detachTagFromBook(book_id, tag_id);
    res.status(200).json({ message: "Bỏ tag khỏi sách thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export {
  getAllTagsController,
  createTagController,
  attachTagToBookController,
  detachTagFromBookController,
};
