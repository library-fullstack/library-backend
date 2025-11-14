import { Request, Response, NextFunction } from "express";
import { cache } from "../config/redis.ts";

interface RateLimitOptions {
  windowMs: number; // Thời gian window (milliseconds)
  max: number; // Số requests tối đa trong window
  message?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * Simple rate limiter using Redis
 * Fallback to in-memory if Redis is not available
 */
export const rateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = "Quá nhiều yêu cầu, vui lòng thử lại sau",
    keyGenerator = (req) => req.ip || req.socket.remoteAddress || "unknown",
  } = options;

  // In-memory fallback
  const memoryStore = new Map<string, { count: number; resetTime: number }>();

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `ratelimit:${keyGenerator(req)}`;

    try {
      // Try Redis first
      const current = await cache.incr(key);

      if (current === 1) {
        // First request in window
        await cache.expire(key, Math.ceil(windowMs / 1000));
      }

      if (current > max) {
        res.status(429).json({
          message,
          retryAfter: Math.ceil(windowMs / 1000),
        });
        return;
      }

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - current));

      next();
    } catch (err) {
      // Fallback to in-memory
      const now = Date.now();
      const record = memoryStore.get(key);

      if (!record || now > record.resetTime) {
        // New window
        memoryStore.set(key, { count: 1, resetTime: now + windowMs });
        res.setHeader("X-RateLimit-Limit", max);
        res.setHeader("X-RateLimit-Remaining", max - 1);
        return next();
      }

      record.count++;

      if (record.count > max) {
        res.status(429).json({
          message,
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        });
        return;
      }

      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - record.count));

      next();
    }
  };
};

// Preset rate limiters
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút",
});

export const standardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Tăng từ 500 lên 5000 (~333 requests/phút)
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Chỉ 5 login attempts trong 15 phút
  message: "Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút",
  keyGenerator: (req) => `auth:${req.ip || "unknown"}`,
});
