import { Router } from "express";
import BookFavouriteController from "../controllers/bookFavourite.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { invalidateCacheMiddleware } from "../middlewares/cache.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", BookFavouriteController.getFavourites);
router.get("/count", BookFavouriteController.getFavouriteCount);
router.get("/check/:bookId", BookFavouriteController.checkFavourite);
router.post(
  "/add",
  invalidateCacheMiddleware(["favourites:*"]),
  BookFavouriteController.addFavourite
);
router.delete(
  "/remove",
  invalidateCacheMiddleware(["favourites:*"]),
  BookFavouriteController.removeFavourite
);

export default router;
