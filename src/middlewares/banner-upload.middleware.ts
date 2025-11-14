import { Request, Response, NextFunction } from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.ts";

const storage = multer.memoryStorage();

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    console.log(`[Banner Upload] File type accepted: ${file.mimetype}`);
    cb(null, true);
  } else {
    console.error(`[Banner Upload] File type rejected: ${file.mimetype}`);
    cb(new Error("Chỉ chấp nhận file ảnh (JPEG, PNG, WEBP)"));
  }
};

const uploadBannerMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const uploadBannerToCloudinary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
      return;
    }

    console.log(`[Banner Upload] Uploading to Cloudinary...`);

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "library/banners",
          resource_type: "auto",
          format: "webp", // Convert to WebP
          quality: "auto",
          fetch_format: "auto",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(req.file!.buffer);
    });

    const uploadedResult = result as any;

    (req as any).cloudinaryUpload = {
      url: uploadedResult.secure_url,
      public_id: uploadedResult.public_id,
    };

    console.log(`[Banner Upload] Success: ${uploadedResult.public_id}`);
    next();
  } catch (error: any) {
    console.error("[Banner Upload] Error:", error.message);
    res.status(500).json({
      success: false,
      message: `Failed to upload image: ${error.message}`,
    });
  }
};

export { uploadBannerMiddleware, uploadBannerToCloudinary };
