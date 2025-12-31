import connection from "../config/db";
import { RowDataPacket } from "mysql2";

interface DashboardStats {
  totalBooks: number;
  activeBooks: number;
  totalUsers: number;
  totalBorrows: number;
  activeBorrows: number;
  overdueBorrows: number;
  totalCategories: number;
  totalPublishers: number;
  booksAddedThisMonth: number;
  usersJoinedThisMonth: number;
  borrowsThisMonth: number;
  booksAddedLastMonth: number;
  usersJoinedLastMonth: number;
  borrowsLastMonth: number;
  overdueLastMonth: number;
  popularCategories: Array<{
    category_id: number;
    category_name: string;
    book_count: number;
  }>;
  recentBorrows: Array<{
    id: number;
    book_title: string;
    user_name: string;
    borrowed_at: string;
    due_date: string;
    status: string;
  }>;
  monthlyStats: Array<{
    month: string;
    books: number;
    users: number;
  }>;
  systemHealth: {
    databaseStatus: "healthy" | "warning" | "error";
    storageUsage: number;
    apiResponseTime: number;
  };
  growthRates: {
    books: number;
    users: number;
    borrows: number;
    overdue: number;
  };
  borrowTrends: Array<{
    month: string;
    borrows: number;
    returns: number;
  }>;
}

const getDashboardStatistics = async (): Promise<DashboardStats> => {
  try {
    const startMonth = new Date();
    startMonth.setDate(1);
    startMonth.setHours(0, 0, 0, 0);

    const startLastMonth = new Date(startMonth);
    startLastMonth.setMonth(startLastMonth.getMonth() - 1);

    const endLastMonth = new Date(startMonth);

    const [countsResult] = await connection.query<RowDataPacket[]>(
      `SELECT
        (SELECT COUNT(*) FROM books) as total_books,
        (SELECT COUNT(*) FROM books WHERE status = 'ACTIVE') as active_books,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM book_categories) as total_categories,
        (SELECT COUNT(*) FROM publishers) as total_publishers,
        (SELECT COUNT(*) FROM books WHERE created_at >= ? AND created_at < NOW()) as books_added_this_month,
        (SELECT COUNT(*) FROM users WHERE created_at >= ? AND created_at < NOW()) as users_joined_this_month,
        (SELECT COUNT(*) FROM books WHERE created_at >= ? AND created_at < ?) as books_added_last_month,
        (SELECT COUNT(*) FROM users WHERE created_at >= ? AND created_at < ?) as users_joined_last_month`,
      [
        startMonth,
        startMonth,
        startLastMonth,
        endLastMonth,
        startLastMonth,
        endLastMonth,
      ]
    );

    const counts = countsResult[0];
    const totalBooks = counts?.total_books || 0;
    const activeBooks = counts?.active_books || 0;
    const totalUsers = counts?.total_users || 0;
    const totalCategories = counts?.total_categories || 0;
    const totalPublishers = counts?.total_publishers || 0;
    const booksAddedThisMonth = counts?.books_added_this_month || 0;
    const usersJoinedThisMonth = counts?.users_joined_this_month || 0;
    const booksAddedLastMonth = counts?.books_added_last_month || 0;
    const usersJoinedLastMonth = counts?.users_joined_last_month || 0;

    let totalBorrows = 0;
    let activeBorrows = 0;
    let overdueBorrows = 0;
    let borrowsThisMonth = 0;
    let borrowsLastMonth = 0;
    let overdueLastMonth = 0;
    let recentBorrowsResult: RowDataPacket[] = [];

    try {
      const [borrowCountsResult] = await connection.query<RowDataPacket[]>(
        `SELECT
          (SELECT COUNT(*) FROM borrows) as total_borrows,
          (SELECT COUNT(*) FROM borrows WHERE status IN ('ACTIVE', 'APPROVED', 'CONFIRMED')) as active_borrows,
          (SELECT COUNT(*) FROM borrows WHERE status IN ('ACTIVE', 'APPROVED', 'CONFIRMED') AND due_date < CURDATE()) as overdue_borrows,
          (SELECT COUNT(*) FROM borrows WHERE created_at >= ? AND created_at < NOW()) as borrows_this_month,
          (SELECT COUNT(*) FROM borrows WHERE created_at >= ? AND created_at < ?) as borrows_last_month,
          (SELECT COUNT(*) FROM borrows WHERE status IN ('ACTIVE', 'APPROVED', 'CONFIRMED') AND due_date < ? AND due_date >= ?) as overdue_last_month`,
        [startMonth, startLastMonth, endLastMonth, endLastMonth, startLastMonth]
      );

      const borrowCounts = borrowCountsResult[0];
      totalBorrows = borrowCounts?.total_borrows || 0;
      activeBorrows = borrowCounts?.active_borrows || 0;
      overdueBorrows = borrowCounts?.overdue_borrows || 0;
      borrowsThisMonth = borrowCounts?.borrows_this_month || 0;
      borrowsLastMonth = borrowCounts?.borrows_last_month || 0;
      overdueLastMonth = borrowCounts?.overdue_last_month || 0;

      [recentBorrowsResult] = await connection.query<RowDataPacket[]>(
        `SELECT
          b.id,
          COALESCE(bk.title, 'Không xác định') as book_title,
          COALESCE(u.full_name, 'Ẩn danh') as user_name,
          b.created_at as borrowed_at,
          b.due_date,
          CASE
            WHEN b.status IN ('ACTIVE', 'APPROVED', 'CONFIRMED') AND b.due_date < CURDATE() THEN 'OVERDUE'
            ELSE b.status
          END as status
        FROM borrows b
        LEFT JOIN borrow_details bd ON bd.borrow_id = b.id
        LEFT JOIN book_copies bc ON bc.id = bd.copy_id
        LEFT JOIN books bk ON bk.id = bc.book_id
        WHERE b.created_at IS NOT NULL
        ORDER BY b.created_at DESC
        LIMIT 10`
      );
    } catch (borrowError) {
      console.log("Borrows table not available, using default values");
    }

    let monthlyStatsResult: Array<{
      month: string;
      books: number;
      users: number;
    }> = [];
    try {
      const monthDates: Array<{ start: Date; end: Date; label: string }> = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        monthDate.setDate(1);
        monthDate.setHours(0, 0, 0, 0);

        const nextMonth = new Date(monthDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const monthLabel = `T${monthDate.getMonth() + 1}`;
        monthDates.push({
          start: monthDate,
          end: nextMonth,
          label: monthLabel,
        });
      }

      const queries = monthDates
        .map(
          () => `SELECT ? as month_label,
          (SELECT COUNT(*) FROM books WHERE created_at >= ? AND created_at < ?) as books,
          (SELECT COUNT(*) FROM users WHERE created_at >= ? AND created_at < ?) as users,
          (SELECT COUNT(*) FROM borrows WHERE created_at >= ? AND created_at < ?) as borrows`
        )
        .join(" UNION ALL ");

      const params: any[] = [];
      monthDates.forEach((md) => {
        params.push(
          md.label,
          md.start,
          md.end,
          md.start,
          md.end,
          md.start,
          md.end
        );
      });

      const [monthlyResult] = await connection.query<RowDataPacket[]>(
        queries,
        params
      );

      monthlyStatsResult = monthlyResult.map((row) => ({
        month: row.month_label,
        books: row.books || 0,
        users: row.users || 0,
      }));
    } catch (monthlyError) {
      console.log("Error fetching monthly stats:", monthlyError);
    }

    let popularCategoriesResult: RowDataPacket[] = [];
    try {
      [popularCategoriesResult] = await connection.query<RowDataPacket[]>(
        `SELECT 
          bc.id as category_id,
          bc.name as category_name,
          COUNT(b.id) as book_count
        FROM book_categories bc
        LEFT JOIN books b ON b.category_id = bc.id
        GROUP BY bc.id, bc.name
        ORDER BY book_count DESC
        LIMIT 5`
      );
    } catch (categoryError) {
      console.log("Error fetching popular categories:", categoryError);
    }

    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    const growthRates = {
      books: calculateGrowth(booksAddedThisMonth, booksAddedLastMonth),
      users: calculateGrowth(usersJoinedThisMonth, usersJoinedLastMonth),
      borrows: calculateGrowth(borrowsThisMonth, borrowsLastMonth),
      overdue: calculateGrowth(overdueBorrows, overdueLastMonth),
    };

    const [borrowTrendRows] = await connection.query<RowDataPacket[]>(`
      SELECT
      DATE_FORMAT(b.borrow_date, '%m') AS month,
      COUNT(*) AS borrows,
      SUM(b.status = 'RETURNED') AS returns
      FROM borrows b
      WHERE b.borrow_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month;
    `);

    const borrowTrends = borrowTrendRows.map((r) => ({
      month: `T${r.month}`,
      borrows: Number(r.borrows),
      returns: Number(r.returns),
    }));

    return {
      totalBooks,
      activeBooks,
      totalUsers,
      totalBorrows,
      activeBorrows,
      overdueBorrows,
      totalCategories,
      totalPublishers,
      booksAddedThisMonth,
      usersJoinedThisMonth,
      borrowsThisMonth,
      booksAddedLastMonth,
      usersJoinedLastMonth,
      borrowsLastMonth,
      overdueLastMonth,
      growthRates,
      popularCategories: popularCategoriesResult.map((row) => ({
        category_id: row.category_id,
        category_name: row.category_name,
        book_count: row.book_count,
      })),
      recentBorrows: recentBorrowsResult.map((row) => ({
        id: row.id,
        book_title: row.book_title,
        user_name: row.user_name,
        borrowed_at: row.borrowed_at,
        due_date: row.due_date,
        status: row.status,
      })),
      monthlyStats: monthlyStatsResult,
      systemHealth: {
        databaseStatus: "healthy",
        storageUsage: 45,
        apiResponseTime: 150,
      },
      borrowTrends,
    };
  } catch (error) {
    console.error("[getDashboardStatistics] Error:", error);
    throw error;
  }
};

interface BorrowManagementParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

const getBorrowManagement = async (params: BorrowManagementParams) => {
  try {
    const { page = 1, limit = 10, search, status } = params;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];

    if (search) {
      whereConditions.push(
        "(b.title LIKE ? OR u.full_name LIKE ? OR u.student_id LIKE ?)"
      );
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      if (status === "OVERDUE") {
        whereConditions.push(
          "br.status IN ('ACTIVE', 'APPROVED', 'CONFIRMED') AND br.due_date < CURDATE()"
        );
      } else if (status === "ACTIVE" || status === "BORROWED") {
        whereConditions.push(
          "br.status IN ('ACTIVE', 'APPROVED', 'CONFIRMED')"
        );
      } else {
        whereConditions.push("br.status = ?");
        queryParams.push(status);
      }
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const [totalResult] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT br.id) as count
        FROM borrows br
        JOIN users u ON u.id = br.user_id
        LEFT JOIN borrow_details bd ON bd.borrow_id = br.id
        LEFT JOIN book_copies bc ON bc.id = bd.copy_id
        LEFT JOIN books b ON b.id = bc.book_id
        ${whereClause}`,
      queryParams
    );
    const total = totalResult[0]?.count || 0;

    const [borrows] = await connection.query<RowDataPacket[]>(
      `SELECT 
        br.id,
        br.user_id,
        u.full_name as user_name,
        u.student_id,
        br.borrow_date as borrowed_at,
        br.due_date,
        br.return_date as returned_at,
        CASE 
          WHEN br.status IN ('ACTIVE', 'APPROVED', 'CONFIRMED') 
              AND br.due_date < CURDATE()
          THEN 'OVERDUE'
          ELSE br.status
        END as status,
        GROUP_CONCAT(
          DISTINCT b.title
          ORDER BY b.title
          SEPARATOR ', '
        ) as book_title
      FROM borrows br
      JOIN users u ON u.id = br.user_id
      LEFT JOIN borrow_details bd ON bd.borrow_id = br.id
      LEFT JOIN book_copies bc ON bc.id = bd.copy_id
      LEFT JOIN books b ON b.id = bc.book_id
      ${whereClause}
      GROUP BY br.id
      ORDER BY br.borrow_date DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    return {
      borrows: borrows.map((row) => ({
        id: row.id,
        book_title: row.book_title,
        user_id: row.user_id,
        user_name: row.user_name,
        student_id: row.student_id,
        borrowed_at: row.borrowed_at,
        due_date: row.due_date,
        returned_at: row.returned_at,
        status: row.status,
      })),
      total,
    };
  } catch (error) {
    console.error("[getBorrowManagement] Error:", error);
    throw error;
  }
};

const updateBorrowStatus = async (
  borrowId: number,
  status: string
): Promise<void> => {
  const validStatuses = ["BORROWED", "RETURNED", "OVERDUE"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  const updates: string[] = ["status = ?"];
  const params: any[] = [status];

  if (status === "RETURNED") {
    updates.push("returned_at = NOW()");
  }

  await connection.query(
    `UPDATE borrows SET ${updates.join(", ")} WHERE id = ?`,
    [...params, borrowId]
  );
};

interface BookManagementParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

const getBookManagement = async (params: BookManagementParams) => {
  try {
    const { page = 1, limit = 10, search, status } = params;
    const offset = (page - 1) * limit;

    let where: string[] = [];
    let values: any[] = [];

    if (search) {
      where.push("(b.title LIKE ? OR a.name LIKE ? OR bc.name LIKE ?)");
      const like = `%${search}%`;
      values.push(like, like, like);
    }

    if (status) {
      where.push("b.status = ?");
      values.push(status);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await connection.query<RowDataPacket[]>(
      `
      SELECT 
        b.id,
        b.title,
        COALESCE(GROUP_CONCAT(DISTINCT a.name SEPARATOR ', '), '—') AS author_names,
        COALESCE(bc.name, '—') AS category_name,
        COALESCE(p.name, '—') AS publisher_name,
        b.status,
        COUNT(DISTINCT c.id) AS copies_count,
        SUM(CASE WHEN c.status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_count,
        b.created_at
      FROM books b
      LEFT JOIN book_authors ba ON ba.book_id = b.id
      LEFT JOIN authors a ON a.id = ba.author_id
      LEFT JOIN book_categories bc ON bc.id = b.category_id
      LEFT JOIN publishers p ON p.id = b.publisher_id
      LEFT JOIN book_copies c ON c.book_id = b.id
      ${whereClause}
      GROUP BY b.id
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );

    const [countRows] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT b.id) as total FROM books b
      LEFT JOIN book_authors ba ON ba.book_id = b.id
      LEFT JOIN authors a ON a.id = ba.author_id
      LEFT JOIN book_categories bc ON bc.id = b.category_id
      ${whereClause}`,
      values
    );

    return {
      books: rows,
      total: countRows[0]?.total || 0,
    };
  } catch (error) {
    console.error("[getBookManagement] Error:", error);
    throw error;
  }
};

const getUserManagement = async (params: {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}) => {
  try {
    const { page = 1, limit = 10, search, role } = params;
    const offset = (page - 1) * limit;

    let where: string[] = [];
    let values: any[] = [];

    if (search) {
      where.push(
        "(u.full_name LIKE ? OR u.email LIKE ? OR u.student_id LIKE ?)"
      );
      const like = `%${search}%`;
      values.push(like, like, like);
    }

    if (role) {
      where.push("u.role = ?");
      values.push(role);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await connection.query<RowDataPacket[]>(
      `
      SELECT 
        u.id,
        u.student_id,
        u.full_name,
        u.email,
        u.role,
        u.status,
        u.created_at,
        s.class_name,
        s.faculty
      FROM users u
      LEFT JOIN students s ON s.student_id = u.student_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );

    const [countRows] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      values
    );

    return {
      users: rows,
      total: countRows[0]?.total || 0,
    };
  } catch (error) {
    console.error("[getUserManagement] Error:", error);
    throw error;
  }
};

const statisticsService = {
  getDashboardStatistics,
  getBorrowManagement,
  updateBorrowStatus,
  getBookManagement,
  getUserManagement,
};

export default statisticsService;
