import { RowDataPacket } from "mysql2";

interface Book extends RowDataPacket {
  id?: number;
  title: string;
  author: string;
  category: string | null;
  price: number;
  stock: number;
  description?: string | null;
  publisherId?: number | null;
  publicationYear?: number | null;
  isbn13?: string | null;
  languageCode?: string | null;
  format?: "PAPERBACK" | "HARDCOVER" | "OTHER" | null;
  status?: "ACTIVE" | "INACTIVE" | "DRAFT";
  thumbnailUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type BookInput = {
  title: string;
  author: string;
  category: string;
  price: number;
  stock: number;
  description?: string;
};

type BookInputFull = BookInput & {
  isbn13?: string | null;
  publicationYear?: number | null;
  publisherId?: number | null;
  languageCode?: string | null;
  format?: "PAPERBACK" | "HARDCOVER" | "OTHER" | null;
  thumbnailUrl?: string | null;
};

export { Book, BookInput, BookInputFull };
