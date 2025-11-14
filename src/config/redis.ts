import { createClient } from "redis";
import { env } from "./env.ts";

// Tạo Redis client
const redisClient = createClient({
  url: env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        console.error("[REDIS] Không thể kết nối Redis sau 10 lần thử");
        return new Error("[REDIS] Redis connection failed");
      }
      // Exponential backoff: 100ms, 200ms, 400ms, 800ms, ...
      return Math.min(retries * 100, 3000);
    },
  },
});

// Event handlers
redisClient.on("error", (err: Error) => {
  console.error("[REDIS] Redis Client Error:", err);
});

redisClient.on("connect", () => {
  console.log("[REDIS] Redis client đang kết nối...");
});

redisClient.on("ready", () => {
  console.log("[REDIS] Redis client sẵn sàng");
});

redisClient.on("reconnecting", () => {
  console.log("[REDIS] Redis client đang kết nối lại...");
});

// Kết nối Redis
async function connectRedis() {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("[REDIS] Không thể kết nối Redis:", err);
    console.log("[REDIS] Server sẽ chạy mà không có caching");
  }
}

connectRedis();

// Cache metrics
let cacheHits = 0;
let cacheMisses = 0;
let cacheErrors = 0;

/**
 * Lấy cache metrics
 */
export const getCacheMetrics = () => {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? ((cacheHits / total) * 100).toFixed(2) : "0.00";

  return {
    hits: cacheHits,
    misses: cacheMisses,
    errors: cacheErrors,
    total,
    hitRate: `${hitRate}%`,
  };
};

/**
 * Reset cache metrics
 */
export const resetCacheMetrics = () => {
  cacheHits = 0;
  cacheMisses = 0;
  cacheErrors = 0;
};

// Cache helper functions
export const cache = {
  /**
   * Lấy giá trị từ cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!redisClient.isOpen) return null;
    try {
      const data = await redisClient.get(key);
      if (data) {
        cacheHits++;
        return JSON.parse(data);
      } else {
        cacheMisses++;
        return null;
      }
    } catch (err) {
      console.error(`[REDIS] Cache get error for key ${key}:`, err);
      cacheErrors++;
      return null;
    }
  },

  /**
   * Lưu giá trị vào cache với TTL (time to live)
   * @param key - Cache key
   * @param value - Giá trị cần cache
   * @param ttl - Time to live (seconds), mặc định 5 phút
   */
  async set(key: string, value: any, ttl: number = 300): Promise<boolean> {
    if (!redisClient.isOpen) return false;
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`[REDIS] Cache set error for key ${key}:`, err);
      return false;
    }
  },

  /**
   * Xóa một hoặc nhiều keys khỏi cache
   */
  async del(...keys: string[]): Promise<boolean> {
    if (!redisClient.isOpen) return false;
    try {
      await redisClient.del(keys);
      return true;
    } catch (err) {
      console.error(
        `[REDIS] Cache delete error for keys ${keys.join(", ")}:`,
        err
      );
      return false;
    }
  },

  /**
   * Xóa tất cả keys matching pattern
   * @param pattern - Pattern để match (vd: "books:*")
   * Sử dụng SCAN thay vì KEYS để tránh block Redis trong production
   */
  async delPattern(pattern: string): Promise<boolean> {
    if (!redisClient.isOpen) return false;
    try {
      const keys: string[] = [];
      let cursor: string = "0";

      // Sử dụng SCAN thay vì KEYS (O(N) non-blocking)
      do {
        const result = await redisClient.scan(cursor, {
          MATCH: pattern,
          COUNT: 100, // Scan 100 keys mỗi lần
        });
        cursor = result.cursor;
        keys.push(...result.keys);
      } while (cursor !== "0");

      if (keys.length > 0) {
        // Xóa theo batch để tránh quá tải
        const batchSize = 100;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          await redisClient.del(batch);
        }
        console.log(`[REDIS] Deleted ${keys.length} keys matching ${pattern}`);
      }
      return true;
    } catch (err) {
      console.error(`[REDIS] Cache delete pattern error for ${pattern}:`, err);
      return false;
    }
  },

  /**
   * Check xem key có tồn tại không
   */
  async exists(key: string): Promise<boolean> {
    if (!redisClient.isOpen) return false;
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (err) {
      console.error(`[REDIS] Cache exists error for key ${key}:`, err);
      return false;
    }
  },

  /**
   * Tăng giá trị counter
   */
  async incr(key: string): Promise<number> {
    if (!redisClient.isOpen) return 0;
    try {
      return await redisClient.incr(key);
    } catch (err) {
      console.error(`[REDIS] Cache incr error for key ${key}:`, err);
      return 0;
    }
  },

  /**
   * Set expiration cho key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!redisClient.isOpen) return false;
    try {
      await redisClient.expire(key, seconds);
      return true;
    } catch (err) {
      console.error(`[REDIS] Cache expire error for key ${key}:`, err);
      return false;
    }
  },
};

export default redisClient;
