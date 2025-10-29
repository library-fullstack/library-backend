import { RowDataPacket } from "mysql2";

export interface BookCategory extends RowDataPacket {
  id?: number;
  name: string;
  parent_id?: number | null;
}
