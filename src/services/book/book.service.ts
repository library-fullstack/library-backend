import connection from "../../config/db.ts";
import { Book, BookInput, BookInputFull } from "../../models/book.model.ts";
import { BookFilters, isValidBookSort } from "../../types/common.ts";
import { RowDataPacket } from "mysql2";

const getAllBooks = async (filters?: BookFilters): Promise<Book[]> => {
  let orderByClause =
    "COALESCE(b.publication_year, 9999) DESC, b.created_at DESC";

  switch (filters?.sortBy) {
    case "newest":
      orderByClause =
        "COALESCE(b.publication_year, 9999) DESC, b.created_at DESC";
      break;
    case "oldest":
      orderByClause = "COALESCE(b.publication_year, 0) ASC, b.created_at ASC";
      break;
    case "newest_added":
      orderByClause = "b.created_at DESC, b.id DESC";
      break;
    case "oldest_added":
      orderByClause = "b.created_at ASC, b.id ASC";
      break;
    case "title_asc":
      orderByClause = "b.title COLLATE utf8mb4_unicode_ci ASC";
      break;
    case "title_desc":
      orderByClause = "b.title COLLATE utf8mb4_unicode_ci DESC";
      break;
    case "popular":
      orderByClause =
        "copies_count DESC, available_count DESC, COALESCE(b.publication_year, 9999) DESC";
      break;
    default:
      orderByClause =
        "COALESCE(b.publication_year, 9999) DESC, b.created_at DESC";
  }

  let sql = `
    SELECT 
      b.*,
      c.name AS category_name,
      p.name AS publisher_name,
      COUNT(DISTINCT ba.author_id) AS author_count,
      GROUP_CONCAT(DISTINCT a.name ORDER BY ba.ord SEPARATOR ', ') AS author_names,
      COUNT(DISTINCT bc.id) AS copies_count,
      COUNT(DISTINCT CASE WHEN bc.status = 'AVAILABLE' THEN bc.id ELSE NULL END) AS available_count
    FROM books b
    LEFT JOIN book_categories c ON b.category_id = c.id
    LEFT JOIN publishers p ON b.publisher_id = p.id
    LEFT JOIN book_authors ba ON ba.book_id = b.id
    LEFT JOIN authors a ON a.id = ba.author_id
    LEFT JOIN book_copies bc ON bc.book_id = b.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.keyword) {
    // Trim whitespace và normalize keyword
    const normalizedKeyword = filters.keyword.trim();

    // Hỗ trợ tìm kiếm multiple authors với " OR " separator
    const keywords = normalizedKeyword.split(" OR ").map((k) => k.trim());

    // Xác định loại tìm kiếm
    const searchType = filters.searchType || "all";

    if (keywords.length > 1) {
      // Multiple keywords: tìm sách có bất kỳ tác giả/nhà xuất bản/tiêu đề nào khớp
      const orConditions = keywords
        .map(() => {
          if (searchType === "author") {
            return "TRIM(a.name) LIKE ?";
          } else if (searchType === "title") {
            return "b.title LIKE ?";
          } else if (searchType === "publisher") {
            return "p.name LIKE ?";
          } else {
            return "(b.title LIKE ? OR TRIM(a.name) LIKE ? OR p.name LIKE ?)";
          }
        })
        .join(" OR ");
      sql += ` AND (${orConditions})`;

      keywords.forEach((keyword) => {
        if (searchType === "all") {
          params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
        } else {
          params.push(`%${keyword}%`);
        }
      });
    } else {
      // Single keyword - sử dụng TRIM cho author names để loại bỏ khoảng trắng thừa
      if (searchType === "author") {
        sql += " AND TRIM(a.name) LIKE ?";
        params.push(`%${normalizedKeyword}%`);
      } else if (searchType === "title") {
        sql += " AND b.title LIKE ?";
        params.push(`%${normalizedKeyword}%`);
      } else if (searchType === "publisher") {
        sql += " AND p.name LIKE ?";
        params.push(`%${normalizedKeyword}%`);
      } else {
        // all
        sql += " AND (b.title LIKE ? OR TRIM(a.name) LIKE ? OR p.name LIKE ?)";
        params.push(
          `%${normalizedKeyword}%`,
          `%${normalizedKeyword}%`,
          `%${normalizedKeyword}%`
        );
      }
    }
  }

  if (filters?.categoryId) {
    sql += " AND b.category_id = ?";
    params.push(filters.categoryId);
  }

  if (filters?.status) {
    sql += " AND b.status = ?";
    params.push(filters.status);
  }

  // Pagination - support both offset and cursor
  const limit = filters?.limit ?? 12;
  const offset = filters?.offset ?? 0;
  const cursor = filters?.cursor;

  // Use offset-based pagination (more reliable with complex ORDER BY)
  // cursor is kept for backwards compatibility but offset is preferred
  const pageOffset = cursor ? Number(cursor) : offset;

  sql += `
    GROUP BY b.id
    ORDER BY ${orderByClause}
    LIMIT ${limit}
    OFFSET ${pageOffset}
  `;

  const [rows] = await connection.query<Book[]>(sql, params);

  return rows;
};

const getBookById = async (bookId: number): Promise<Book | null> => {
  const sql = `
    SELECT 
      b.*,
      c.name AS category_name,
      p.name AS publisher_name,
      GROUP_CONCAT(DISTINCT a.name ORDER BY ba.ord SEPARATOR ', ') AS author_names,
      COUNT(DISTINCT bc.id) AS copies_count,
      COUNT(DISTINCT CASE WHEN bc.status = 'AVAILABLE' THEN bc.id ELSE NULL END) AS available_count
    FROM books b
    LEFT JOIN book_categories c ON b.category_id = c.id
    LEFT JOIN publishers p ON b.publisher_id = p.id
    LEFT JOIN book_authors ba ON ba.book_id = b.id
    LEFT JOIN authors a ON a.id = ba.author_id
    LEFT JOIN book_copies bc ON bc.book_id = b.id
    WHERE b.id = ?
    GROUP BY b.id
  `;
  const [rows] = await connection.query<Book[]>(sql, [bookId]);
  return rows.length > 0 ? rows[0] : null;
};

const createBook = async (book: BookInputFull): Promise<void> => {
  const sql = `
    INSERT INTO books (
      title, category_id, publisher_id, publication_year,
      isbn13, call_number, language_code, format, status,
      description, thumbnail_url
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      description = COALESCE(VALUES(description), description),
      thumbnail_url = COALESCE(VALUES(thumbnail_url), thumbnail_url),
      updated_at = CURRENT_TIMESTAMP
  `;
  await connection.query(sql, [
    book.title,
    book.categoryId ?? null,
    book.publisherId ?? null,
    book.publicationYear ?? null,
    book.isbn13 ?? null,
    book.callNumber ?? null,
    book.languageCode ?? "vi",
    book.format ?? null,
    book.status ?? "ACTIVE",
    book.description ?? null,
    book.thumbnailUrl ?? null,
  ]);
};

const updateBookById = async (
  book: BookInput,
  bookId: number
): Promise<void> => {
  const [exists] = await connection.query<
    (RowDataPacket & { count: number })[]
  >("SELECT COUNT(*) AS count FROM books WHERE id = ?", [bookId]);
  if (exists[0].count === 0) throw new Error("Book not found");

  await connection.query(
    `UPDATE books 
     SET title = ?, category_id = ?, publisher_id = ?, publication_year = ?, 
         isbn13 = ?, call_number = ?, language_code = ?, format = ?, 
         description = ?, thumbnail_url = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [
      book.title,
      book.categoryId ?? null,
      book.publisherId ?? null,
      book.publicationYear ?? null,
      book.isbn13 ?? null,
      book.callNumber ?? null,
      book.languageCode ?? "vi",
      book.format ?? null,
      book.description ?? null,
      book.thumbnailUrl ?? null,
      bookId,
    ]
  );
};

const deleteBookById = async (bookId: number, role: string): Promise<void> => {
  const [rows] = await connection.query<(RowDataPacket & { count: number })[]>(
    "SELECT COUNT(*) AS count FROM books WHERE id = ?",
    [bookId]
  );
  if (rows[0].count === 0) throw new Error("Book not found");

  if (role === "ADMIN") {
    await connection.query("DELETE FROM books WHERE id = ?", [bookId]);
  } else {
    await connection.query(
      "UPDATE books SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [bookId]
    );
  }
};

const updateBookStatus = async (
  bookId: number,
  status: string
): Promise<void> => {
  const valid = ["ACTIVE", "INACTIVE", "DRAFT"];
  if (!valid.includes(status)) throw new Error("Invalid status");

  await connection.query(
    "UPDATE books SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [status, bookId]
  );
};

const countBookStats = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
  draft: number;
}> => {
  const [rows] = await connection.query<any[]>(`
    SELECT 
      COUNT(*) AS total,
      SUM(status = 'ACTIVE') AS active,
      SUM(status = 'INACTIVE') AS inactive,
      SUM(status = 'DRAFT') AS draft
    FROM books;
  `);
  return rows[0];
};

const isBookAvailable = async (bookId: number): Promise<boolean> => {
  const [rows] = await connection.query<(RowDataPacket & { count: number })[]>(
    `
    SELECT COUNT(*) AS count 
    FROM book_copies 
    WHERE book_id = ? AND status = 'AVAILABLE'
    `,
    [bookId]
  );
  return rows[0].count > 0;
};

// đếm tổng số sách (không filter status)
const countPublicBooks = async (): Promise<{ total: number }> => {
  const [rows] = await connection.query<any[]>(`
    SELECT COUNT(*) AS total
    FROM books;
  `);
  return { total: rows[0].total };
};

export {
  getAllBooks,
  getBookById,
  createBook,
  updateBookById,
  deleteBookById,
  updateBookStatus,
  countBookStats,
  isBookAvailable,
  countPublicBooks,
};
