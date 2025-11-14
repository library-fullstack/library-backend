import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads/tmp");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`[Upload Middleware] Created upload directory: ${uploadDir}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(`[Upload Middleware] File destination: ${uploadDir}`);
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    console.log(`[Upload Middleware] Generated filename: ${uniqueName}`);
    cb(null, uniqueName);
  },
});

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
    console.log(`[Upload Middleware] File type accepted: ${file.mimetype}`);
    cb(null, true);
  } else {
    console.error(`[Upload Middleware] File type rejected: ${file.mimetype}`);
    cb(new Error("Chỉ chấp nhận file ảnh (JPEG, PNG, WEBP)"));
  }
};

const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export { uploadMiddleware };
