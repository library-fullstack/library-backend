import { Request, Response, NextFunction } from "express";

interface PerformanceMetrics {
  totalRequests: number;
  totalDuration: number;
  slowQueries: Array<{
    method: string;
    path: string;
    duration: number;
    timestamp: Date;
  }>;
  requestsByEndpoint: Map<string, { count: number; totalDuration: number }>;
}

const metrics: PerformanceMetrics = {
  totalRequests: 0,
  totalDuration: 0,
  slowQueries: [],
  requestsByEndpoint: new Map(),
};

const SLOW_QUERY_THRESHOLD = 1000; // 1 giây
const MAX_SLOW_QUERIES_LOG = 100; // Giữ tối đa 100 slow queries

/**
 * Middleware theo dõi performance của API endpoints
 */
export const performanceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Hook vào response finish event
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const endpoint = `${req.method} ${req.route?.path || req.path}`;

    // Update metrics
    metrics.totalRequests++;
    metrics.totalDuration += duration;

    // Track per-endpoint metrics
    const endpointMetrics = metrics.requestsByEndpoint.get(endpoint);
    if (endpointMetrics) {
      endpointMetrics.count++;
      endpointMetrics.totalDuration += duration;
    } else {
      metrics.requestsByEndpoint.set(endpoint, {
        count: 1,
        totalDuration: duration,
      });
    }

    // Log slow queries
    if (duration > SLOW_QUERY_THRESHOLD) {
      console.warn(
        `[PERFORMANCE] Slow request: ${endpoint} took ${duration}ms`
      );

      // Keep track of slow queries (FIFO)
      if (metrics.slowQueries.length >= MAX_SLOW_QUERIES_LOG) {
        metrics.slowQueries.shift();
      }

      metrics.slowQueries.push({
        method: req.method,
        path: req.path,
        duration,
        timestamp: new Date(),
      });
    }

    // Log all requests in development
    if (process.env.NODE_ENV === "development") {
      const statusColor =
        res.statusCode >= 500
          ? "\x1b[31m" // Red
          : res.statusCode >= 400
            ? "\x1b[33m" // Yellow
            : "\x1b[32m"; // Green
      console.log(
        `[PERFORMANCE] ${statusColor}${res.statusCode}\x1b[0m ${endpoint} - ${duration}ms`
      );
    }
  });

  next();
};

/**
 * Lấy performance metrics
 */
export const getPerformanceMetrics = () => {
  const avgDuration =
    metrics.totalRequests > 0
      ? Math.round(metrics.totalDuration / metrics.totalRequests)
      : 0;

  // Tính top slow endpoints
  const endpointStats = Array.from(metrics.requestsByEndpoint.entries())
    .map(([endpoint, stats]) => ({
      endpoint,
      count: stats.count,
      avgDuration: Math.round(stats.totalDuration / stats.count),
      totalDuration: stats.totalDuration,
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 10);

  return {
    summary: {
      totalRequests: metrics.totalRequests,
      avgDuration,
      totalDuration: metrics.totalDuration,
    },
    slowQueries: metrics.slowQueries.slice(-10), // Last 10 slow queries
    topSlowEndpoints: endpointStats,
  };
};

/**
 * Reset metrics (hữu ích cho testing)
 */
export const resetPerformanceMetrics = () => {
  metrics.totalRequests = 0;
  metrics.totalDuration = 0;
  metrics.slowQueries = [];
  metrics.requestsByEndpoint.clear();
};
