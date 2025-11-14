import mysql, { type PoolOptions } from "mysql2/promise";
import { env } from "./env.ts";

// Cấu hình pool connection được tối ưu cho production
const access: PoolOptions = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  waitForConnections: true,
  // Tăng connection limit cho production
  connectionLimit: env.NODE_ENV === "production" ? 20 : 10,
  // Số lượng connections nhàn rỗi tối đa
  maxIdle: env.NODE_ENV === "production" ? 10 : 5,
  // Thời gian connection có thể nhàn rỗi trước khi bị đóng (30s)
  idleTimeout: 30000,
  // Không giới hạn queue (0 = unlimited)
  queueLimit: 0,
  // Timezone cho database
  timezone: "+07:00",
  // Charset UTF8MB4 hỗ trợ emoji và ký tự đặc biệt
  charset: "utf8mb4_0900_ai_ci",
  // Enable keep-alive để giữ connection sống
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // 10s
  // Connection timeout
  connectTimeout: 10000, // 10s
  // Query timeout
  // aquireTimeout: 10000, // 10s
};

// Tạo pool connection
const connection = mysql.createPool(access);

// Connection pool monitoring metrics
let connectionMetrics = {
  totalConnections: 0,
  activeConnections: 0,
  idleConnections: 0,
  queuedRequests: 0,
  lastUpdated: new Date(),
};

/**
 * Lấy connection pool metrics
 */
export const getConnectionPoolMetrics = async () => {
  try {
    // Get pool state from mysql2 internal
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
        (connectionMetrics.activeConnections /
          (access.connectionLimit || 10)) *
          100
      ),
    };
  } catch (err) {
    console.error("[MYSQL] Error getting pool metrics:", err);
    return null;
  }
};

/**
 * Log connection pool metrics every minute
 */
setInterval(async () => {
  const metrics = await getConnectionPoolMetrics();
  if (metrics && env.NODE_ENV === "development") {
    console.log(
      `[MYSQL] Pool: ${metrics.activeConnections} active, ${metrics.idleConnections} idle, ${metrics.queuedRequests} queued (${metrics.utilizationPercent}% utilized)`
    );
  }
}, 60000); // Log every 60 seconds

// Health check và retry logic
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

// Graceful shutdown - đóng pool khi app shutdown
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
