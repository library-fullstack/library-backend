import { RowDataPacket } from "mysql2";

type ReportTargetType = "POST" | "COMMENT";
type ReportStatus = "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED";

interface ForumReport extends RowDataPacket {
  id: number;
  target_type: ReportTargetType;
  target_post_id?: number | null;
  target_comment_id?: number | null;
  reporter_id: string;
  reason: string;
  status: ReportStatus;
  handled_by?: string | null;
  resolution_note?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface CreateReportInput {
  target_type: ReportTargetType;
  target_post_id?: number | null;
  target_comment_id?: number | null;
  reason: string;
}

interface UpdateReportInput {
  status?: ReportStatus;
  handled_by?: string;
  resolution_note?: string;
}

interface ReportResponse {
  success: boolean;
  message: string;
  data?: ForumReport | ForumReport[];
}

export {
  ForumReport,
  CreateReportInput,
  UpdateReportInput,
  ReportResponse,
  ReportTargetType,
  ReportStatus,
};
