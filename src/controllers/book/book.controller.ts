import { Request, Response } from "express";
import {
  getAllBooks,
  getBookById,
  createBook,
  updateBookById,
  deleteBookById,
  updateBookStatus,
  countBookStats,
  isBookAvailable,
} from "../../services/book/book.service.ts";
import { BookInput, BookInputFull } from "../../models/book.model.ts";

// Lấy danh sách sách
const getAllBooksController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const filters = {
      keyword: req.query.keyword as string,
      categoryId: req.query.categoryId
        ? Number(req.query.categoryId)
        : undefined,
      status: req.query.status as string,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    };

    const books = await getAllBooks(filters);
    res.status(200).json(books);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi khi lấy danh sách sách" });
  }
};

// Lấy chi tiết 1 sách theo ID
const getBookByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
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

    res.status(200).json(book);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi khi lấy thông tin sách" });
  }
};

// Thêm mới sách
const createBookController = async (
  req: Request<{}, {}, BookInputFull>,
  res: Response
): Promise<void> => {
  try {
    const data = req.body;
    if (!data.title) {
      res.status(400).json({ message: "Thiếu tên sách" });
      return;
    }

    await createBook({
      title: data.title,
      categoryId: data.categoryId ?? null,
      publisherId: data.publisherId ?? null,
      publicationYear: data.publicationYear ?? null,
      isbn13: data.isbn13 ?? null,
      callNumber: data.callNumber ?? null,
      languageCode: data.languageCode ?? "vi",
      format: data.format ?? null,
      status: data.status ?? "ACTIVE",
      description: data.description ?? null,
      thumbnailUrl: data.thumbnailUrl ?? null,
    });

    res.status(201).json({ message: "Thêm sách thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Lỗi khi thêm sách" });
  }
};

// Cập nhật sách theo ID
const updateBookByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookId = Number(req.params.bookId);
    if (!Number.isInteger(bookId)) {
      res.status(400).json({ message: "bookId không hợp lệ" });
      return;
    }

    const data = req.body as BookInput;
    if (!data.title) {
      res.status(400).json({ message: "Thiếu tên sách" });
      return;
    }

    await updateBookById(data, bookId);
    res.status(200).json({ message: "Cập nhật sách thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Lỗi khi cập nhật sách" });
  }
};

// Xoá sách theo ID
const deleteBookByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookId = Number(req.params.bookId);
    if (!Number.isInteger(bookId)) {
      res.status(400).json({ message: "bookId không hợp lệ" });
      return;
    }

    const role = (req as any).user?.role || "LIBRARIAN";
    await deleteBookById(bookId, role);

    res.status(200).json({ message: "Xoá sách thành công" });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Lỗi khi xoá sách" });
  }
};

// Cập nhật trạng thái sách (ADMIN hoặc LIBRARIAN)
const updateBookStatusController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookId = Number(req.params.bookId);
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ message: "Thiếu trạng thái cần cập nhật" });
      return;
    }
    await updateBookStatus(bookId, status);
    res
      .status(200)
      .json({ message: `Cập nhật trạng thái sách #${bookId} thành ${status}` });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Thống kê sách (ADMIN)
const getBookStatsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const stats = await countBookStats();
    res.status(200).json(stats);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Kiểm tra sách có còn bản khả dụng không (cho borrow)
const checkBookAvailableController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookId = Number(req.params.bookId);
    const available = await isBookAvailable(bookId);
    res.status(200).json({ bookId, available });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export {
  getAllBooksController,
  getBookByIdController,
  createBookController,
  updateBookByIdController,
  deleteBookByIdController,
  updateBookStatusController,
  getBookStatsController,
  checkBookAvailableController,
};
