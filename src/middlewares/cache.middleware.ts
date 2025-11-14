import { Request, Response, NextFunction } from "express";
import { cache } from "../config/redis.ts";
import crypto from "crypto";

export const cacheMiddleware = (ttl: number = 300, keyPrefix: string = "") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }

    const urlKey = req.originalUrl || req.url;
    const hash = crypto.createHash("md5").update(urlKey).digest("hex");
    const cacheKey = keyPrefix ? `${keyPrefix}:${hash}` : `cache:${hash}`;
    const etagKey = `${cacheKey}:etag`;

    try {
      const cachedData = await cache.get(cacheKey);
      const cachedEtag = await cache.get<string>(etagKey);

      if (cachedData) {
        const currentEtag =
          cachedEtag ||
          crypto
            .createHash("md5")
            .update(JSON.stringify(cachedData))
            .digest("hex");

        const clientEtag = req.headers["if-none-match"];
        if (clientEtag && clientEtag === currentEtag) {
          console.log(
            `[REDIS] Cache HIT + ETag Match: ${cacheKey} - 304 Not Modified`
          );
          return res.status(304).end();
        }

        console.log(`[REDIS] Cache HIT: ${cacheKey}`);
        res.setHeader("ETag", currentEtag);
        res.setHeader("Cache-Control", `public, max-age=${ttl}`);
        return res.status(200).json(cachedData);
      }

      console.log(`[REDIS] Cache MISS: ${cacheKey}`);

      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const etag = crypto
            .createHash("md5")
            .update(JSON.stringify(body))
            .digest("hex");

          res.setHeader("ETag", etag);
          res.setHeader("Cache-Control", `public, max-age=${ttl}`);

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

export const invalidateCacheMiddleware = (patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (
        ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
        res.statusCode >= 200 &&
        res.statusCode < 300
      ) {
        Promise.all(patterns.map((pattern) => cache.delPattern(pattern)))
          .then(() => {
            console.log(
              `Cache invalidated for patterns: ${patterns.join(", ")}`
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
