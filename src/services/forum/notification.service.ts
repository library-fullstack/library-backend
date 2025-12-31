import connection from "../../config/db";
import type {
  UserNotification,
  CreateNotificationInput,
} from "../../models/forum/notification.model";

function convertToISO(mysqlDateTime: any): string {
  if (!mysqlDateTime) return new Date().toISOString();

  if (!(mysqlDateTime instanceof Date)) {
    if (typeof mysqlDateTime === "string") {
      const [date, time] = mysqlDateTime.split(" ");
      return `${date}T${time}`;
    }
    return new Date().toISOString();
  }

  const vietnamDate = new Date(mysqlDateTime.getTime() + 7 * 60 * 60 * 1000);

  const year = vietnamDate.getUTCFullYear();
  const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(vietnamDate.getUTCDate()).padStart(2, "0");
  const hours = String(vietnamDate.getUTCHours()).padStart(2, "0");
  const minutes = String(vietnamDate.getUTCMinutes()).padStart(2, "0");
  const seconds = String(vietnamDate.getUTCSeconds()).padStart(2, "0");

  const result = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  console.log(
    `[convertToISO] Input: ${mysqlDateTime.toISOString()} -> Output: ${result}`
  );
  return result;
}

const ForumNotificationService = {
  async createNotification(
    input: CreateNotificationInput
  ): Promise<UserNotification> {
    const { user_id, ntype, payload } = input;

    const query = `
      INSERT INTO user_notifications (user_id, ntype, payload, created_at)
      VALUES (?, ?, ?, NOW())
    `;

    const [result] = await connection.query(query, [
      user_id,
      ntype,
      JSON.stringify(payload),
    ]);

    const insertResult = result as any;
    return this.getNotificationById(
      insertResult.insertId
    ) as Promise<UserNotification>;
  },

  async getNotificationById(
    notificationId: number
  ): Promise<UserNotification | null> {
    const query = `
      SELECT id, user_id, ntype, payload, read_at, created_at
      FROM user_notifications
      WHERE id = ?
    `;

    const [results] = await connection.query(query, [notificationId]);
    const notification = (results as any[])[0];

    if (!notification) return null;

    return {
      ...notification,
      created_at: convertToISO(notification.created_at),
      read_at: notification.read_at ? convertToISO(notification.read_at) : null,
      payload:
        typeof notification.payload === "string"
          ? JSON.parse(notification.payload)
          : notification.payload,
    } as UserNotification;
  },

  async getUnreadNotifications(
    userId: string,
    limit: number = 20
  ): Promise<UserNotification[]> {
    const query = `
      SELECT id, user_id, ntype, payload, read_at, created_at
      FROM user_notifications
      WHERE user_id = ? AND read_at IS NULL
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const [results] = await connection.query(query, [userId, limit]);

    return (results as any[]).map((notif) => ({
      ...notif,
      created_at: convertToISO(notif.created_at),
      read_at: notif.read_at ? convertToISO(notif.read_at) : null,
      payload:
        typeof notif.payload === "string"
          ? JSON.parse(notif.payload)
          : notif.payload,
    })) as UserNotification[];
  },

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: UserNotification[]; total: number }> {
    const offset = (page - 1) * limit;

    const query = `
      SELECT id, user_id, ntype, payload, read_at, created_at
      FROM user_notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [results] = await connection.query(query, [userId, limit, offset]);

    const countQuery = `SELECT COUNT(*) as total FROM user_notifications WHERE user_id = ?`;
    const [countResult] = await connection.query(countQuery, [userId]);

    const total = (countResult as any[])[0]?.total || 0;

    const notifications = (results as any[]).map((notif) => ({
      ...notif,
      created_at: convertToISO(notif.created_at),
      read_at: notif.read_at ? convertToISO(notif.read_at) : null,
      payload:
        typeof notif.payload === "string"
          ? JSON.parse(notif.payload)
          : notif.payload,
    })) as UserNotification[];

    return { notifications, total };
  },

  async markNotificationAsRead(notificationId: number): Promise<void> {
    const query = `UPDATE user_notifications SET read_at = NOW() WHERE id = ?`;
    await connection.query(query, [notificationId]);
  },

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const query = `UPDATE user_notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL`;
    await connection.query(query, [userId]);
  },

  async deleteNotification(notificationId: number): Promise<void> {
    const query = `DELETE FROM user_notifications WHERE id = ?`;
    await connection.query(query, [notificationId]);
  },

  async deleteOldNotifications(daysOld: number = 30): Promise<void> {
    const query = `
      DELETE FROM user_notifications
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    await connection.query(query, [daysOld]);
  },

  async getUnreadCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM user_notifications
      WHERE user_id = ? AND read_at IS NULL
    `;

    const [results] = await connection.query(query, [userId]);
    return (results as any[])[0]?.count || 0;
  },

  async notifyPostReply(
    postId: number,
    postAuthorId: string,
    commentAuthorId: string,
    commentAuthorName: string,
    commentExcerpt: string
  ): Promise<void> {
    if (postAuthorId !== commentAuthorId) {
      await this.createNotification({
        user_id: postAuthorId,
        ntype: "REPLY",
        payload: {
          postId,
          byUserId: commentAuthorId,
          byUserName: commentAuthorName,
          excerpt: commentExcerpt,
          action: "replied_to_post",
        },
      });
    }
  },

  async notifyCommentReply(
    commentId: number,
    parentCommentAuthorId: string,
    replyAuthorId: string,
    replyAuthorName: string,
    replyExcerpt: string
  ): Promise<void> {
    if (parentCommentAuthorId !== replyAuthorId) {
      await this.createNotification({
        user_id: parentCommentAuthorId,
        ntype: "REPLY",
        payload: {
          commentId,
          byUserId: replyAuthorId,
          byUserName: replyAuthorName,
          excerpt: replyExcerpt,
          action: "replied_to_comment",
        },
      });
    }
  },
};

export default ForumNotificationService;
