import connection from "../../config/db.ts";

const ForumModerationService = {
  async approvePost(
    postId: number,
    approvedBy: string
  ): Promise<{ success: boolean }> {
    const query = `
      UPDATE forum_posts
      SET status = 'APPROVED', approved_by = ?, approved_at = NOW()
      WHERE id = ? AND status = 'PENDING'
    `;
    const [result] = await connection.execute(query, [approvedBy, postId]);
    return { success: (result as any).affectedRows > 0 };
  },

  async rejectPost(
    postId: number,
    rejectedBy: string
  ): Promise<{ success: boolean }> {
    const query = `
      UPDATE forum_posts
      SET status = 'REJECTED', approved_by = ?, approved_at = NOW()
      WHERE id = ? AND status = 'PENDING'
    `;
    const [result] = await connection.execute(query, [rejectedBy, postId]);
    return { success: (result as any).affectedRows > 0 };
  },

  async togglePinPost(postId: number): Promise<{ success: boolean }> {
    const query = `
      UPDATE forum_posts
      SET pinned = NOT pinned
      WHERE id = ?
    `;
    const [result] = await connection.execute(query, [postId]);
    return { success: (result as any).affectedRows > 0 };
  },
  async toggleLockPost(
    postId: number,
    lockedBy?: string
  ): Promise<{ success: boolean }> {
    const getQuery = `SELECT is_locked FROM forum_posts WHERE id = ?`;
    const [rows] = await connection.execute(getQuery, [postId]);
    const post = (rows as any[])[0];

    if (!post) {
      throw new Error("Post not found");
    }

    const isLocked = post.is_locked === 1;
    const query = isLocked
      ? `UPDATE forum_posts SET is_locked = 0, locked_at = NULL, locked_by = NULL WHERE id = ?`
      : `UPDATE forum_posts SET is_locked = 1, locked_at = NOW(), locked_by = ? WHERE id = ?`;

    const [result] = await connection.execute(
      query,
      isLocked ? [postId] : [lockedBy, postId]
    );
    return { success: (result as any).affectedRows > 0 };
  },

  async banUser(
    userId: string,
    reason?: string
  ): Promise<{ success: boolean }> {
    const query = `
      UPDATE users
      SET status = 'BANNED'
      WHERE id = ?
    `;
    const [result] = await connection.execute(query, [userId]);

    if ((result as any).affectedRows > 0) {
      const logQuery = `
        INSERT INTO activity_logs (id, user_id, type, action, description, created_at)
        VALUES (UUID(), ?, 'FORUM', 'USER_BANNED', ?, NOW())
      `;
      await connection.execute(logQuery, [userId, reason || "User banned"]);
    }

    return { success: (result as any).affectedRows > 0 };
  },

  async unbanUser(userId: string): Promise<{ success: boolean }> {
    const query = `
      UPDATE users
      SET status = 'ACTIVE'
      WHERE id = ? AND status = 'BANNED'
    `;
    const [result] = await connection.execute(query, [userId]);
    return { success: (result as any).affectedRows > 0 };
  },

  async getPendingPosts(
    page: number = 1,
    limit: number = 20
  ): Promise<{ posts: any[]; total: number }> {
    try {
      const offset = (page - 1) * limit;

      const countQuery = `SELECT COUNT(*) as total FROM forum_posts WHERE status = 'PENDING'`;
      const [countResult] = await connection.query(countQuery);
      const total = Array.isArray(countResult)
        ? (countResult[0] as { total: number }).total
        : 0;

      const query = `
        SELECT p.*, u.full_name, u.avatar_url, u.role as userRole, c.name as category_name
        FROM forum_posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN forum_categories c ON p.category_id = c.id
        WHERE p.status = 'PENDING'
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;
      const [posts] = await connection.query(query, [limit, offset]);

      return { posts: (Array.isArray(posts) ? posts : []) as any[], total };
    } catch (error) {
      console.error("ForumModerationService.getPendingPosts error:", error);
      throw error;
    }
  },

  async getActivityLog(
    page: number = 1,
    limit: number = 50,
    type: string = "FORUM"
  ): Promise<{ logs: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const countQuery = `SELECT COUNT(*) as total FROM activity_logs WHERE type = ?`;
    const [countResult] = await connection.query(countQuery, [type]);
    const total = Array.isArray(countResult)
      ? (countResult[0] as { total: number }).total
      : 0;

    const query = `
      SELECT a.*, u.full_name
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.type = ?
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [logs] = await connection.query(query, [type, limit, offset]);

    return { logs: (Array.isArray(logs) ? logs : []) as any[], total };
  },

  async getBannedUsers(
    page: number = 1,
    limit: number = 20
  ): Promise<{ users: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const countQuery = `SELECT COUNT(*) as total FROM users WHERE status = 'BANNED'`;
    const [countResult] = await connection.query(countQuery);
    const total = Array.isArray(countResult)
      ? (countResult[0] as { total: number }).total
      : 0;

    const query = `
      SELECT id, full_name, email, created_at, updated_at
      FROM users
      WHERE status = 'BANNED'
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `;
    const [users] = await connection.query(query, [limit, offset]);

    return { users: (Array.isArray(users) ? users : []) as any[], total };
  },
};

export default ForumModerationService;
