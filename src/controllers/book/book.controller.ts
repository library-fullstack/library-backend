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
  countPublicBooks,
} from "../../services/book/book.service.ts";
import { BookInput, BookInputFull } from "../../models/book.model.ts";
import { isValidBookSort } from "../../types/common.ts";

// lấy danh sách sách
const getAllBooksController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // xác nhận và ép kiểu tham số sort_by
    const sortBy = req.query.sort_by as string;
    if (sortBy && !isValidBookSort(sortBy)) {
      res.status(400).json({
        message: `Invalid sort_by value. Allowed: newest, oldest, title_asc, title_desc, popular`,
      });
      return;
    }

    // Xác nhận searchType param
    const searchType = (req.query.searchType || "all") as string;
    const validSearchTypes = ["all", "author", "title", "publisher"];
    if (!validSearchTypes.includes(searchType)) {
      res.status(400).json({
        message: `Invalid searchType value. Allowed: all, author, title, publisher`,
      });
      return;
    }

    const filters = {
      keyword: req.query.keyword as string,
      categoryId: req.query.category_id
        ? Number(req.query.category_id)
        : undefined,
      status: req.query.status as string,
      searchType: searchType as "all" | "author" | "title" | "publisher",
      sortBy: isValidBookSort(sortBy) ? sortBy : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 12,
      offset: req.query.offset ? Number(req.query.offset) : 0,
      cursor: req.query.cursor ? Number(req.query.cursor) : undefined,
    };

    const books = await getAllBooks(filters);
    res.status(200).json(books);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi khi lấy danh sách sách" });
  }
};

// lấy chi  tiết sách theo id
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

// thêm sách mới
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

// cập nhật sách theo id
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

// xoá sách theo id
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

// cập nhật trạng thái sách (ADMIN hoặc LIBRARIAN)
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

// thống kê sách (ADMIN)
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

// kiểm tra sách có còn bản khả dụng không (cho borrow)
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

// lấy tổng số sách ACTIVE (không cần auth - cho mọi người)
const getPublicBookCountController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const count = await countPublicBooks();
    res.status(200).json(count);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
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
  getPublicBookCountController,
};
