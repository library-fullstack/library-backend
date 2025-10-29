import connection from "../../config/db.ts";
import { bookImageModel } from "../../models/index.ts";

const getImagesByBookId = async (bookId: number) => {
  const [rows] = await connection.query<bookImageModel.BookImage[]>(
    `
    SELECT * FROM book_images WHERE book_id = ? ORDER BY sort_order ASC
  `,
    [bookId]
  );
  return rows;
};

const addBookImage = async (data: bookImageModel.BookImage) => {
  await connection.query(
    `INSERT INTO book_images (book_id, url, kind, sort_order, alt_text)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.book_id,
      data.url,
      data.kind ?? "COVER",
      data.sort_order ?? 0,
      data.alt_text ?? null,
    ]
  );
};

const deleteBookImage = async (imageId: number) => {
  await connection.query(`DELETE FROM book_images WHERE id = ?`, [imageId]);
};

export { getImagesByBookId, addBookImage, deleteBookImage };
