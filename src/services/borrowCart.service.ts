import connection from "../config/db.ts";
import type { BorrowCart, BorrowCartItem } from "../models/borrowCart.model.ts";

interface CartItemWithBook extends BorrowCart {
  id: number;
  user_id: string;
  book_id: number;
  quantity: number;
  title?: string;
  thumbnail_url?: string;
  author_names?: string;
  available_count?: number;
}

export const BorrowCartService = {
  async getCart(userId: string): Promise<CartItemWithBook[]> {
    const query = `
      SELECT
        bc.id,
        bc.user_id,
        bc.book_id,
        bc.quantity,
        b.title,
        b.thumbnail_url,
        GROUP_CONCAT(DISTINCT a.name ORDER BY ba.ord SEPARATOR ', ') AS author_names,
        COALESCE(
          (SELECT COUNT(*) FROM book_copies WHERE book_id = bc.book_id AND status = 'AVAILABLE'),
          0
        ) AS available_count,
        bc.created_at,
        bc.updated_at
      FROM borrow_carts bc
      LEFT JOIN books b ON bc.book_id = b.id
      LEFT JOIN book_authors ba ON ba.book_id = b.id
      LEFT JOIN authors a ON a.id = ba.author_id
      WHERE bc.user_id = ?
      GROUP BY bc.id, bc.user_id, bc.book_id, bc.quantity, b.title, b.thumbnail_url, bc.created_at, bc.updated_at
      ORDER BY bc.created_at DESC
    `;

    const [results] = await connection.query(query, [userId]);
    return results as CartItemWithBook[];
  },

  async getCartWithSummary(userId: string) {
    const query = `
      SELECT
        bc.id,
        bc.user_id,
        bc.book_id,
        bc.quantity,
        b.title,
        b.thumbnail_url,
        GROUP_CONCAT(DISTINCT a.name ORDER BY ba.ord SEPARATOR ', ') AS author_names,
        COALESCE(
          (SELECT COUNT(*) FROM book_copies WHERE book_id = bc.book_id AND status = 'AVAILABLE'),
          0
        ) AS available_count,
        bc.created_at,
        bc.updated_at
      FROM borrow_carts bc
      LEFT JOIN books b ON bc.book_id = b.id
      LEFT JOIN book_authors ba ON ba.book_id = b.id
      LEFT JOIN authors a ON a.id = ba.author_id
      WHERE bc.user_id = ?
      GROUP BY bc.id, bc.user_id, bc.book_id, bc.quantity, b.title, b.thumbnail_url, bc.created_at, bc.updated_at
      ORDER BY bc.created_at DESC
    `;

    const [items] = await connection.query(query, [userId]);
    const cartItems = (items as CartItemWithBook[]) || [];

    cartItems.forEach((item) => {
      console.log(
        `[getCartWithSummary] Book ${item.book_id}: available=${item.available_count}, quantity=${item.quantity}`
      );
    });

    const totalItems = cartItems.length;
    const totalBooks = cartItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );

    return {
      items: cartItems,
      summary: {
        totalItems,
        totalBooks,
      },
    };
  },

  async addItem(
    userId: string,
    bookId: number,
    quantity: number
  ): Promise<CartItemWithBook> {
    const conn = await connection.getConnection();

    try {
      await conn.beginTransaction();

      console.log(
        `[addItem] Received: bookId=${bookId}, quantity=${quantity}, userId=${userId}`
      );

      const bookCheckQuery = `
        SELECT 
          b.id,
          b.title,
          COUNT(bc.id) as total_copies,
          SUM(CASE WHEN bc.status = 'AVAILABLE' THEN 1 ELSE 0 END) as available_count
        FROM books b
        LEFT JOIN book_copies bc ON b.id = bc.book_id
        WHERE b.id = ?
        GROUP BY b.id, b.title
      `;
      const [bookCheck] = await conn.query(bookCheckQuery, [bookId]);
      const bookData = bookCheck as any[];

      if (!bookData || bookData.length === 0) {
        await conn.rollback();
        const msg = `Sách không tồn tại`;
        console.warn(`[addItem] REJECTED: ${msg}`);
        const err = new Error(msg) as any;
        err.code = "BOOK_NOT_FOUND";
        throw err;
      }

      const availableCount = Number(bookData[0]?.available_count || 0);
      console.log(
        `[addItem] Book ${bookId}: total_copies=${bookData[0]?.total_copies}, available=${availableCount}`
      );

      const upsertQuery = `
        INSERT INTO borrow_carts (user_id, book_id, quantity, created_at, updated_at)
        VALUES (?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          quantity = quantity + VALUES(quantity),
          updated_at = NOW()
      `;
      await conn.query(upsertQuery, [userId, bookId, quantity]);

      const selectQuery = `
        SELECT
          bc.id,
          bc.user_id,
          bc.book_id,
          bc.quantity,
          b.title,
          b.thumbnail_url,
          GROUP_CONCAT(DISTINCT a.name ORDER BY ba.ord SEPARATOR ', ') AS author_names,
          COALESCE(
            (SELECT COUNT(*) FROM book_copies WHERE book_id = bc.book_id AND status = 'AVAILABLE'),
            0
          ) AS available_count,
          bc.created_at,
          bc.updated_at
        FROM borrow_carts bc
        LEFT JOIN books b ON bc.book_id = b.id
        LEFT JOIN book_authors ba ON ba.book_id = b.id
        LEFT JOIN authors a ON a.id = ba.author_id
        WHERE bc.user_id = ? AND bc.book_id = ?
        GROUP BY bc.id, bc.user_id, bc.book_id, bc.quantity, b.title, b.thumbnail_url, bc.created_at, bc.updated_at
      `;

      const [updatedItems] = await conn.query(selectQuery, [userId, bookId]);
      const items = updatedItems as CartItemWithBook[];

      await conn.commit();

      console.log(
        `[addItem] SUCCESS: Book ${bookId} added to cart for user ${userId}. ` +
          `Cart quantity=${items[0]?.quantity}, available=${items[0]?.available_count}`
      );
      return items[0];
    } catch (error) {
      await conn.rollback();
      console.error(`[addItem] ERROR - Transaction rolled back:`, error);
      throw error;
    } finally {
      conn.release();
    }
  },

  async updateQuantity(
    userId: string,
    bookId: number,
    quantity: number
  ): Promise<CartItemWithBook | { success: true }> {
    if (quantity <= 0) {
      return this.removeItem(userId, bookId);
    }

    const conn = await connection.getConnection();

    try {
      await conn.beginTransaction();

      console.log(
        `[updateQuantity] Updating: userId=${userId}, bookId=${bookId}, quantity=${quantity}`
      );

      const updateQuery = `
        UPDATE borrow_carts
        SET quantity = ?, updated_at = NOW()
        WHERE user_id = ? AND book_id = ?
      `;
      await conn.query(updateQuery, [quantity, userId, bookId]);

      const selectQuery = `
        SELECT
          bc.id,
          bc.user_id,
          bc.book_id,
          bc.quantity,
          b.title,
          b.thumbnail_url,
          GROUP_CONCAT(DISTINCT a.name ORDER BY ba.ord SEPARATOR ', ') AS author_names,
          COALESCE(
            (SELECT COUNT(*) FROM book_copies WHERE book_id = bc.book_id AND status = 'AVAILABLE'),
            0
          ) AS available_count,
          bc.created_at,
          bc.updated_at
        FROM borrow_carts bc
        LEFT JOIN books b ON bc.book_id = b.id
        LEFT JOIN book_authors ba ON ba.book_id = b.id
        LEFT JOIN authors a ON a.id = ba.author_id
        WHERE bc.user_id = ? AND bc.book_id = ?
        GROUP BY bc.id, bc.user_id, bc.book_id, bc.quantity, b.title, b.thumbnail_url, bc.created_at, bc.updated_at
      `;

      const [updatedItems] = await conn.query(selectQuery, [userId, bookId]);
      const items = updatedItems as CartItemWithBook[];

      await conn.commit();

      console.log(
        `[updateQuantity] SUCCESS: Book ${bookId} quantity updated to ${quantity}. ` +
          `Available=${items[0]?.available_count}`
      );
      return items[0] || { success: true };
    } catch (error) {
      await conn.rollback();
      console.error(`[updateQuantity] ERROR - Transaction rolled back:`, error);
      throw error;
    } finally {
      conn.release();
    }
  },

  async removeItem(userId: string, bookId: number): Promise<{ success: true }> {
    const query = `DELETE FROM borrow_carts WHERE user_id = ? AND book_id = ?`;
    await connection.query(query, [userId, bookId]);
    return { success: true };
  },

  async clearCart(userId: string): Promise<{ success: true }> {
    const query = `DELETE FROM borrow_carts WHERE user_id = ?`;
    await connection.query(query, [userId]);
    return { success: true };
  },

  async getCartSummary(userId: string) {
    const query = `
      SELECT
        COUNT(DISTINCT bc.book_id) AS totalItems,
        COALESCE(SUM(bc.quantity), 0) AS totalBooks
      FROM borrow_carts bc
      LEFT JOIN books b ON bc.book_id = b.id
      WHERE bc.user_id = ?
    `;

    const [results] = await connection.query(query, [userId]);
    const summary = results as any[];

    const itemsQuery = `
      SELECT
        bc.id,
        bc.user_id,
        bc.book_id,
        bc.quantity,
        b.title,
        b.thumbnail_url,
        GROUP_CONCAT(DISTINCT a.name ORDER BY ba.ord SEPARATOR ', ') AS author_names,
        COALESCE(
          (SELECT COUNT(*) FROM book_copies WHERE book_id = bc.book_id AND status = 'AVAILABLE'),
          0
        ) AS available_count
      FROM borrow_carts bc
      LEFT JOIN books b ON bc.book_id = b.id
      LEFT JOIN book_authors ba ON ba.book_id = b.id
      LEFT JOIN authors a ON a.id = ba.author_id
      WHERE bc.user_id = ?
      GROUP BY bc.id, bc.user_id, bc.book_id, bc.quantity, b.title, b.thumbnail_url
      ORDER BY bc.created_at DESC
    `;

    const [items] = await connection.query(itemsQuery, [userId]);

    return {
      totalItems: summary[0]?.totalItems || 0,
      totalBooks: summary[0]?.totalBooks || 0,
      items: items || [],
    };
  },
};

export default BorrowCartService;
