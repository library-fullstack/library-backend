import { RowDataPacket } from "mysql2";

export interface BookPublisher extends RowDataPacket {
  id?: number;
  name: string;
  city?: string | null;
  country?: string | null;
}
