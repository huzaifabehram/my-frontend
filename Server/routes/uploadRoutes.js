// server/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { upload, cloudinary } = require('../config/cloudinary');
const { protect } = require('../middleware/authMiddleware');

// ═══════════════════════════════════════════════════════════════════════════
// @route   POST /api/upload/image
// @desc    Upload single image to Cloudinary
// @access  Private (Instructor only)
// ═══════════════════════════════════════════════════════════════════════════
router.post('/image', protect, upload.single('image'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select an image.',
      });
    }

    // Cloudinary automatically uploads and returns metadata
    const uploadedImage = {
      url: req.file.path, // Cloudinary URL
      public_id: req.file.filename, // Cloudinary public ID (for deletion)
      width: req.file.width || null,
      height: req.file.height || null,
      format: req.file.format || null,
      size: req.file.size || null,
    };

    console.log('✅ Image uploaded to Cloudinary:', uploadedImage.url);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully!',
      url: uploadedImage.url,
      imageUrl: uploadedImage.url, // Alternative key for frontend
      data: uploadedImage,
    });

  } catch (error) {
    console.error('❌ Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// @route   DELETE /api/upload/image/:publicId
// @desc    Delete image from Cloudinary (optional cleanup)
// @access  Private
// ═══════════════════════════════════════════════════════════════════════════
router.delete('/image/:publicId', protect, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      console.log('✅ Image deleted from Cloudinary:', publicId);
      return res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete image',
      });
    }
    
  } catch (error) {
    console.error('❌ Image deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message,
    });
  }
});

module.exports = router;