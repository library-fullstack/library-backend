import connection from "../../config/db";
import type {
  BookFavourite,
  BookFavouriteItem,
} from "../../models/bookFavourite.model";

interface FavouriteWithBook extends BookFavourite {
  id: number;
  user_id: string;
  book_id: number;
  title?: string;
  thumbnail_url?: string;
  author_names?: string;
  description?: string;
  isbn?: string;
  publisher_name?: string;
  publication_date?: string;
  available_count?: number;
}

export const BookFavouriteService = {
  async getFavourites(userId: string): Promise<FavouriteWithBook[]> {
    const query = `
      SELECT
        bf.id,
        bf.user_id,
        bf.book_id,
        b.title,
        b.thumbnail_url,
        b.description,
        b.isbn13 AS isbn,
        b.publication_year AS publication_date,
        p.name AS publisher_name,
        GROUP_CONCAT(DISTINCT a.name ORDER BY ba.ord SEPARATOR ', ') AS author_names,
        COALESCE(
          (SELECT COUNT(*) FROM book_copies WHERE book_id = bf.book_id AND status = 'AVAILABLE'),
          0
        ) AS available_count,
        bf.created_at,
        bf.updated_at
      FROM books_favourites bf
      LEFT JOIN books b ON bf.book_id = b.id
      LEFT JOIN publishers p ON b.publisher_id = p.id
      LEFT JOIN book_authors ba ON ba.book_id = b.id
      LEFT JOIN authors a ON a.id = ba.author_id
      WHERE bf.user_id = ?
      GROUP BY bf.id, bf.user_id, bf.book_id, b.title, b.thumbnail_url, b.description,
               b.isbn13, b.publication_year, p.name, bf.created_at, bf.updated_at
      ORDER BY bf.created_at DESC
    `;

    const [results] = await connection.query(query, [userId]);
    return results as FavouriteWithBook[];
  },

  async addFavourite(userId: string, bookId: number): Promise<BookFavourite> {
    const conn = await connection.getConnection();

    try {
      await conn.beginTransaction();

      const bookCheckQuery = `SELECT id FROM books WHERE id = ?`;
      const [bookCheck] = await conn.query(bookCheckQuery, [bookId]);
      const bookData = bookCheck as any[];

      if (!bookData || bookData.length === 0) {
        await conn.rollback();
        const err = new Error("Sách không tồn tại") as any;
        err.code = "BOOK_NOT_FOUND";
        throw err;
      }

      const insertQuery = `
        INSERT INTO books_favourites (user_id, book_id, created_at, updated_at)
        VALUES (?, ?, NOW(), NOW())
      `;
      const [result] = await conn.query(insertQuery, [userId, bookId]);

      const insertResult = result as any;
      const selectQuery = `SELECT * FROM books_favourites WHERE id = ?`;
      const [favourites] = await conn.query(selectQuery, [
        insertResult.insertId,
      ]);

      await conn.commit();

      return (favourites as BookFavourite[])[0];
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  async removeFavourite(
    userId: string,
    bookId: number
  ): Promise<{ success: true }> {
    const query = `DELETE FROM books_favourites WHERE user_id = ? AND book_id = ?`;
    await connection.query(query, [userId, bookId]);
    return { success: true };
  },

  async checkFavourite(
    userId: string,
    bookId: number
  ): Promise<{ isFavourite: boolean }> {
    const query = `
      SELECT COUNT(*) as count
      FROM books_favourites
      WHERE user_id = ? AND book_id = ?
    `;
    const [results] = await connection.query(query, [userId, bookId]);
    const data = results as any[];
    return { isFavourite: data[0]?.count > 0 };
  },

  async getFavouriteCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM books_favourites
      WHERE user_id = ?
    `;
    const [results] = await connection.query(query, [userId]);
    const data = results as any[];
    return data[0]?.count || 0;
  },
};

export default BookFavouriteService;
