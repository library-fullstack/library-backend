import { RowDataPacket } from "mysql2";

export interface BookAuthor extends RowDataPacket {
  book_id: number;
  author_id: number;
  role?: "AUTHOR" | "CO_AUTHOR" | "TRANSLATOR" | "EDITOR" | "OTHER";
  ord?: number | null;
}
