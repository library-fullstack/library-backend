import connection from "../../config/db.ts";
import { bookTagModel } from "../../models/index.ts";

const getAllTags = async () => {
  const [rows] = await connection.query<bookTagModel.BookTag[]>(`
    SELECT t.*, COUNT(bt.book_id) AS book_count
    FROM tags t
    LEFT JOIN book_tags bt ON t.id = bt.tag_id
    GROUP BY t.id
  `);
  return rows;
};

const createTag = async (name: string) => {
  await connection.query(
    `INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE name=name`,
    [name]
  );
};

const attachTagToBook = async (bookId: number, tagId: number) => {
  await connection.query(
    `INSERT IGNORE INTO book_tags (book_id, tag_id) VALUES (?, ?)`,
    [bookId, tagId]
  );
};

const detachTagFromBook = async (bookId: number, tagId: number) => {
  await connection.query(
    `DELETE FROM book_tags WHERE book_id = ? AND tag_id = ?`,
    [bookId, tagId]
  );
};

export { getAllTags, createTag, attachTagToBook, detachTagFromBook };
