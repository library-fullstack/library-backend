import { Router } from "express";
import * as uploadController from "../controllers/upload.controller";
import { uploadMiddleware as upload } from "../middlewares/upload.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Upload image (ADMIN, LIBRARIAN only)
router.post(
  "/image",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  upload.single("image"),
  uploadController.uploadImage
);

export default router;
