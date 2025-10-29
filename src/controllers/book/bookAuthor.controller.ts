import { Request, Response } from "express";
import {
  getAuthorsByBookId,
  addAuthorToBook,
  removeAuthorFromBook,
} from "../../services/book/bookAuthor.service.ts";

const getAuthorsByBookController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookId = Number(req.params.bookId);
    const authors = await getAuthorsByBookId(bookId);
    res.status(200).json(authors);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

const addAuthorToBookController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookId = Number(req.params.bookId);
    const { author_id, role, ord } = req.body;
    await addAuthorToBook(bookId, author_id, role, ord);
    res.status(201).json({ message: "Thêm tác giả vào sách thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

const removeAuthorFromBookController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookId = Number(req.params.bookId);
    const authorId = Number(req.params.authorId);
    await removeAuthorFromBook(bookId, authorId);
    res.status(200).json({ message: "Xoá tác giả khỏi sách thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export {
  getAuthorsByBookController,
  addAuthorToBookController,
  removeAuthorFromBookController,
};
