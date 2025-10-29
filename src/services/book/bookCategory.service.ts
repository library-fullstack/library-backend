import connection from "../../config/db.ts";
import { bookCategoryModel } from "../../models/index.ts";

const getAllCategories = async () => {
  const [rows] = await connection.query<[bookCategoryModel.BookCategory]>(`
    SELECT c.*, COUNT(b.id) AS book_count
    FROM book_categories c
    LEFT JOIN books b ON b.category_id = c.id
    GROUP BY c.id
    ORDER BY c.parent_id, c.name
  `);
  return rows;
};

const createCategory = async (name: string, parentId?: number | null) => {
  await connection.query(
    `INSERT INTO book_categories (name, parent_id) VALUES (?, ?)`,
    [name, parentId ?? null]
  );
};

const updateCategory = async (
  id: number,
  name: string,
  parentId?: number | null
) => {
  await connection.query(
    `UPDATE book_categories SET name=?, parent_id=? WHERE id=?`,
    [name, parentId ?? null, id]
  );
};

const deleteCategory = async (id: number) => {
  await connection.query(`DELETE FROM book_categories WHERE id=?`, [id]);
};

export { getAllCategories, createCategory, updateCategory, deleteCategory };
