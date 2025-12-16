import connection from "../../config/db.ts";
import type {
  ForumReport,
  CreateReportInput,
  UpdateReportInput,
} from "../../models/forum/report.model.ts";

const ForumReportService = {
  async createReport(
    input: CreateReportInput,
    reporterId: string
  ): Promise<ForumReport> {
    const {
      target_type,
      target_post_id = null,
      target_comment_id = null,
      reason,
    } = input;

    const query = `
      INSERT INTO forum_reports (
        target_type,
        target_post_id,
        target_comment_id,
        reporter_id,
        reason,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, 'OPEN', NOW(), NOW())
    `;

    const [result] = await connection.query(query, [
      target_type,
      target_post_id,
      target_comment_id,
      reporterId,
      reason,
    ]);

    const insertResult = result as any;
    return this.getReportById(insertResult.insertId) as Promise<ForumReport>;
  },

  async getReportById(reportId: number): Promise<ForumReport | null> {
    const query = `
      SELECT id, target_type, target_post_id, target_comment_id, reporter_id, reason,
             status, handled_by, resolution_note, created_at, updated_at
      FROM forum_reports
      WHERE id = ?
    `;

    const [results] = await connection.query(query, [reportId]);
    return (results as ForumReport[])[0] || null;
  },

  async getReportsByStatus(
    status: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reports: ForumReport[]; total: number }> {
    const offset = (page - 1) * limit;

    const query = `
      SELECT id, target_type, target_post_id, target_comment_id, reporter_id, reason,
             status, handled_by, resolution_note, created_at, updated_at
      FROM forum_reports
      WHERE status = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [results] = await connection.query(query, [status, limit, offset]);

    const countQuery = `SELECT COUNT(*) as total FROM forum_reports WHERE status = ?`;
    const [countResult] = await connection.query(countQuery, [status]);

    const total = (countResult as any[])[0]?.total || 0;

    return { reports: results as ForumReport[], total };
  },

  async getAllReports(
    page: number = 1,
    limit: number = 10
  ): Promise<{ reports: ForumReport[]; total: number }> {
    const offset = (page - 1) * limit;

    const query = `
      SELECT id, target_type, target_post_id, target_comment_id, reporter_id, reason,
             status, handled_by, resolution_note, created_at, updated_at
      FROM forum_reports
      ORDER BY status DESC, created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [results] = await connection.query(query, [limit, offset]);

    const countQuery = `SELECT COUNT(*) as total FROM forum_reports`;
    const [countResult] = await connection.query(countQuery);

    const total = (countResult as any[])[0]?.total || 0;

    return { reports: results as ForumReport[], total };
  },

  async updateReport(
    reportId: number,
    input: UpdateReportInput
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (input.status !== undefined) {
      fields.push("status = ?");
      values.push(input.status);
    }
    if (input.handled_by !== undefined) {
      fields.push("handled_by = ?");
      values.push(input.handled_by);
    }
    if (input.resolution_note !== undefined) {
      fields.push("resolution_note = ?");
      values.push(input.resolution_note);
    }

    if (!fields.length) return;

    fields.push("updated_at = NOW()");
    values.push(reportId);

    const query = `UPDATE forum_reports SET ${fields.join(", ")} WHERE id = ?`;
    await connection.query(query, values);
  },

  async getDuplicateReports(
    targetType: string,
    targetId: number
  ): Promise<ForumReport[]> {
    const column =
      targetType === "POST" ? "target_post_id" : "target_comment_id";
    const query = `
      SELECT id, target_type, target_post_id, target_comment_id, reporter_id, reason,
             status, handled_by, resolution_note, created_at, updated_at
      FROM forum_reports
      WHERE ${column} = ? AND status IN ('OPEN', 'REVIEWING')
      ORDER BY created_at DESC
    `;

    const [results] = await connection.query(query, [targetId]);
    return results as ForumReport[];
  },
};

export default ForumReportService;
