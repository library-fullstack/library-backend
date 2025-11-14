import connection from "../config/db.ts";
import BorrowCartService from "./borrowCart.service.ts";

interface CreateBorrowItem {
  book_id: number;
  quantity: number;
}

interface ValidationResult {
  success: boolean;
  errors: Array<{
    book_id: number;
    book_title: string;
    requested: number;
    available: number;
    message: string;
  }>;
}

export const BorrowService = {
  /**
   * Validate cart items against actual availability + existing holds
   * Checks both AVAILABLE copies and copies already RESERVED/HELD
   */
  async validateCartAvailability(
    items: CreateBorrowItem[]
  ): Promise<ValidationResult> {
    const errors: ValidationResult["errors"] = [];

    for (const item of items) {
      // Get available count MINUS already held/reserved copies
      const availableQuery = `
        SELECT 
          b.title,
          COUNT(CASE WHEN bc.status = 'AVAILABLE' THEN 1 END) as available_count,
          COUNT(CASE WHEN bc.status IN ('RESERVED', 'HELD') THEN 1 END) as held_count
        FROM books b
        LEFT JOIN book_copies bc ON bc.book_id = b.id
        WHERE b.id = ?
        GROUP BY b.id, b.title
      `;

      const [results] = await connection.query(availableQuery, [item.book_id]);
      const bookData = results as any[];

      if (bookData.length === 0) {
        errors.push({
          book_id: item.book_id,
          book_title: "Unknown",
          requested: item.quantity,
          available: 0,
          message: "Sách không tồn tại",
        });
        continue;
      }

      const { title, available_count } = bookData[0];

      // Only check truly AVAILABLE copies (not held by others)
      if (item.quantity > available_count) {
        errors.push({
          book_id: item.book_id,
          book_title: title,
          requested: item.quantity,
          available: available_count,
          message: `"${title}" chỉ còn ${available_count} bản, bạn yêu cầu ${item.quantity} bản`,
        });
      }
    }

    return {
      success: errors.length === 0,
      errors,
    };
  },

  /**
   * Create borrow request (PENDING) and reserve books
   * User gets a ticket to present at library
   * Books are marked as RESERVED (soft lock for limited time)
   *
   * Flow:
   * 1. User checkout → Create PENDING borrow + RESERVE books
   * 2. User comes to library with ticket
   * 3. Librarian scans ticket → Verify + Hand over books
   * 4. System updates: borrow → ACTIVE, books → BORROWED
   */
  async createBorrowFromCart(
    userId: string,
    items: CreateBorrowItem[]
  ): Promise<any> {
    const conn = await connection.getConnection();

    try {
      await conn.beginTransaction();

      // Step 1: Validate availability (CRITICAL - prevents race condition)
      const validation = await this.validateCartAvailability(items);

      if (!validation.success) {
        throw {
          code: "INSUFFICIENT_STOCK",
          message: "Một số sách không đủ số lượng",
          errors: validation.errors,
        };
      }

      // Step 2: Create PENDING borrow record (ticket)
      // due_date = 14 days from borrow_date (when librarian confirms)
      const insertBorrowQuery = `
        INSERT INTO borrows (
          user_id, 
          borrow_date, 
          due_date, 
          status, 
          created_at, 
          updated_at
        )
        VALUES (?, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), 'PENDING', NOW(), NOW())
      `;

      const [borrowResult] = await conn.query(insertBorrowQuery, [userId]);
      const borrowId = (borrowResult as any).insertId;

      // Step 3: Reserve books and create borrow_details
      const reservedCopies = [];

      for (const item of items) {
        // Get available book copies (FIFO - oldest available first)
        const getAvailableCopiesQuery = `
          SELECT bc.id, b.title
          FROM book_copies bc
          JOIN books b ON b.id = bc.book_id
          WHERE bc.book_id = ? AND bc.status = 'AVAILABLE'
          ORDER BY bc.created_at ASC
          LIMIT ?
        `;

        const [copies] = await conn.query(getAvailableCopiesQuery, [
          item.book_id,
          item.quantity,
        ]);
        const availableCopies = copies as any[];

        if (availableCopies.length < item.quantity) {
          // Race condition - someone else took it
          throw new Error(
            `Race condition: Not enough copies for book ${item.book_id}`
          );
        }

        // Reserve each copy and create borrow detail
        for (const copy of availableCopies) {
          // Create borrow detail (links borrow to specific copy)
          const insertDetailQuery = `
            INSERT INTO borrow_details (borrow_id, copy_id)
            VALUES (?, ?)
          `;
          await conn.query(insertDetailQuery, [borrowId, copy.id]);

          // RESERVE the copy (soft lock - not yet borrowed)
          const updateCopyQuery = `
            UPDATE book_copies
            SET status = 'RESERVED', updated_at = NOW()
            WHERE id = ?
          `;
          await conn.query(updateCopyQuery, [copy.id]);

          reservedCopies.push({
            copy_id: copy.id,
            book_title: copy.title,
          });
        }
      }

      // Step 4: Clear user's cart
      const clearCartQuery = `DELETE FROM borrow_carts WHERE user_id = ?`;
      await conn.query(clearCartQuery, [userId]);

      await conn.commit();

      // Return ticket information
      return {
        success: true,
        message: "Đặt sách thành công! Vui lòng đến thư viện để nhận sách.",
        data: {
          borrowId,
          ticketNumber: `BRW-${borrowId.toString().padStart(6, "0")}`,
          status: "PENDING",
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          reservedCopies,
          note: "Vui lòng đến thư viện trong vòng 3 ngày để nhận sách. Quá hạn sẽ tự động hủy.",
        },
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },
};

export default BorrowService;
