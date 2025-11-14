import { Router, Request, Response } from "express";
import { getCacheMetrics, resetCacheMetrics } from "../config/redis.ts";
import {
  getPerformanceMetrics,
  resetPerformanceMetrics,
} from "../middlewares/performance.middleware.ts";
import { getConnectionPoolMetrics } from "../config/db.ts";

const router = Router();

router.get("/performance", async (req: Request, res: Response) => {
  try {
    const metrics = getPerformanceMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Không thể lấy performance metrics",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get("/cache", (req: Request, res: Response) => {
  try {
    const metrics = getCacheMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Không thể lấy cache metrics",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get("/database", async (req: Request, res: Response) => {
  try {
    const metrics = await getConnectionPoolMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Không thể lấy database metrics",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get("/all", async (req: Request, res: Response) => {
  try {
    const performance = getPerformanceMetrics();
    const cache = getCacheMetrics();
    const database = await getConnectionPoolMetrics();

    res.json({
      success: true,
      data: {
        performance,
        cache,
        database,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Không thể lấy metrics",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.post("/reset", (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        message: "Không được phép reset metrics trong production",
      });
    }

    resetPerformanceMetrics();
    resetCacheMetrics();

    res.json({
      success: true,
      message: "Đã reset tất cả metrics",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Không thể reset metrics",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get("/health", async (req: Request, res: Response) => {
  try {
    const cache = getCacheMetrics();
    const database = await getConnectionPoolMetrics();

    const isHealthy = database !== null && database.utilizationPercent < 90;

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      status: isHealthy ? "healthy" : "degraded",
      data: {
        cache: {
          hitRate: cache.hitRate,
          totalRequests: cache.total,
        },
        database: database
          ? {
              activeConnections: database.activeConnections,
              utilizationPercent: database.utilizationPercent,
            }
          : null,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "unhealthy",
      message: "Health check failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
