import { RowDataPacket } from "mysql2";

export enum EventStatus {
  UPCOMING = "UPCOMING",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface Event extends RowDataPacket {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  start_time: Date;
  end_time: Date;
  status: EventStatus;
  created_by: string | null;
  thumbnail_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface EventWithCreator extends Event {
  creator_name?: string;
  creator_email?: string;
  creator_avatar?: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  start_time: Date;
  end_time: Date;
  status?: EventStatus;
  created_by: string;
  thumbnail_url?: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  location?: string;
  start_time?: Date;
  end_time?: Date;
  status?: EventStatus;
  thumbnail_url?: string;
}

export interface EventListFilter {
  page?: number;
  limit?: number;
  status?: EventStatus;
  search?: string;
  created_by?: string;
  from_date?: Date;
  to_date?: Date;
}
