import connection from "../../config/db.ts";
import { bookPublisherModel } from "../../models/index.ts";

const getAllPublishers = async () => {
  const [rows] = await connection.query<bookPublisherModel.BookPublisher[]>(`
    SELECT p.*, COUNT(b.id) AS book_count
    FROM publishers p
    LEFT JOIN books b ON b.publisher_id = p.id
    GROUP BY p.id
    ORDER BY p.name
  `);
  return rows;
};

const createPublisher = async (data: bookPublisherModel.BookPublisher) => {
  await connection.query(
    `INSERT INTO publishers (name, city, country) VALUES (?, ?, ?)`,
    [data.name, data.city ?? null, data.country ?? null]
  );
};

const updatePublisher = async (
  id: number,
  data: bookPublisherModel.BookPublisher
) => {
  await connection.query(
    `UPDATE publishers SET name=?, city=?, country=? WHERE id=?`,
    [data.name, data.city ?? null, data.country ?? null, id]
  );
};

const deletePublisher = async (id: number) => {
  await connection.query(`DELETE FROM publishers WHERE id=?`, [id]);
};

export { getAllPublishers, createPublisher, updatePublisher, deletePublisher };
