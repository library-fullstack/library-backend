import { Request, Response } from "express";

import {
  getAllBook,
  getBookById,
  createBook,
  updateBookById,
  deleteBookById,
} from "../services/book.service.ts";
import { Book, BookInput } from "../models/book.model.ts";

const getAllBookController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const books = await getAllBook();

  if (!books) {
    res.status(404).json({ message: "Không tìm thấy sách" });
    return;
  }

  res.json(books);
};

const getBookByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const bookId = req.params.bookId;

  if (!bookId) {
    res.status(404).json({ message: "Không tìm thấy sách" });
    return;
  }

  const book = await getBookById(bookId);

  res.json(book);
};

const createBookController = async (
  req: Request<{}, {}, BookInput>,
  res: Response
): Promise<void> => {
  const { title, author, category, price, stock, description } = req.body;

  try {
    if (!title || !author || !category || !price || !stock) {
      res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
      return;
    }

    await createBook({
      title,
      author,
      category,
      price,
      stock,
      description,
    });

    res.status(201).json({ message: "Thêm sách thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

const updateBookByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { title, author, category, price, stock, description } = req.body;
  const bookId = req.params.userId;

  try {
    if (!title || !author || !category || !price || !stock) {
      res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
      return;
    }

    await updateBookById(
      {
        title,
        author,
        category,
        price,
        stock,
        description,
      },
      bookId
    );

    res.status(201).json({ message: "Thêm sách thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

const deleteBookByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const bookId = req.params.bookId;

  await deleteBookById(bookId);
};

export {
  getAllBookController,
  getBookByIdController,
  createBookController,
  updateBookByIdController,
  deleteBookByIdController,
};
