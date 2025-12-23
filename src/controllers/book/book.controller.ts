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

    const totalCountResult = await countPublicBooks();
    const totalCount = Number(totalCountResult.total) || 0;

    const mappedBooks = books.map((book: any) => ({
      id: book.id,
      title: book.title,
      author_names: book.author_names || "Không rõ",
      category_name: book.category_name || "Khác",
      publisher_name: book.publisher_name || "Không rõ",
      publication_year: book.publication_year,
      isbn13: book.isbn13,
      call_number: book.call_number || null,
      language_code: book.language_code || "vi",
      format: book.format || null,
      description: book.description,
      thumbnail_url: book.thumbnail_url,
      copies_count: Number(book.copies_count) || 0,
      available_count: Number(book.available_count) || 0,
      author: book.author_names || "Không rõ",
      publisher: book.publisher_name || "Không rõ",
      isbn: book.isbn13,
      category: book.category_name || "Khác",
      total_copies: Number(book.copies_count) || 0,
      available_copies: Number(book.available_count) || 0,
      gallery_urls: [],
    }));

    res.status(200).json({
      success: true,
      data: mappedBooks,
      pagination: {
        total: totalCount,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || "Lỗi khi lấy danh sách sách",
    });
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

    const parsedBook = {
      ...book,
      copies_count: Number(book.copies_count) || 0,
      available_count: Number(book.available_count) || 0,
      call_number: book.call_number || null,
      language_code: book.language_code || "vi",
      format: book.format || null,
    };

    res.status(200).json(parsedBook);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi khi lấy thông tin sách" });
  }
};

// thêm sách mới
const createBookController = async (
  req: Request<{}, {}, any>,
  res: Response
): Promise<void> => {
  try {
    const rawData = req.body;
    if (!rawData.title) {
      res.status(400).json({ message: "Thiếu tên sách" });
      return;
    }

    // Import helpers
    const { findOrCreateAuthor, findOrCreatePublisher, findOrCreateCategory } =
      await import("../../services/helpers/entity-finder.service.js");

    // Handle author (string or string[] from frontend)
    let authorId = rawData.categoryId;
    const authorInput = rawData.author;
    if (authorInput && !authorId) {
      const authorName = Array.isArray(authorInput)
        ? authorInput[0]
        : authorInput;
      authorId = await findOrCreateAuthor(authorName);
    }

    // Handle publisher (string from frontend)
    let publisherId = rawData.publisherId;
    if (rawData.publisher && !publisherId) {
      publisherId = await findOrCreatePublisher(rawData.publisher);
    }

    // Handle category (string from frontend)
    let categoryId = rawData.categoryId;
    if (rawData.category && !categoryId) {
      categoryId = await findOrCreateCategory(rawData.category);
    }

    const bookId = await createBook({
      title: rawData.title,
      categoryId: categoryId ?? null,
      publisherId: publisherId ?? null,
      publicationYear:
        (rawData.publication_year || rawData.publicationYear) ?? null,
      isbn13: (rawData.isbn || rawData.isbn13) ?? null,
      callNumber: (rawData.call_number || rawData.callNumber) ?? null,
      languageCode: (rawData.language_code || rawData.languageCode) ?? "vi",
      format: rawData.format ?? null,
      status: rawData.status ?? "ACTIVE",
      description: rawData.description ?? null,
      thumbnailUrl: (rawData.thumbnail_url || rawData.thumbnailUrl) ?? null,
    });

    const connection = (await import("../../config/db.js")).default;

    // Thêm tác giả vào sách nếu có
    if (authorId) {
      await connection.query(
        "INSERT INTO book_authors (book_id, author_id, ord) VALUES (?, ?, 1)",
        [bookId, authorId]
      );
    }

    // Tạo book copies nếu có total_copies
    const totalCopies = rawData.total_copies || rawData.totalCopies || 1;
    if (totalCopies > 0) {
      const copyValues = [];
      for (let i = 1; i <= totalCopies; i++) {
        copyValues.push(
          `(${bookId}, 'BC-${bookId}-${String(i).padStart(3, "0")}', 'AVAILABLE')`
        );
      }
      await connection.query(
        `INSERT INTO book_copies (book_id, barcode, status) VALUES ${copyValues.join(", ")}`
      );
    }

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

    const rawData = req.body;
    if (!rawData.title) {
      res.status(400).json({ message: "Thiếu tên sách" });
      return;
    }

    // Import helpers
    const { findOrCreateAuthor, findOrCreatePublisher, findOrCreateCategory } =
      await import("../../services/helpers/entity-finder.service.js");

    // Convert names to IDs if provided
    let authorId = rawData.authorId;
    let publisherId = rawData.publisherId;
    let categoryId = rawData.categoryId;

    if (rawData.author && !authorId) {
      authorId = await findOrCreateAuthor(rawData.author);
    }

    if (rawData.publisher && !publisherId) {
      publisherId = await findOrCreatePublisher(rawData.publisher);
    }

    if (rawData.category && !categoryId) {
      categoryId = await findOrCreateCategory(rawData.category);
    }

    // Fetch current book to preserve fields not provided in update
    const currentBook = await getBookById(bookId);
    if (!currentBook) {
      res.status(404).json({ message: "Không tìm thấy sách" });
      return;
    }

    // Build backend format data - merge with current data to preserve unprovided fields
    const data: BookInput = {
      title: rawData.title || currentBook.title,
      categoryId: categoryId || currentBook.category_id || null,
      publisherId: publisherId || currentBook.publisher_id || null,
      publicationYear:
        rawData.publication_year ||
        rawData.publicationYear ||
        currentBook.publication_year ||
        null,
      isbn13: rawData.isbn || rawData.isbn13 || currentBook.isbn13 || null,
      callNumber:
        rawData.call_number ||
        rawData.callNumber ||
        currentBook.call_number ||
        null,
      languageCode:
        rawData.language_code ||
        rawData.languageCode ||
        currentBook.language_code ||
        "vi",
      format: rawData.format || currentBook.format || null,
      description: rawData.description || currentBook.description || null,
      thumbnailUrl:
        rawData.thumbnail_url ||
        rawData.thumbnailUrl ||
        currentBook.thumbnail_url ||
        null,
    };

    await updateBookById(data, bookId);

    // Update book copies nếu có total_copies
    const totalCopiesInput = rawData.total_copies || rawData.totalCopies;
    if (totalCopiesInput !== undefined) {
      const connection = (await import("../../config/db.js")).default;

      // Đếm số copies hiện tại
      const [currentCopies] = await connection.query<any[]>(
        "SELECT COUNT(*) as count FROM book_copies WHERE book_id = ?",
        [bookId]
      );
      const currentCount = currentCopies[0]?.count || 0;
      const newCount = totalCopiesInput;

      if (newCount > currentCount) {
        // Thêm copies mới
        const copyValues = [];
        for (let i = currentCount + 1; i <= newCount; i++) {
          copyValues.push(
            `(${bookId}, 'BC-${bookId}-${String(i).padStart(3, "0")}', 'AVAILABLE')`
          );
        }
        await connection.query(
          `INSERT INTO book_copies (book_id, barcode, status) VALUES ${copyValues.join(", ")}`
        );
      } else if (newCount < currentCount) {
        // Xóa copies thừa (chỉ xóa AVAILABLE copies)
        const toDelete = currentCount - newCount;
        await connection.query(
          `DELETE FROM book_copies WHERE book_id = ? AND status = 'AVAILABLE' LIMIT ?`,
          [bookId, toDelete]
        );
      }
    }

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
      res.status(400).json({
        success: false,
        message: "bookId không hợp lệ",
      });
      return;
    }

    const role = (req as any).user?.role || "LIBRARIAN";
    await deleteBookById(bookId, role);

    res.status(200).json({
      success: true,
      message: "Xoá sách thành công",
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message || "Lỗi khi xoá sách",
    });
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
