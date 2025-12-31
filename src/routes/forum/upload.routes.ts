import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authMiddleware } from "../../middlewares/auth.middleware";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";

const router = Router();

const uploadDir = "uploads/forum/temp";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req: AuthenticatedRequest, file, cb) => {
    const userDir = path.join(uploadDir, req.userId || "anonymous");
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post(
  "/",
  authMiddleware,
  upload.single("file"),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No file provided",
        });
        return;
      }

      let fileUrl: string;
      const isImage = req.file.mimetype.startsWith("image/");

      if (isImage) {
        const cloudinary = (await import("../../config/cloudinary")).default;
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "forum/attachments",
          resource_type: "image",
        });
        fileUrl = result.secure_url;

        fs.unlinkSync(req.file.path);
      } else {
        fileUrl = `/uploads/forum/temp/${req.userId}/${req.file.filename}`;
      }

      const fileSize = req.file.size;
      const mimeType = req.file.mimetype;

      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          url: fileUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: fileSize,
          mimeType: mimeType,
          uploadedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload file",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

router.delete(
  "/:filename",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { filename } = req.params;
      const userId = req.userId;

      if (!/^[\w\-\.]+$/.test(filename)) {
        res.status(400).json({
          success: false,
          message: "Invalid filename",
        });
        return;
      }

      const userTempDir = path.join(uploadDir, userId || "anonymous");
      const filePath = path.join(userTempDir, filename);

      if (!filePath.startsWith(path.resolve(userTempDir))) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        });
        return;
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.status(200).json({
          success: true,
          message: "File deleted successfully",
        });
      } else {
        res.status(404).json({
          success: false,
          message: "File not found",
        });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete file",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
