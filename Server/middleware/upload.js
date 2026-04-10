import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "courses",
    
    // 🔥 AUTO OPTIMIZATION
    transformation: [
      {
        width: 800,              // resize
        crop: "limit",
        quality: "auto",         // 🔥 auto compression
        fetch_format: "auto"     // 🔥 auto format (webp/avif)
      }
    ]
  }
});

const upload = multer({ storage });

export default upload;