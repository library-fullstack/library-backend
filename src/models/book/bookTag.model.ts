import { RowDataPacket } from "mysql2";

export interface BookTag extends RowDataPacket {
  id?: number;
  name: string;
}
