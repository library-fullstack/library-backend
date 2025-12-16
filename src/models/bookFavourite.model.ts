import { RowDataPacket } from "mysql2";

interface BookFavourite extends RowDataPacket {
  id: number;
  user_id: string;
  book_id: number;
  created_at?: Date;
  updated_at?: Date;
}

interface BookFavouriteItem extends BookFavourite {
  book?: {
    title: string;
    author_names?: string;
    thumbnail_url?: string;
    description?: string;
    isbn?: string;
    publisher_name?: string;
    publication_date?: string;
    available_count?: number;
  };
}

export { BookFavourite, BookFavouriteItem };
