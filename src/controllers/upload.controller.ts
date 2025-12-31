import { Request, Response } from "express";
import { uploadToCloudinary } from "../utils/cloudinary";

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const folder = (req.body.folder as string) || "general";
    const result = await uploadToCloudinary(req.file.path, folder);

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
      },
    });
  } catch (error: any) {
    console.error("[uploadImage]", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload image",
    });
  }
};
