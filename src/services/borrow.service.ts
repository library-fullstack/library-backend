import connection from "../config/db";
import BorrowCartService from "./borrowCart.service";
import {
  Borrow,
  BorrowWithDetails,
  BorrowStatus,
  ReturnReason,
  ConfirmBorrowInput,
} from "../models/borrow.model";
import { BorrowDetailWithBook } from "../models/borrowDetail.model";

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
  async validateCartAvailability(
    items: CreateBorrowItem[]
  ): Promise<ValidationResult> {
    const errors: ValidationResult["errors"] = [];

    for (const item of items) {
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

  async createBorrowFromCart(
    userId: string,
    items: CreateBorrowItem[]
  ): Promise<any> {
    const conn = await connection.getConnection();

    try {
      await conn.beginTransaction();

      const validation = await this.validateCartAvailability(items);

      if (!validation.success) {
        throw {
          code: "INSUFFICIENT_STOCK",
          message: "Một số sách không đủ số lượng",
          errors: validation.errors,
        };
      }

      const insertBorrowQuery = `
        INSERT INTO borrows (
          user_id, 
          borrow_date, 
          due_date, 
          status
        )
        VALUES (?, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), 'PENDING')
      `;

      const [borrowResult] = await conn.query(insertBorrowQuery, [userId]);
      const borrowId = (borrowResult as any).insertId;

      const reservedCopies = [];

      for (const item of items) {
        const getAvailableCopiesQuery = `
          SELECT bc.id, b.title
          FROM book_copies bc
          JOIN books b ON b.id = bc.book_id
          WHERE bc.book_id = ? AND bc.status = 'AVAILABLE'
          ORDER BY bc.created_at ASC
          LIMIT ?
          FOR UPDATE
        `;

        const [copies] = await conn.query(getAvailableCopiesQuery, [
          item.book_id,
          item.quantity,
        ]);
        const availableCopies = copies as any[];

        if (availableCopies.length < item.quantity) {
          throw new Error(
            `Race condition: Not enough copies for book ${item.book_id}`
          );
        }

        for (const copy of availableCopies) {
          const insertDetailQuery = `
            INSERT INTO borrow_details (borrow_id, copy_id)
            VALUES (?, ?)
          `;
          await conn.query(insertDetailQuery, [borrowId, copy.id]);

          const updateCopyQuery = `
            UPDATE book_copies
            SET status = 'RESERVED'
            WHERE id = ?
          `;
          await conn.query(updateCopyQuery, [copy.id]);

          reservedCopies.push({
            copy_id: copy.id,
            book_title: copy.title,
          });
        }
      }

      const clearCartQuery = `DELETE FROM borrow_carts WHERE user_id = ?`;
      await conn.query(clearCartQuery, [userId]);

      await conn.commit();

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

  async getBorrowPreview(
    borrowId: number,
    userId: string
  ): Promise<BorrowWithDetails | null> {
    const query = `
      SELECT 
        b.id, b.user_id, b.borrow_date, b.due_date, b.status, b.note,
        b.created_at, b.updated_at,
        u.full_name as fullname, u.email, u.student_id,
        GROUP_CONCAT(
          DISTINCT CONCAT(
            bd.copy_id, '|',
            bk.id, '|',
            bk.title, '|',
            COALESCE(bk.thumbnail_url, ''), '|',
            COALESCE(bk.isbn13, ''), '|',
            COALESCE(bc.barcode, '')
          ) SEPARATOR ';;;'
        ) as items_data
      FROM borrows b
      JOIN users u ON u.id = b.user_id
      LEFT JOIN borrow_details bd ON bd.borrow_id = b.id
      LEFT JOIN book_copies bc ON bc.id = bd.copy_id
      LEFT JOIN books bk ON bk.id = bc.book_id
      WHERE b.id = ? AND b.user_id = ?
      GROUP BY b.id
    `;

    const [rows] = await connection.query(query, [borrowId, userId]);
    const data = rows as BorrowWithDetails[];

    if (data.length === 0) return null;

    const borrow = data[0];

    if (borrow.items_data) {
      const itemsStr = (borrow as Record<string, string>).items_data;
      borrow.items = itemsStr.split(";;;").map((item) => {
        const [copy_id, book_id, book_title, thumbnail_url, isbn, barcode] =
          item.split("|");
        return {
          copy_id: Number(copy_id),
          book_id: Number(book_id),
          book_title,
          thumbnail_url: thumbnail_url || undefined,
          isbn: isbn || undefined,
          barcode: barcode || undefined,
        };
      });
    }

    const [reasonRows] = await connection.query(
      `SELECT reason FROM borrow_return_reasons WHERE borrow_id = ?`,
      [borrowId]
    );

    borrow.return_reasons = (reasonRows as any[]).map((r) => r.reason);

    return borrow;
  },

  async confirmBorrow(
    input: ConfirmBorrowInput
  ): Promise<{ success: boolean; message: string }> {
    const conn = await connection.getConnection();

    try {
      await conn.beginTransaction();

      const [borrowRows] = await conn.query(
        `SELECT id, user_id, status FROM borrows WHERE id = ? AND user_id = ?`,
        [input.borrow_id, input.user_id]
      );
      const borrows = borrowRows as Borrow[];

      if (borrows.length === 0) {
        throw new Error("Phiếu mượn không tồn tại hoặc không thuộc về bạn");
      }

      const borrow = borrows[0];

      if (borrow.status !== BorrowStatus.PENDING) {
        throw new Error("Phiếu mượn đã được xác nhận hoặc đã bị hủy");
      }

      const [detailRows] = await conn.query(
        `SELECT bd.copy_id, bc.status 
         FROM borrow_details bd
         JOIN book_copies bc ON bc.id = bd.copy_id
         WHERE bd.borrow_id = ?`,
        [input.borrow_id]
      );
      const details = detailRows as Array<{ copy_id: number; status: string }>;

      const unavailableCopies = details.filter((d) => d.status !== "RESERVED");
      if (unavailableCopies.length > 0) {
        throw new Error(
          "Một số bản sao không còn khả dụng. Vui lòng liên hệ quản trị viên."
        );
      }

      await conn.query(
        `UPDATE borrows 
         SET status = ?, signature = ?
         WHERE id = ?`,
        [BorrowStatus.CONFIRMED, input.signature, input.borrow_id]
      );

      await conn.commit();

      return {
        success: true,
        message:
          "Xác nhận mượn sách thành công! Vui lòng đến thư viện để nhận sách.",
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  async getAdminBorrows(params: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
  }): Promise<{ borrows: BorrowWithDetails[]; total: number }> {
    const offset = (params.page - 1) * params.limit;
    const conditions: string[] = ["1=1"];
    const queryParams: (string | number)[] = [];

    console.log("[getAdminBorrows] params.status:", params.status);

    if (params.status && params.status.trim()) {
      console.log(
        "[getAdminBorrows] Filtering for exact status:",
        params.status
      );
      conditions.push("b.status = ?");
      queryParams.push(params.status);
    }

    if (params.search) {
      conditions.push(
        "(u.full_name LIKE ? OR u.email LIKE ? OR u.student_id LIKE ? OR bk.title LIKE ?)"
      );
      const searchPattern = `%${params.search}%`;
      queryParams.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern
      );
    }

    const whereClause = conditions.join(" AND ");

    const countQuery = `
      SELECT COUNT(DISTINCT b.id) as total
      FROM borrows b
      JOIN users u ON u.id = b.user_id
      LEFT JOIN borrow_details bd ON bd.borrow_id = b.id
      LEFT JOIN book_copies bc ON bc.id = bd.copy_id
      LEFT JOIN books bk ON bk.id = bc.book_id
      WHERE ${whereClause}
    `;

    const [countRows] = await connection.query(countQuery, queryParams);
    const total = (countRows as { total: number }[])[0].total;

    const dataQuery = `
      SELECT 
        b.id, b.user_id, b.borrow_date, b.due_date, b.return_date, b.status, 
        b.signature, b.note, b.created_at, b.updated_at,
        u.full_name as fullname, u.email, u.student_id,
        GROUP_CONCAT(
          DISTINCT CONCAT(
            bd.copy_id, '|',
            bk.id, '|',
            bk.title, '|',
            COALESCE(bk.thumbnail_url, ''), '|',
            COALESCE(bk.isbn13, ''), '|',
            COALESCE(bc.barcode, '')
          ) SEPARATOR ';;;'
        ) as items_data
      FROM borrows b
      JOIN users u ON u.id = b.user_id
      LEFT JOIN borrow_details bd ON bd.borrow_id = b.id
      LEFT JOIN book_copies bc ON bc.id = bd.copy_id
      LEFT JOIN books bk ON bk.id = bc.book_id
      WHERE ${whereClause}
      GROUP BY b.id
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await connection.query(dataQuery, [
      ...queryParams,
      params.limit,
      offset,
    ]);
    const borrows = rows as BorrowWithDetails[];

    for (const borrow of borrows) {
      if ((borrow as Record<string, string>).items_data) {
        const itemsStr = (borrow as Record<string, string>).items_data;
        borrow.items = itemsStr.split(";;;").map((item) => {
          const [copy_id, book_id, book_title, thumbnail_url, isbn, barcode] =
            item.split("|");
          return {
            copy_id: Number(copy_id),
            book_id: Number(book_id),
            book_title,
            thumbnail_url: thumbnail_url || undefined,
            isbn: isbn || undefined,
            barcode: barcode || undefined,
          };
        });
      }

      const [reasonRows] = await connection.query(
        `SELECT reason FROM borrow_return_reasons WHERE borrow_id = ?`,
        [borrow.id]
      );

      borrow.return_reasons = (reasonRows as any[]).map((r) => r.reason);
    }

    return { borrows, total };
  },

  async updateBorrowStatus(
    borrowId: number,
    status: BorrowStatus,
    adminId: string
  ): Promise<void> {
    const conn = await connection.getConnection();

    try {
      await conn.beginTransaction();

      const [borrowRows] = await conn.query(
        "SELECT id, status FROM borrows WHERE id = ?",
        [borrowId]
      );
      const borrows = borrowRows as Borrow[];

      if (borrows.length === 0) {
        throw new Error("Phiếu mượn không tồn tại");
      }

      const currentStatus = borrows[0].status;

      const validTransitions: Record<string, string[]> = {
        PENDING: ["CONFIRMED", "CANCELLED"],
        CONFIRMED: ["APPROVED", "CANCELLED"],
        APPROVED: ["ACTIVE", "CANCELLED"],
        ACTIVE: ["OVERDUE", "RETURNED", "CANCELLED"],
        OVERDUE: ["RETURNED", "CANCELLED"],
      };

      const allowedNext = validTransitions[currentStatus] || [];
      if (!allowedNext.includes(status)) {
        throw new Error(
          `Không thể chuyển từ trạng thái "${currentStatus}" sang "${status}". Trạng thái hợp lệ: ${allowedNext.join(", ")}`
        );
      }

      const updateQuery =
        status === BorrowStatus.RETURNED
          ? `UPDATE borrows SET status = ?, return_date = CURDATE() WHERE id = ?`
          : `UPDATE borrows SET status = ? WHERE id = ?`;

      await conn.query(updateQuery, [status, borrowId]);

      if (status === BorrowStatus.APPROVED) {
        await conn.query(
          `UPDATE book_copies bc
           JOIN borrow_details bd ON bd.copy_id = bc.id
           SET bc.status = 'ON_LOAN'
           WHERE bd.borrow_id = ?`,
          [borrowId]
        );
      } else if (status === BorrowStatus.CANCELLED) {
        await conn.query(
          `UPDATE book_copies bc
           JOIN borrow_details bd ON bd.copy_id = bc.id
           SET bc.status = 'AVAILABLE'
           WHERE bd.borrow_id = ?`,
          [borrowId]
        );
      }

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  async getUserBorrows(
    userId: string,
    status?: string
  ): Promise<BorrowWithDetails[]> {
    const conditions = ["b.user_id = ?"];
    const queryParams: (string | number)[] = [userId];

    if (status) {
      conditions.push("b.status = ?");
      queryParams.push(status);
    }

    const whereClause = conditions.join(" AND ");

    const query = `
      SELECT 
        b.id, b.user_id, b.borrow_date, b.due_date, b.return_date, b.status, 
        b.signature, b.note, b.created_at, b.updated_at,
        u.full_name as fullname, u.email, u.student_id,
        GROUP_CONCAT(
          DISTINCT CONCAT(
            bd.copy_id, '|',
            bk.id, '|',
            bk.title, '|',
            COALESCE(bk.thumbnail_url, ''), '|',
            COALESCE(bk.isbn13, ''), '|',
            COALESCE(bc.barcode, '')
          ) SEPARATOR ';;;'
        ) as items_data
      FROM borrows b
      JOIN users u ON u.id = b.user_id
      LEFT JOIN borrow_details bd ON bd.borrow_id = b.id
      LEFT JOIN book_copies bc ON bc.id = bd.copy_id
      LEFT JOIN books bk ON bk.id = bc.book_id
      WHERE ${whereClause}
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `;

    const [rows] = await connection.query(query, queryParams);
    const borrows = rows as BorrowWithDetails[];

    for (const borrow of borrows) {
      if ((borrow as Record<string, string>).items_data) {
        const itemsStr = (borrow as Record<string, string>).items_data;
        borrow.items = itemsStr.split(";;;").map((item) => {
          const [copy_id, book_id, book_title, thumbnail_url, isbn, barcode] =
            item.split("|");
          return {
            copy_id: Number(copy_id),
            book_id: Number(book_id),
            book_title,
            thumbnail_url: thumbnail_url || undefined,
            isbn: isbn || undefined,
            barcode: barcode || undefined,
          };
        });
      }
    }

    return borrows;
  },

  async renewBorrow(
    borrowId: number,
    userId: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const conn = await connection.getConnection();

    try {
      await conn.beginTransaction();

      // 1. lấy thông tin borrow
      const [borrowRows] = await conn.query(
        `SELECT id, user_id, status, due_date, renewal_count 
         FROM borrows 
         WHERE id = ? AND user_id = ?`,
        [borrowId, userId]
      );
      const borrows = borrowRows as Borrow[];

      if (borrows.length === 0) {
        throw new Error("Phiếu mượn không tồn tại");
      }

      const borrow = borrows[0];

      // 2. check status = ACTIVE
      if (borrow.status !== BorrowStatus.ACTIVE) {
        throw new Error("Chỉ có thể gia hạn phiếu đang mượn (ACTIVE)");
      }

      // 3. check chưa quá hạn
      const now = new Date();
      const dueDate = new Date(borrow.due_date);
      if (now > dueDate) {
        throw new Error("Không thể gia hạn phiếu đã quá hạn");
      }

      // 4. check renewal_count < 1
      const renewalCount = borrow.renewal_count || 0;
      if (renewalCount >= 1) {
        throw new Error("Đã gia hạn tối đa 1 lần. Vui lòng trả sách đúng hạn.");
      }

      // 5. check user không có sách quá hạn khác
      const [overdueRows] = await conn.query(
        `SELECT COUNT(*) as count 
         FROM borrows 
         WHERE user_id = ? AND status = 'OVERDUE'`,
        [userId]
      );
      const overdueCount = (overdueRows as any)[0].count;
      if (overdueCount > 0) {
        throw new Error(
          "Không thể gia hạn khi có sách khác đang quá hạn. Vui lòng trả sách quá hạn trước."
        );
      }

      // 6. tính date mới khi +7 ngày
      const newDueDate = new Date(dueDate);
      newDueDate.setDate(newDueDate.getDate() + 7);

      // 7. cập nhật borrow
      await conn.query(
        `UPDATE borrows 
         SET due_date = ?, 
             renewal_count = renewal_count + 1,
             last_renewal_date = NOW()
         WHERE id = ?`,
        [newDueDate, borrowId]
      );

      await conn.commit();

      return {
        success: true,
        message: "Gia hạn thành công",
        data: {
          borrow_id: borrowId,
          old_due_date: dueDate.toISOString().split("T")[0],
          new_due_date: newDueDate.toISOString().split("T")[0],
          renewal_count: renewalCount + 1,
        },
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  async getBorrowById(borrowId: number): Promise<any> {
    const query = `
      SELECT 
        b.id, b.user_id, b.borrow_date, b.due_date, b.status,
        u.full_name as fullname, u.email,
        GROUP_CONCAT(
          DISTINCT CONCAT(bk.title)
          SEPARATOR '|||'
        ) as book_titles
      FROM borrows b
      JOIN users u ON u.id = b.user_id
      LEFT JOIN borrow_details bd ON bd.borrow_id = b.id
      LEFT JOIN book_copies bc ON bc.id = bd.copy_id
      LEFT JOIN books bk ON bk.id = bc.book_id
      WHERE b.id = ?
      GROUP BY b.id
    `;

    const [rows] = await connection.query(query, [borrowId]);
    const data = rows as any[];

    if (data.length === 0) return null;

    const borrow = data[0];

    if (borrow.book_titles) {
      borrow.items = borrow.book_titles.split("|||").map((title: string) => ({
        title: title.trim(),
      }));
    }

    return borrow;
  },

  async returnBorrow(
    borrowId: number,
    reasons: ReturnReason[],
    adminId: string
  ): Promise<{
    success: boolean;
    fine: number;
    message: string;
    emailData: {
      email: string;
      fullname: string;
      items: Array<{ book_title: string }>;
      return_reasons: ReturnReason[];
    };
  }> {
    const conn = await connection.getConnection();

    try {
      await conn.beginTransaction();

      // 1. kiểm tra + lấy info cần cho email
      const [rows] = await conn.query(
        `
      SELECT 
        b.id, b.status,
        u.email, u.full_name,
        GROUP_CONCAT(bk.title SEPARATOR '|||') as book_titles
      FROM borrows b
      JOIN users u ON u.id = b.user_id
      LEFT JOIN borrow_details bd ON bd.borrow_id = b.id
      LEFT JOIN book_copies bc ON bc.id = bd.copy_id
      LEFT JOIN books bk ON bk.id = bc.book_id
      WHERE b.id = ?
      GROUP BY b.id
      `,
        [borrowId]
      );

      const borrow = (rows as any[])[0];
      if (!borrow) throw new Error("Phiếu mượn không tồn tại");
      if (borrow.status !== BorrowStatus.ACTIVE)
        throw new Error("Chỉ có thể trả phiếu đang mượn");

      // 2. update borrow
      await conn.query(
        `
      UPDATE borrows
      SET status = ?, return_date = NOW(), processed_by = ?
      WHERE id = ?
      `,
        [BorrowStatus.RETURNED, adminId, borrowId]
      );

      // 3. thêm checklist
      for (const reason of reasons) {
        await conn.query(
          `INSERT INTO borrow_return_reasons (borrow_id, reason)
         VALUES (?, ?)`,
          [borrowId, reason]
        );
      }

      // 4. trả lại sách
      await conn.query(
        `
      UPDATE book_copies bc
      JOIN borrow_details bd ON bd.copy_id = bc.id
      SET bc.status = 'AVAILABLE'
      WHERE bd.borrow_id = ?
      `,
        [borrowId]
      );

      await conn.commit();

      return {
        success: true,
        fine: 0,
        message: "Đã xác nhận trả sách",
        emailData: {
          email: borrow.email,
          fullname: borrow.full_name,
          items: borrow.book_titles
            ? borrow.book_titles
                .split("|||")
                .map((t: string) => ({ book_title: t }))
            : [],
          return_reasons: reasons,
        },
      };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },
};

export default BorrowService;
