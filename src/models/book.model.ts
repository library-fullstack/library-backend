import { RowDataPacket } from "mysql2";

interface Book extends RowDataPacket {
  id?: number;
  title: string;
  categoryId?: number | null;
  publisherId?: number | null;
  publicationYear?: number | null;
  isbn13?: string | null;
  callNumber?: string | null;
  languageCode?: string | null;
  format?: "PAPERBACK" | "HARDCOVER" | "OTHER" | null;
  status?: "ACTIVE" | "INACTIVE" | "DRAFT";
  description?: string | null;
  thumbnailUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  authorNames?: string[] | null;
  categoryName?: string | null;
  publisherName?: string | null;
  tags?: string[] | null;
  copiesCount?: number | null;
  availableCount?: number | null;
}

type BookInput = {
  title: string;
  categoryId?: number | null;
  publisherId?: number | null;
  publicationYear?: number | null;
  isbn13?: string | null;
  callNumber?: string | null;
  languageCode?: string | null;
  format?: "PAPERBACK" | "HARDCOVER" | "OTHER" | null;
  description?: string | null;
  thumbnailUrl?: string | null;
};

type BookInputFull = BookInput & {
  status?: "ACTIVE" | "INACTIVE" | "DRAFT";
};

export { Book, BookInput, BookInputFull };
