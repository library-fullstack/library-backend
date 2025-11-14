import { Request, Response, NextFunction } from "express";

export const secureCacheMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  next();
};

export const shortCacheMiddleware = (ttl: number = 300) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.setHeader("Cache-Control", `private, max-age=${ttl}`);
    next();
  };
};

export default secureCacheMiddleware;
