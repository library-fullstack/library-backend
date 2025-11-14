import { Router } from "express";
import BorrowCartController from "../controllers/borrowCart.controller.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../middlewares/cache.middleware.ts";

const router = Router();

router.use(authMiddleware);

// REMOVED CACHE: Cache key "cart:user" was same for ALL users, causing wrong cart data
router.get("/", BorrowCartController.getCart);
router.get("/summary", BorrowCartController.getCartSummary);
router.post(
  "/add",
  invalidateCacheMiddleware(["cart:*"]),
  BorrowCartController.addItem
);
router.patch(
  "/update",
  invalidateCacheMiddleware(["cart:*"]),
  BorrowCartController.updateQuantity
);
router.delete(
  "/remove",
  invalidateCacheMiddleware(["cart:*"]),
  BorrowCartController.removeItem
);
router.delete(
  "/clear",
  invalidateCacheMiddleware(["cart:*"]),
  BorrowCartController.clearCart
);

export default router;
