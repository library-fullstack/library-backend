import connection from "../config/db.ts";
import { Book, BookInput, BookInputFull } from "../models/book.model.ts";

const getAllBook = async (): Promise<Book[] | null> => {
  const [rows] = await connection.query<Book[]>("SELECT * FROM books");

  return rows.length > 0 ? rows : null;
};

const getBookById = async (bookId: number): Promise<Book | null> => {
  const [rows] = await connection.query<Book[]>(
    "SELECT * FROM books WHERE id = ?",
    [bookId]
  );
  return rows.length > 0 ? rows[0] : null;
};

const createBook = async (book: BookInputFull): Promise<void> => {
  // nếu có isbn13 thì dùng ON DUPLICATE KEY UPDATE
  if (book.isbn13) {
    const sql = `
      INSERT INTO books (
        title, author, category, publisher_id, publication_year, isbn13,
        language_code, format, price, stock, status, description, thumbnail_url
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        stock = stock + VALUES(stock),
        price = VALUES(price),
        description = COALESCE(VALUES(description), description),
        thumbnail_url = COALESCE(VALUES(thumbnail_url), thumbnail_url),
        updated_at = CURRENT_TIMESTAMP
    `;
    await connection.query(sql, [
      book.title,
      book.author,
      book.category ?? null,
      book.publisherId ?? null,
      book.publicationYear ?? null,
      book.isbn13,
      book.languageCode ?? "vi",
      book.format ?? null,
      book.price,
      book.stock,
      "ACTIVE",
      book.description ?? null,
      book.thumbnailUrl ?? null,
    ]);
    return;
  }

  // Không có isbn13 thì fallback
  const [rows] = await connection.query<Book[]>(
    "SELECT id FROM books WHERE title = ? AND author = ? AND price = ?",
    [book.title, book.author, book.price]
  );

  if (rows.length > 0) {
    await connection.query(
      "UPDATE books SET stock = stock + ? WHERE title = ? AND author = ? AND price = ?",
      [book.stock, book.title, book.author, book.price]
    );
  } else {
    await connection.query(
      "INSERT INTO books (title, author, category, price, stock, description) VALUES (?,?,?,?,?,?)",
      [
        book.title,
        book.author,
        book.category,
        book.price,
        book.stock,
        book.description ?? null,
      ]
    );
  }
};

const updateBookById = async (
  book: BookInput,
  bookId: number
): Promise<void> => {
  await connection.query(
    "UPDATE books SET title = ?, author = ?, category = ?, price = ?, stock = ?, description = ? WHERE id = ?",
    [
      book.title,
      book.author,
      book.category,
      book.price,
      book.stock,
      book.description ?? null,
      bookId,
    ]
  );
};

const deleteBookById = async (bookId: number): Promise<void> => {
  await connection.query("DELETE FROM books WHERE id = ?", [bookId]);
};

export { getAllBook, getBookById, createBook, updateBookById, deleteBookById };
