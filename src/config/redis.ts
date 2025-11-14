import { createClient } from "redis";
import { env } from "./env.ts";

const redisClient = createClient({
  url: env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        console.error("[REDIS] Không thể kết nối Redis sau 10 lần thử");
        return new Error("[REDIS] Redis connection failed");
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

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

async function connectRedis() {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("[REDIS] Không thể kết nối Redis:", err);
    console.log("[REDIS] Server sẽ chạy mà không có caching");
  }
}

connectRedis();

let cacheHits = 0;
let cacheMisses = 0;
let cacheErrors = 0;

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

export const resetCacheMetrics = () => {
  cacheHits = 0;
  cacheMisses = 0;
  cacheErrors = 0;
};

export const cache = {
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

  async delPattern(pattern: string): Promise<boolean> {
    if (!redisClient.isOpen) return false;
    try {
      const keys: string[] = [];
      let cursor: string = "0";

      do {
        const result = await redisClient.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        });
        cursor = result.cursor;
        keys.push(...result.keys);
      } while (cursor !== "0");

      if (keys.length > 0) {
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

  async incr(key: string): Promise<number> {
    if (!redisClient.isOpen) return 0;
    try {
      return await redisClient.incr(key);
    } catch (err) {
      console.error(`[REDIS] Cache incr error for key ${key}:`, err);
      return 0;
    }
  },

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
