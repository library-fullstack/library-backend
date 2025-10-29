import { RowDataPacket } from "mysql2";

export interface BookImage extends RowDataPacket {
  id?: number;
  book_id: number;
  url: string;
  kind?: "COVER" | "GALLERY";
  sort_order?: number;
  alt_text?: string | null;
}
