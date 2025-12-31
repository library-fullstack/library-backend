import { Router } from "express";
import BorrowCartController from "../controllers/borrowCart.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "../middlewares/cache.middleware";

const router = Router();

router.use(authMiddleware);

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
