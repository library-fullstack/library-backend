/**
 * Secure Cache Middleware
 * Prevents caching of sensitive endpoints (auth, payments, personal data)
 *
 * Usage:
 * router.post('/login', secureCacheMiddleware, loginController);
 * router.post('/auth/register', secureCacheMiddleware, registerController);
 */

import { Request, Response, NextFunction } from "express";

/**
 * Middleware to prevent caching of sensitive responses
 * Sets appropriate Cache-Control headers for security
 */
export const secureCacheMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Set security headers for no-cache
  // no-store: removes response from browser cache completely
  // no-cache: requires revalidation on every access
  // private: not shared between users
  // must-revalidate: cannot serve stale content
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  next();
};

/**
 * Middleware to set short cache for semi-sensitive data
 * User profile can be cached briefly (5 minutes)
 */
export const shortCacheMiddleware = (ttl: number = 300) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.setHeader("Cache-Control", `private, max-age=${ttl}`);
    next();
  };
};

export default secureCacheMiddleware;
