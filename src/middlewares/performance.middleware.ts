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

const SLOW_QUERY_THRESHOLD = 1000;
const MAX_SLOW_QUERIES_LOG = 100;

export const performanceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const endpoint = `${req.method} ${req.route?.path || req.path}`;

    metrics.totalRequests++;
    metrics.totalDuration += duration;

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

    if (duration > SLOW_QUERY_THRESHOLD) {
      console.warn(
        `[PERFORMANCE] Slow request: ${endpoint} took ${duration}ms`
      );

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

    if (process.env.NODE_ENV === "development") {
      const statusColor =
        res.statusCode >= 500
          ? "\x1b[31m"
          : res.statusCode >= 400
            ? "\x1b[33m"
            : "\x1b[32m";
      console.log(
        `[PERFORMANCE] ${statusColor}${res.statusCode}\x1b[0m ${endpoint} - ${duration}ms`
      );
    }
  });

  next();
};

export const getPerformanceMetrics = () => {
  const avgDuration =
    metrics.totalRequests > 0
      ? Math.round(metrics.totalDuration / metrics.totalRequests)
      : 0;

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
    slowQueries: metrics.slowQueries.slice(-10),
    topSlowEndpoints: endpointStats,
  };
};

export const resetPerformanceMetrics = () => {
  metrics.totalRequests = 0;
  metrics.totalDuration = 0;
  metrics.slowQueries = [];
  metrics.requestsByEndpoint.clear();
};
