import { Request, Response, NextFunction } from "express";
import { cache } from "../config/redis.ts";
import crypto from "crypto";

/**
 * Middleware để cache GET requests với ETag support
 * @param ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @param keyPrefix - Prefix cho cache key
 */
export const cacheMiddleware = (ttl: number = 300, keyPrefix: string = "") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Chỉ cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Tạo unique cache key từ URL và query params
    const urlKey = req.originalUrl || req.url;
    const hash = crypto.createHash("md5").update(urlKey).digest("hex");
    const cacheKey = keyPrefix ? `${keyPrefix}:${hash}` : `cache:${hash}`;
    const etagKey = `${cacheKey}:etag`;

    try {
      // Kiểm tra cache
      const cachedData = await cache.get(cacheKey);
      const cachedEtag = await cache.get<string>(etagKey);

      if (cachedData) {
        // Cache hit - generate ETag
        const currentEtag =
          cachedEtag || crypto.createHash("md5").update(JSON.stringify(cachedData)).digest("hex");

        // Check If-None-Match header for conditional request
        const clientEtag = req.headers["if-none-match"];
        if (clientEtag && clientEtag === currentEtag) {
          console.log(`[REDIS] Cache HIT + ETag Match: ${cacheKey} - 304 Not Modified`);
          return res.status(304).end();
        }

        // Send cached data with ETag
        console.log(`[REDIS] Cache HIT: ${cacheKey}`);
        res.setHeader("ETag", currentEtag);
        res.setHeader("Cache-Control", `public, max-age=${ttl}`);
        return res.status(200).json(cachedData);
      }

      // Cache miss - tiếp tục xử lý request
      console.log(`[REDIS] Cache MISS: ${cacheKey}`);

      // Override res.json để cache response
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        // Chỉ cache successful responses (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const etag = crypto
            .createHash("md5")
            .update(JSON.stringify(body))
            .digest("hex");

          // Set response headers
          res.setHeader("ETag", etag);
          res.setHeader("Cache-Control", `public, max-age=${ttl}`);

          // Save to cache (both data and etag)
          cache.set(cacheKey, body, ttl).catch((err) => {
            console.error(`[REDIS] Error caching response:`, err);
          });
          cache.set(etagKey, etag, ttl).catch((err) => {
            console.error(`[REDIS] Error caching etag:`, err);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error(`[REDIS] Cache middleware error:`, err);
      next();
    }
  };
};

/**
 * Middleware để invalidate cache khi có mutations
 * @param patterns - Array of cache key patterns to invalidate
 */
export const invalidateCacheMiddleware = (patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Override res.json để invalidate cache sau khi response
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Chỉ invalidate nếu là successful mutation (POST/PUT/PATCH/DELETE)
      if (
        ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
        res.statusCode >= 200 &&
        res.statusCode < 300
      ) {
        Promise.all(patterns.map((pattern) => cache.delPattern(pattern)))
          .then(() => {
            console.log(
              `🗑️ Cache invalidated for patterns: ${patterns.join(", ")}`
            );
          })
          .catch((err) => {
            console.error("Error invalidating cache:", err);
          });
      }
      return originalJson(body);
    };

    next();
  };
};
