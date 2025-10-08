import connection from "../config/db.ts";
import { Book, BookInput } from "../models/book.model.ts";

const getAllBook = async (): Promise<Book[] | null> => {
  const [rows] = await connection.query<Book[]>("SELECT * FROM books");

  return rows.length > 0 ? rows : null;
};

const getBookById = async (bookId: string): Promise<Book | null> => {
  const [rows] = await connection.query<Book[]>(
    "SELECT * FROM books WHERE id = ?",
    [bookId]
  );

  return rows.length > 0 ? rows[0] : null;
};

const createBook = async (book: BookInput): Promise<void> => {
  // cần bổ sung publish_year hoặc isbn, isbn có vẻ chưa cần lắm nên có lẽ là nên chọn publish_year
  // cần thêm image_url và
  const [rows] = await connection.query<Book[]>(
    "SELECT * FROM books WHERE title = ? AND author = ? AND price = ?",
    [book.title, book.author, book.price]
  );

  if (rows.length > 0) {
    const sqlUpdate =
      "UPDATE books SET stock = stock + ? WHERE title = ? AND author = ? AND price = ?";

    await connection.query(sqlUpdate, [
      book.stock,
      book.title,
      book.author,
      book.price,
    ]);
  } else {
    const sql =
      "INSERT INTO books (title, author, category, price, stock, description) VALUES (?,?,?,?,?,?)";

    await connection.query(sql, [
      book.title,
      book.author,
      book.category,
      book.price,
      book.stock,
      book.description || null,
    ]);
  }
};

const updateBookById = async (
  book: BookInput,
  bookId: string
): Promise<void> => {
  await connection.query(
    "UPDATE books SET title = ?, author = ?, category = ?, price = ?, stock = ?, description = ?, WHERE id = ?",
    [
      book.title,
      book.author,
      book.category,
      book.price,
      book.stock,
      book.description,
      bookId,
    ]
  );
};

const deleteBookById = async (bookId: string): Promise<void> => {
  await connection.query("DELETE FROM books WHERE id = ?", [bookId]);
};

export { getAllBook, getBookById, createBook, updateBookById, deleteBookById };
