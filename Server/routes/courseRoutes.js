import express from "express";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/upload-thumbnail", upload.single("image"), (req, res) => {
  try {
    res.status(200).json({
      imageUrl: req.file.path, // Cloudinary URL
    });
  } catch (error) {
    res.status(500).json({ message: "Upload failed" });
  }
});

export default router;