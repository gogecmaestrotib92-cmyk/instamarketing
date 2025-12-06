const express = require('express');
const fs = require('fs');
const path = require('path');
const { auth } = require('../middleware/auth');
const upload = require('../services/upload');
const multer = require('multer');

// Cloudinary for cloud uploads
let cloudinaryService = null;
try {
  cloudinaryService = require('../services/cloudinary');
  console.log('✅ Cloudinary loaded for media routes');
} catch (e) {
  console.log('Cloudinary not available for media routes:', e.message);
}

// Memory storage for Cloudinary uploads
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

// Upload media files
router.post('/upload', auth, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/${file.filename}`,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      type: file.mimetype.startsWith('video') ? 'video' : 'image'
    }));

    res.json({
      message: 'Files uploaded successfully',
      files
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Get user's media library
router.get('/', auth, async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '../../uploads', req.userId.toString());
    
    if (!fs.existsSync(uploadDir)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(uploadDir).map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      const ext = path.extname(filename).toLowerCase();
      const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(ext);
      
      return {
        filename,
        url: `/uploads/${req.userId}/${filename}`,
        size: stats.size,
        type: isVideo ? 'video' : 'image',
        createdAt: stats.birthtime
      };
    });

    // Sort by date, newest first
    files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ files });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ error: 'Failed to fetch media library' });
  }
});

// Delete media file
router.delete('/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Try user-specific directory first
    let filePath = path.join(__dirname, '../../uploads', req.userId.toString(), filename);
    
    if (!fs.existsSync(filePath)) {
      // Try general uploads directory
      filePath = path.join(__dirname, '../../uploads', filename);
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    fs.unlinkSync(filePath);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

/**
 * Upload image to Cloudinary
 * POST /api/upload/image
 * Used by BusinessHub for brand image uploads
 */
router.post('/upload/image', memoryUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    if (!cloudinaryService) {
      return res.status(503).json({ success: false, error: 'Cloudinary not configured' });
    }

    // Get folder from request or use default
    const folder = req.body.folder || 'brand-images';

    console.log(`📤 Uploading image to Cloudinary: ${req.file.originalname} (${req.file.size} bytes)`);

    const result = await cloudinaryService.uploadBufferToCloudinary(req.file.buffer, {
      folder: `instamarketing/${folder}`,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    console.log(`✅ Image uploaded: ${result.url}`);

    res.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
