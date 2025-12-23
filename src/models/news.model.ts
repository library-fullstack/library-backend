import { RowDataPacket } from "mysql2";

export enum NewsCategory {
  ANNOUNCEMENT = "ANNOUNCEMENT",
  GUIDE = "GUIDE",
  UPDATE = "UPDATE",
  OTHER = "OTHER",
}

export enum NewsStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export interface News extends RowDataPacket {
  id: number;
  title: string;
  slug: string;
  content: string;
  category: NewsCategory;
  status: NewsStatus;
  author_id: string | null;
  thumbnail_url: string | null;
  published_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface NewsWithAuthor extends News {
  author_name?: string;
  author_email?: string;
  author_avatar?: string;
}

export interface CreateNewsInput {
  title: string;
  content: string;
  category: NewsCategory;
  status?: NewsStatus;
  author_id: string;
  thumbnail_url?: string;
}

export interface UpdateNewsInput {
  title?: string;
  content?: string;
  category?: NewsCategory;
  status?: NewsStatus;
  thumbnail_url?: string;
}

export interface NewsListFilter {
  page?: number;
  limit?: number;
  category?: NewsCategory;
  status?: NewsStatus;
  search?: string;
  author_id?: string;
}
