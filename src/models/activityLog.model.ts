import { RowDataPacket } from "mysql2";

export enum ActivityType {
  SYSTEM = "SYSTEM",
  FORUM = "FORUM",
  BOOK = "BOOK",
  BORROW = "BORROW",
  USER = "USER",
  ORDER = "ORDER",
  OTHER = "OTHER",
}

export interface ActivityLog extends RowDataPacket {
  id: string;
  user_id: string | null;
  type: ActivityType;
  action: string;
  target_type: string | null;
  target_id: string | null;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface ActivityLogWithUser extends ActivityLog {
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
}

export interface CreateActivityLogInput {
  user_id?: string | null;
  type: ActivityType;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  description?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}
