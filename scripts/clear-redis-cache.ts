import redisClient, { cache } from "../src/config/redis.ts";

async function clearAllCache() {
  try {
    console.log("[CLEAR CACHE] Connecting to Redis...");

    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    console.log("[CLEAR CACHE] Connected! Clearing all cache...");

    await redisClient.flushDb();
    console.log(
      "[CLEAR CACHE] Successfully cleared all cache keys in current database"
    );

    // xóa specific patterns
    // await cache.delPattern("books:*");
    // await cache.delPattern("users:*");
    // await cache.delPattern("cart:*");
    // await cache.delPattern("admin:*");
    // await cache.delPattern("stats:*");
    // await cache.delPattern("banners:*");
    // await cache.delPattern("settings:*");

    console.log("[CLEAR CACHE] Disconnecting...");
    await redisClient.quit();
    console.log("[CLEAR CACHE] Done!");
    process.exit(0);
  } catch (error) {
    console.error("[CLEAR CACHE] Error:", error);
    process.exit(1);
  }
}

clearAllCache();
