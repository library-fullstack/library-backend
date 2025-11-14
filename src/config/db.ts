import mysql, { type PoolOptions } from "mysql2/promise";
import { env } from "./env.ts";

const access: PoolOptions = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: env.NODE_ENV === "production" ? 20 : 10,
  maxIdle: env.NODE_ENV === "production" ? 10 : 5,
  idleTimeout: 30000,
  queueLimit: 0,
  timezone: "+07:00",
  charset: "utf8mb4_0900_ai_ci",
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 10000,
};

const connection = mysql.createPool(access);

let connectionMetrics = {
  totalConnections: 0,
  activeConnections: 0,
  idleConnections: 0,
  queuedRequests: 0,
  lastUpdated: new Date(),
};

export const getConnectionPoolMetrics = async () => {
  try {
    const poolState = (connection as any).pool;

    connectionMetrics = {
      totalConnections: poolState?._allConnections?.length || 0,
      activeConnections: poolState?._acquiringConnections?.length || 0,
      idleConnections: poolState?._freeConnections?.length || 0,
      queuedRequests: poolState?._connectionQueue?.length || 0,
      lastUpdated: new Date(),
    };

    return {
      ...connectionMetrics,
      maxConnections: access.connectionLimit || 10,
      maxIdle: access.maxIdle || 5,
      utilizationPercent: Math.round(
        (connectionMetrics.activeConnections / (access.connectionLimit || 10)) *
          100
      ),
    };
  } catch (err) {
    console.error("[MYSQL] Error getting pool metrics:", err);
    return null;
  }
};

setInterval(async () => {
  const metrics = await getConnectionPoolMetrics();
  if (metrics && env.NODE_ENV === "development") {
    console.log(
      `[MYSQL] Pool: ${metrics.activeConnections} active, ${metrics.idleConnections} idle, ${metrics.queuedRequests} queued (${metrics.utilizationPercent}% utilized)`
    );
  }
}, 60000);

async function testConnection(retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await connection.getConnection();
      console.log("[MYSQL] Kết nối cơ sở dữ liệu thành công");
      console.log(
        `[MYSQL] Connection pool: max=${access.connectionLimit}, maxIdle=${access.maxIdle}`
      );
      conn.release();
      return;
    } catch (err) {
      console.error(
        `[MYSQL] Lần thử ${i + 1}/${retries} - Kết nối cơ sở dữ liệu thất bại:`,
        err
      );

      if (i < retries - 1) {
        console.log(`Thử lại sau ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error(
          "[MYSQL] Không thể kết nối cơ sở dữ liệu sau nhiều lần thử"
        );
        process.exit(1);
      }
    }
  }
}

testConnection();

process.on("SIGINT", async () => {
  console.log("\n[MYSQL] Đang đóng database connection pool...");
  await connection.end();
  console.log("[MYSQL] Database connection pool đã đóng");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n[MYSQL] Đang đóng database connection pool...");
  await connection.end();
  console.log("[MYSQL] Database connection pool đã đóng");
  process.exit(0);
});

export default connection;
