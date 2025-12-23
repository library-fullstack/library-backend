import { Router } from "express";
import * as uploadController from "../controllers/upload.controller.ts";
import { uploadMiddleware as upload } from "../middlewares/upload.middleware.ts";
import { authorize } from "../middlewares/authorize.middleware.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";

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
