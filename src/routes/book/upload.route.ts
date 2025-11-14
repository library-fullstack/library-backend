import express from "express";
import multer from "multer";
import fs from "fs";
import cloudinary from "../../config/cloudinary.ts";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/image", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không có file nào được chọn." });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "library/books",
      resource_type: "image",
    });

    fs.unlinkSync(req.file.path);

    return res.status(200).json({
      message: "Upload ảnh thành công!",
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error: any) {
    console.error("[Upload Error]", error);
    return res.status(500).json({
      message: "Upload thất bại.",
      error: error.message,
    });
  }
});

export default router;
