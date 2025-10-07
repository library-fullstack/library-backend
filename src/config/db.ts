import mysql, { type PoolOptions } from "mysql2/promise";
import { env } from "./env.ts";

// cấu hình pool connection
const access: PoolOptions = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
};

// tạo pool connection
const connection = mysql.createPool(access);

// check connection

async function testConnection() {
  try {
    const conn = await connection.getConnection();
    console.log("Kết nối cơ sở dữ liệu thành công");
    conn.release();
  } catch (err) {
    console.error("Kết nối cơ sở dữ liệu thất bại. Lỗi:\n", err);
    process.exit(1);
  }
}

testConnection();

export default connection;
