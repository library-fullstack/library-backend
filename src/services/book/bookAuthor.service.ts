import connection from "../../config/db.ts";
import { bookAuthorModel } from "../../models/index.ts";

const getAuthorsByBookId = async (bookId: number) => {
  const [rows] = await connection.query<bookAuthorModel.BookAuthor[]>(
    `
    SELECT a.id, a.name, ba.role, ba.ord
    FROM book_authors ba
    JOIN authors a ON a.id = ba.author_id
    WHERE ba.book_id = ?
    ORDER BY ba.ord ASC
  `,
    [bookId]
  );
  return rows;
};

const addAuthorToBook = async (
  bookId: number,
  authorId: number,
  role = "AUTHOR",
  ord = 0
) => {
  await connection.query(
    `INSERT INTO book_authors (book_id, author_id, role, ord)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role), ord = VALUES(ord)`,
    [bookId, authorId, role, ord]
  );
};

const removeAuthorFromBook = async (bookId: number, authorId: number) => {
  await connection.query(
    `DELETE FROM book_authors WHERE book_id = ? AND author_id = ?`,
    [bookId, authorId]
  );
};

export { getAuthorsByBookId, addAuthorToBook, removeAuthorFromBook };
