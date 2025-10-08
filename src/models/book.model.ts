import { RowDataPacket } from "mysql2";

interface Book extends RowDataPacket {
  id?: string;
  title: string;
  author: string;
  category: string;
  price: number;
  stock: number;
  description?: string;
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

export { Book, BookInput };
