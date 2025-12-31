import db from "../config/db";
import type {
  Notification,
  CreateNotificationInput,
} from "../models/notification.model";

class NotificationService {
  async create(input: CreateNotificationInput): Promise<number> {
    const query = `
      INSERT INTO user_notifications (
        user_id, ntype, payload, created_at
      ) VALUES (?, ?, ?, NOW())
    `;

    const [result] = await db.execute<any>(query, [
      input.user_id,
      input.ntype,
      JSON.stringify(input.payload),
    ]);

    return result.insertId;
  }

  async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ notifications: Notification[]; total: number }> {
    const safeLimit = Math.max(
      1,
      Math.min(100, parseInt(String(limit), 10) || 50)
    );
    const safeOffset = Math.max(0, parseInt(String(offset), 10) || 0);

    console.log(
      "[getUserNotifications] Params:",
      JSON.stringify({
        userId,
        limit: safeLimit,
        offset: safeOffset,
        limitType: typeof safeLimit,
        offsetType: typeof safeOffset,
        limitIsInteger: Number.isInteger(safeLimit),
        offsetIsInteger: Number.isInteger(safeOffset),
      })
    );

    const countQuery = `
      SELECT COUNT(*) as count 
      FROM user_notifications 
      WHERE user_id = ?
    `;

    const [countRows] = await db.execute<any[]>(countQuery, [userId]);
    const total = (countRows as any)[0]?.count || 0;

    const query = `
      SELECT * FROM user_notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;

    const [rows] = await db.query<any[]>(query, [userId]);

    const notifications = rows.map((row) => {
      let isoDate = new Date().toISOString();
      if (row.created_at) {
        const mysqlDate = new Date(row.created_at);
        const utcDate = new Date(mysqlDate.getTime() + 7 * 60 * 60 * 1000);
        isoDate = utcDate.toISOString();
      }

      return {
        ...row,
        payload:
          typeof row.payload === "string"
            ? JSON.parse(row.payload)
            : row.payload,
        created_at: isoDate,
      };
    });

    return {
      notifications,
      total,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count 
      FROM user_notifications 
      WHERE user_id = ? AND read_at IS NULL
    `;

    const [[result]] = await db.execute<any[]>(query, [userId]);
    return result.count;
  }

  async markAsRead(notificationId: number, userId: string): Promise<void> {
    const query = `
      UPDATE user_notifications 
      SET read_at = NOW() 
      WHERE id = ? AND user_id = ? AND read_at IS NULL
    `;

    await db.execute(query, [notificationId, userId]);
  }

  async markAllAsRead(userId: string): Promise<void> {
    const query = `
      UPDATE user_notifications 
      SET read_at = NOW() 
      WHERE user_id = ? AND read_at IS NULL
    `;

    await db.execute(query, [userId]);
  }

  async deleteNotification(
    notificationId: number,
    userId: string
  ): Promise<void> {
    const query = `
      DELETE FROM user_notifications 
      WHERE id = ? AND user_id = ?
    `;

    await db.execute(query, [notificationId, userId]);
  }

  async deleteOldNotifications(daysOld: number = 90): Promise<number> {
    const query = `
      DELETE FROM user_notifications 
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    const [result] = await db.execute<any>(query, [daysOld]);
    return result.affectedRows || 0;
  }

  async createBorrowNotification(
    userId: string,
    type: string,
    borrowId: number,
    title: string,
    message: string
  ): Promise<number> {
    return this.create({
      user_id: userId,
      ntype: "SYSTEM" as any,
      payload: {
        type,
        title,
        message,
        borrow_id: borrowId,
        link: "/user/profile?tab=borrows",
      },
    });
  }

  async createForumNotification(
    userId: string,
    type: string,
    postId: number,
    title: string,
    message: string,
    additionalData?: Record<string, any>
  ): Promise<number> {
    return this.create({
      user_id: userId,
      ntype:
        type === "POST_LIKED" || type === "POST_COMMENTED"
          ? "REPLY"
          : ("MODERATION" as any),
      payload: {
        type,
        title,
        message,
        post_id: postId,
        link: `/forum/posts/${postId}`,
        ...additionalData,
      },
    });
  }
}

export default new NotificationService();
