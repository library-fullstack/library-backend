import { Request, Response } from "express";

import {
  getAllBook,
  getBookById,
  createBook,
  updateBookById,
  deleteBookById,
} from "../services/book.service.ts";
import { Book, BookInput } from "../models/book.model.ts";

// get all book
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

// get book theo id
const getBookByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const bookId = Number(req.params.bookId);
  if (!Number.isInteger(bookId)) {
    res.status(400).json({ message: "bookId không hợp lệ" });
    return;
  }
  const book = await getBookById(bookId);
  if (!book) {
    res.status(404).json({ message: "Không tìm thấy sách" });
    return;
  }
  res.json(book);
};

// tạo book
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

// update book theo id
const updateBookByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const bookId = Number(req.params.bookId); // was userId (bug)
  const { title, author, category, price, stock, description } = req.body;

  if (!Number.isInteger(bookId)) {
    res.status(400).json({ message: "bookId không hợp lệ" });
    return;
  }
  if (!title || !author || !category || price == null || stock == null) {
    res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    return;
  }
  await updateBookById(
    { title, author, category, price, stock, description },
    bookId
  );
  res.status(200).json({ message: "Cập nhật sách thành công" });
};

// xoá book theo id
const deleteBookByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const bookId = Number(req.params.bookId);
  if (!Number.isInteger(bookId)) {
    res.status(400).json({ message: "bookId không hợp lệ" });
    return;
  }
  await deleteBookById(bookId);
  res.status(200).json({ message: "Xoá sách thành công" });
};

export {
  getAllBookController,
  getBookByIdController,
  createBookController,
  updateBookByIdController,
  deleteBookByIdController,
};
