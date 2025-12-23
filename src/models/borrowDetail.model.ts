import { RowDataPacket } from "mysql2";

export interface BorrowDetail extends RowDataPacket {
  id: number;
  borrow_id: number;
  copy_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface BorrowDetailWithBook extends BorrowDetail {
  book_id: number;
  book_title: string;
  thumbnail_url?: string;
  isbn?: string;
  barcode?: string;
}
