import { Request, Response } from "express";
import connection from "../config/db";

export const getAllBooks = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let sql = "SELECT * FROM books";
    const params: any[] = [];

    const conditions: string[] = [];
    if (search) {
      conditions.push("(title LIKE ? OR author LIKE ? OR isbn LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }
    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), offset);

    const [books] = await connection.execute(sql, params);

    // đếm tổng số sách
    let countSql = "SELECT COUNT(*) as total FROM books";
    if (conditions.length > 0) {
      countSql += " WHERE " + conditions.join(" AND ");
    }
    const [countRows] = await connection.execute(
      countSql,
      params.slice(0, params.length - 2)
    );
    const total = (countRows as any)[0]?.total || 0;

    res.json({
      success: true,
      data: books,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get books error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách sách",
    });
  }
};

export const getBookById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // lấy thông tin sách
    const [bookRows] = await connection.execute(
      "SELECT * FROM books WHERE id = ?",
      [id]
    );
    const book = (bookRows as any)[0];
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sách",
      });
    }

    // lấy danh sách bản sao
    const [copies] = await connection.execute(
      "SELECT id, copy_number, status FROM book_copies WHERE book_id = ?",
      [id]
    );
    const availableCopies = (copies as any[]).filter(
      (copy) => copy.status === "AVAILABLE"
    ).length;

    res.json({
      success: true,
      data: {
        ...book,
        copies,
        available_copies: availableCopies,
      },
    });
  } catch (error) {
    console.error("Get book error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin sách",
    });
  }
};

export const createBook = async (req: Request, res: Response) => {
  try {
    const {
      title,
      author,
      publisher,
      publication_year,
      isbn,
      call_number,
      language_code,
      format,
      category,
      description,
      thumbnail_url,
      total_copies,
    } = req.body;

    if (!title || !author || !publisher || !category) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
      });
    }

    if (!total_copies || total_copies < 1) {
      return res.status(400).json({
        success: false,
        message: "Số lượng bản sao phải lớn hơn 0",
      });
    }

    // thêm sách
    const [result]: any = await connection.execute(
      `INSERT INTO books 
        (title, author, publisher, publication_year, isbn, call_number, language_code, format, category, description, thumbnail_url, total_copies, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        title,
        author,
        publisher,
        publication_year ? Number(publication_year) : null,
        isbn || null,
        call_number || null,
        language_code || "vi",
        format || "PAPERBACK",
        category,
        description || null,
        thumbnail_url || null,
        Number(total_copies),
      ]
    );

    const bookId = result.insertId;

    // thêm các bản sao sách
    const copyValues = [];
    for (let i = 1; i <= total_copies; i++) {
      copyValues.push([bookId, i, "AVAILABLE"]);
    }
    await connection.query(
      "INSERT INTO book_copies (book_id, copy_number, status) VALUES ?",
      [copyValues]
    );

    // lấy lại thông tin sách vừa thêm
    const [bookRows] = await connection.execute(
      "SELECT * FROM books WHERE id = ?",
      [bookId]
    );
    const book = (bookRows as any)[0];

    res.status(201).json({
      success: true,
      data: book,
      message: "Thêm sách thành công",
    });
  } catch (error) {
    console.error("Create book error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi thêm sách",
    });
  }
};

export const updateBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      author,
      publisher,
      publication_year,
      isbn,
      call_number,
      language_code,
      format,
      category,
      description,
      thumbnail_url,
      total_copies,
    } = req.body;

    // kiểm tra sách tồn tại
    const [bookRows] = await connection.execute(
      "SELECT * FROM books WHERE id = ?",
      [id]
    );
    const existingBook = (bookRows as any)[0];
    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sách",
      });
    }

    // cập nhật thông tin sách
    await connection.execute(
      `UPDATE books SET 
        title = ?, author = ?, publisher = ?, publication_year = ?, isbn = ?, call_number = ?, language_code = ?, format = ?, category = ?, description = ?, thumbnail_url = ?
        WHERE id = ?`,
      [
        title ?? existingBook.title,
        author ?? existingBook.author,
        publisher ?? existingBook.publisher,
        publication_year ?? existingBook.publication_year,
        isbn ?? existingBook.isbn,
        call_number ?? existingBook.call_number,
        language_code ?? existingBook.language_code,
        format ?? existingBook.format,
        category ?? existingBook.category,
        description ?? existingBook.description,
        thumbnail_url ?? existingBook.thumbnail_url,
        id,
      ]
    );

    // xử lý cập nhật số lượng bản sao nếu có
    if (
      total_copies !== undefined &&
      Number(total_copies) !== existingBook.total_copies
    ) {
      // lấy danh sách bản sao hiện tại
      const [copiesRows] = await connection.execute(
        "SELECT * FROM book_copies WHERE book_id = ?",
        [id]
      );
      const copies = copiesRows as any[];
      const currentCopies = copies.length;
      const newTotal = Number(total_copies);

      if (newTotal < currentCopies) {
        // kiểm tra số bản đang được mượn
        const borrowedCount = copies.filter(
          (copy) => copy.status !== "AVAILABLE"
        ).length;

        if (newTotal < borrowedCount) {
          return res.status(400).json({
            success: false,
            message: `Không thể giảm số lượng xuống ${newTotal}. Hiện có ${borrowedCount} bản đang được mượn.`,
          });
        }

        // xoá các bản sao dư thừa (chỉ xóa bản AVAILABLE)
        const availableCopies = copies
          .filter((copy) => copy.status === "AVAILABLE")
          .slice(0, currentCopies - newTotal);

        if (availableCopies.length > 0) {
          await connection.query("DELETE FROM book_copies WHERE id IN (?)", [
            availableCopies.map((c) => c.id),
          ]);
        }
      } else if (newTotal > currentCopies) {
        // thêm bản sao mới
        const newCopies = [];
        for (let i = currentCopies + 1; i <= newTotal; i++) {
          newCopies.push([id, i, "AVAILABLE"]);
        }
        if (newCopies.length > 0) {
          await connection.query(
            "INSERT INTO book_copies (book_id, copy_number, status) VALUES ?",
            [newCopies]
          );
        }
      }

      // cập nhật lại tổng số bản sao
      await connection.execute(
        "UPDATE books SET total_copies = ? WHERE id = ?",
        [newTotal, id]
      );
    }

    // lấy lại thông tin sách sau cập nhật
    const [updatedRows] = await connection.execute(
      "SELECT * FROM books WHERE id = ?",
      [id]
    );
    const updatedBook = (updatedRows as any)[0];

    res.json({
      success: true,
      data: updatedBook,
      message: "Cập nhật sách thành công",
    });
  } catch (error) {
    console.error("Update book error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật sách",
    });
  }
};

export const deleteBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // kiểm tra sách tồn tại
    const [bookRows] = await connection.execute(
      "SELECT * FROM books WHERE id = ?",
      [id]
    );
    const book = (bookRows as any)[0];
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sách",
      });
    }

    // kiểm tra bản sao đang được mượn
    const [copiesRows] = await connection.execute(
      "SELECT * FROM book_copies WHERE book_id = ?",
      [id]
    );
    const hasBorrowedCopies = (copiesRows as any[]).some(
      (copy) => copy.status !== "AVAILABLE"
    );
    if (hasBorrowedCopies) {
      return res.status(400).json({
        success: false,
        message:
          "Không thể xóa sách này vì có bản sao đang được mượn hoặc không khả dụng. Vui lòng đợi tất cả các bản sao được trả về trước khi xóa.",
      });
    }

    // xoá tất cả bản sao
    await connection.execute("DELETE FROM book_copies WHERE book_id = ?", [id]);

    // xoá sách
    await connection.execute("DELETE FROM books WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Xóa sách thành công",
    });
  } catch (error) {
    console.error("Delete book error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa sách",
    });
  }
};
