import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.ts";
import { authorize } from "../../middlewares/authorize.middleware.ts";
import { uploadMiddleware } from "../../middlewares/upload.middleware.ts";
import { uploadToCloudinary } from "../../utils/cloudinary.ts";

const router = Router();

router.post(
  "/thumbnail",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  uploadMiddleware.single("thumbnail"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Không có file được upload",
        });
      }

      const result = await uploadToCloudinary(
        req.file.path,
        "books/thumbnails"
      );

      res.status(200).json({
        success: true,
        data: {
          url: result.secure_url,
          public_id: result.public_id,
        },
        message: "Upload ảnh bìa thành công",
      });
    } catch (error) {
      console.error("Upload thumbnail error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi upload ảnh bìa",
      });
    }
  }
);

router.post(
  "/gallery",
  authMiddleware,
  authorize("ADMIN", "LIBRARIAN"),
  uploadMiddleware.array("gallery", 10),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Không có file được upload",
        });
      }

      const uploadPromises = files.map((file) =>
        uploadToCloudinary(file.path, "books/gallery")
      );

      const results = await Promise.all(uploadPromises);

      const images = results.map((result) => ({
        url: result.secure_url,
        public_id: result.public_id,
      }));

      res.status(200).json({
        success: true,
        data: images,
        message: `Upload ${images.length} ảnh thành công`,
      });
    } catch (error) {
      console.error("Upload gallery error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi upload ảnh gallery",
      });
    }
  }
);

export default router;
