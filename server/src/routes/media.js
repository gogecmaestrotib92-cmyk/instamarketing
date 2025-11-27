const express = require('express');
const fs = require('fs');
const path = require('path');
const { auth } = require('../middleware/auth');
const upload = require('../services/upload');

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

module.exports = router;
