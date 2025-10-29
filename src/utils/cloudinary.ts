import cloudinary from "../config/cloudinary.ts";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import fs from "fs";

const uploadToCloudinary = async (
  filePath: string,
  folder = "avatar"
): Promise<UploadApiResponse | UploadApiErrorResponse> => {
  try {
    console.log(`[Cloudinary] Starting upload for file: ${filePath}`);
    console.log(`[Cloudinary] Target folder: ${folder}`);

    // Kiểm tra xem file có tồn tại không
    if (!fs.existsSync(filePath)) {
      throw new Error(`File không tồn tại: ${filePath}`);
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "image",
    });

    console.log(`[Cloudinary] Upload successful:`, {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
    });

    // xoá file tạm sau khi update thành công
    fs.unlinkSync(filePath);
    console.log(`[Cloudinary] Temporary file deleted: ${filePath}`);

    return result;
  } catch (err) {
    console.error("[uploadToCloudinary] Error:", err);

    // Cleanup file nếu upload thất bại
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(
          `[Cloudinary] Temporary file deleted after error: ${filePath}`
        );
      }
    } catch (cleanupErr) {
      console.error("[uploadToCloudinary] Cleanup error:", cleanupErr);
    }

    throw err;
  }
};

// xoá avatar với publicId
const deleteFromCloudinary = async (
  publicId: string
): Promise<UploadApiResponse | UploadApiErrorResponse> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (err) {
    console.error("[deleteFromCloudinary]", err);
    throw err;
  }
};

export { uploadToCloudinary, deleteFromCloudinary };
