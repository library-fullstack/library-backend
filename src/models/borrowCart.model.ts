import { RowDataPacket } from "mysql2";

interface BorrowCart extends RowDataPacket {
  id: number;
  user_id: string;
  book_id: number;
  quantity: number;
  created_at?: Date;
  updated_at?: Date;
}

interface BorrowCartItem extends BorrowCart {
  book?: {
    title: string;
    author_names?: string;
    thumbnail_url?: string;
    available_count?: number;
  };
}

export { BorrowCart, BorrowCartItem };
