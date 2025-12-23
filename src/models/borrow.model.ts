import { RowDataPacket } from "mysql2";

export enum BorrowStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  APPROVED = "APPROVED",
  ACTIVE = "ACTIVE",
  RETURNED = "RETURNED",
  CANCELLED = "CANCELLED",
  OVERDUE = "OVERDUE",
}

export interface Borrow extends RowDataPacket {
  id: number;
  user_id: string;
  borrow_date: Date;
  due_date: Date;
  return_date?: Date | null;
  status: BorrowStatus;
  signature?: string | null;
  notes?: string | null;
  renewal_count?: number;
  last_renewal_date?: Date | null;
  fine?: number;
  created_at: Date;
  updated_at: Date;
}

export interface BorrowWithDetails extends Borrow {
  user?: {
    id: string;
    fullname: string;
    email: string;
    student_id?: string;
  };
  items?: Array<{
    copy_id: number;
    book_id: number;
    book_title: string;
    thumbnail_url?: string;
    isbn?: string;
    barcode?: string;
  }>;
}

export interface CreateBorrowInput {
  user_id: string;
  items: Array<{
    book_id: number;
    quantity: number;
  }>;
}

export interface ConfirmBorrowInput {
  borrow_id: number;
  user_id: string;
  signature: string;
}
