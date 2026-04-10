// routes/upload.js
import express from "express";
import upload from "../middleware/upload.js";
import { protect } from "../middleware/auth.js";
import cloudinary from "../config/cloudinary.js"; // ⚠️ ADD THIS IMPORT

const router = express.Router();

// Single image upload (for thumbnails, avatars, etc.)
router.post("/image", protect, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log('✅ File uploaded to Cloudinary:', req.file.path);

    res.status(200).json({
      success: true,
      url: req.file.path,
      secure_url: req.file.path,
      imageUrl: req.file.path,
      public_id: req.file.filename
    });
  } catch (error) {
    console.error("❌ Image upload error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to upload image",
      error: error.message 
    });
  }
});

// Optional: Delete image from Cloudinary
router.delete("/image/:publicId", protect, async (req, res) => {
  try {
    const { publicId } = req.params;
    await cloudinary.uploader.destroy(publicId);
    res.status(200).json({ success: true, message: "Image deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete image" });
  }
});

export default router;