import db from "../config/db.ts";
import { v4 as uuidv4 } from "uuid";
import type {
  ActivityLog,
  ActivityLogWithUser,
  CreateActivityLogInput,
  ActivityType,
} from "../models/activityLog.model.ts";

class ActivityLogService {
  async create(data: CreateActivityLogInput): Promise<string> {
    const id = uuidv4();
    const query = `
      INSERT INTO activity_logs (
        id, user_id, type, action, target_type, target_id, 
        description, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    await db.execute(query, [
      id,
      data.user_id || null,
      data.type,
      data.action,
      data.target_type || null,
      data.target_id || null,
      data.description || null,
      data.ip_address || null,
      data.user_agent || null,
    ]);

    return id;
  }

  async getRecentActivities(
    limit: number = 10
  ): Promise<ActivityLogWithUser[]> {
    const safeLimit = Math.max(1, Math.min(1000, parseInt(String(limit))));

    const query = `
      SELECT 
        al.*,
        u.full_name as user_name,
        u.email as user_email,
        u.role as user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ${safeLimit}
    `;

    const [rows] = await db.execute<ActivityLogWithUser[]>(query);
    return rows;
  }

  async getActivitiesByUser(
    userId: string,
    limit: number = 20
  ): Promise<ActivityLog[]> {
    const query = `
      SELECT * FROM activity_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const [rows] = await db.execute<ActivityLog[]>(query, [userId, limit]);
    return rows;
  }

  async getActivitiesByType(
    type: ActivityType,
    limit: number = 50
  ): Promise<ActivityLogWithUser[]> {
    const query = `
      SELECT 
        al.*,
        u.full_name as user_name,
        u.email as user_email,
        u.role as user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.type = ?
      ORDER BY al.created_at DESC
      LIMIT ?
    `;

    const [rows] = await db.execute<ActivityLogWithUser[]>(query, [
      type,
      limit,
    ]);
    return rows;
  }

  async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
    const query = `
      DELETE FROM activity_logs
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    const [result] = await db.execute<any>(query, [daysToKeep]);
    return result.affectedRows || 0;
  }
}

export default new ActivityLogService();
