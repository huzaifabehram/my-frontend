// server/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// ═══════════════════════════════════════════════════════════════════════════
// CLOUDINARY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE CONFIGURATION - Where & How Images Are Stored
// ═══════════════════════════════════════════════════════════════════════════
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'udemy-clone', // Cloudinary folder name
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'], // Allowed file types
    transformation: [
      {
        width: 1280,
        height: 720,
        crop: 'limit', // Resize if larger, maintain aspect ratio
        quality: 'auto:good', // Auto optimize quality
      }
    ],
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// MULTER CONFIGURATION - File Upload Middleware
// ═══════════════════════════════════════════════════════════════════════════
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Max 5MB per file
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════
module.exports = {
  cloudinary,
  upload,
};