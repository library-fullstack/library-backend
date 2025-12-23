import connection from "../../config/db.ts";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function findOrCreateAuthor(name: string): Promise<number> {
  if (!name || !name.trim()) {
    throw new Error("Tên tác giả không được để trống");
  }

  const trimmedName = name.trim();

  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT id FROM authors WHERE TRIM(name) = ?",
    [trimmedName]
  );

  if (rows.length > 0) {
    return rows[0].id;
  }

  const [result] = await connection.query<ResultSetHeader>(
    "INSERT INTO authors (name) VALUES (?)",
    [trimmedName]
  );

  return result.insertId;
}

export async function findOrCreatePublisher(name: string): Promise<number> {
  if (!name || !name.trim()) {
    throw new Error("Tên nhà xuất bản không được để trống");
  }

  const trimmedName = name.trim();

  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT id FROM publishers WHERE TRIM(name) = ?",
    [trimmedName]
  );

  if (rows.length > 0) {
    return rows[0].id;
  }

  const [result] = await connection.query<ResultSetHeader>(
    "INSERT INTO publishers (name) VALUES (?)",
    [trimmedName]
  );

  return result.insertId;
}

export async function findOrCreateCategory(name: string): Promise<number> {
  if (!name || !name.trim()) {
    throw new Error("Tên danh mục không được để trống");
  }

  const trimmedName = name.trim();

  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT id FROM book_categories WHERE TRIM(name) = ?",
    [trimmedName]
  );

  if (rows.length > 0) {
    return rows[0].id;
  }

  const [result] = await connection.query<ResultSetHeader>(
    "INSERT INTO book_categories (name) VALUES (?)",
    [trimmedName]
  );

  return result.insertId;
}
