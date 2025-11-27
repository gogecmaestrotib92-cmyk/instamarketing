const express = require('express');
const Reel = require('../models/Reel');
const ScheduledItem = require('../models/ScheduledItem');
const { auth } = require('../middleware/auth');
const { publishReel } = require('../services/instagram');
const upload = require('../services/upload');

const router = express.Router();

// Get all reels for user
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { user: req.userId };
    if (status) query.status = status;

    const reels = await Reel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Reel.countDocuments(query);

    res.json({
      reels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get reels error:', error);
    res.status(500).json({ error: 'Failed to fetch reels' });
  }
});

// Get single reel
router.get('/:id', auth, async (req, res) => {
  try {
    const reel = await Reel.findOne({ _id: req.params.id, user: req.userId });
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    res.json({ reel });
  } catch (error) {
    console.error('Get reel error:', error);
    res.status(500).json({ error: 'Failed to fetch reel' });
  }
});

// Create new reel
router.post('/', auth, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { caption, hashtags, scheduledFor } = req.body;

    // Process video file
    const videoFile = req.files?.video?.[0];
    if (!videoFile) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    const video = {
      localPath: videoFile.path,
      url: `/uploads/${videoFile.filename}`
    };

    // Process cover image if provided
    let coverImage;
    const coverFile = req.files?.coverImage?.[0];
    if (coverFile) {
      coverImage = {
        localPath: coverFile.path,
        url: `/uploads/${coverFile.filename}`
      };
    }

    const reel = new Reel({
      user: req.userId,
      caption,
      hashtags: hashtags ? JSON.parse(hashtags) : [],
      video,
      coverImage,
      status: 'draft'
    });

    // If scheduled
    if (scheduledFor) {
      reel.scheduledFor = new Date(scheduledFor);
      reel.isScheduled = true;
      reel.status = 'scheduled';

      // Create scheduled item
      const scheduledItem = new ScheduledItem({
        user: req.userId,
        contentType: 'reel',
        contentId: reel._id,
        scheduledFor: reel.scheduledFor
      });
      await scheduledItem.save();
    }

    await reel.save();

    res.status(201).json({ 
      message: 'Reel created successfully',
      reel 
    });
  } catch (error) {
    console.error('Create reel error:', error);
    res.status(500).json({ error: 'Failed to create reel' });
  }
});

// Update reel
router.put('/:id', auth, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const reel = await Reel.findOne({ _id: req.params.id, user: req.userId });
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    if (!['draft', 'scheduled'].includes(reel.status)) {
      return res.status(400).json({ error: 'Cannot edit published or processing reel' });
    }

    const { caption, hashtags, scheduledFor } = req.body;

    if (caption !== undefined) reel.caption = caption;
    if (hashtags) reel.hashtags = JSON.parse(hashtags);

    // Handle new video
    const videoFile = req.files?.video?.[0];
    if (videoFile) {
      reel.video = {
        localPath: videoFile.path,
        url: `/uploads/${videoFile.filename}`
      };
    }

    // Handle new cover image
    const coverFile = req.files?.coverImage?.[0];
    if (coverFile) {
      reel.coverImage = {
        localPath: coverFile.path,
        url: `/uploads/${coverFile.filename}`
      };
    }

    // Handle schedule changes
    if (scheduledFor) {
      reel.scheduledFor = new Date(scheduledFor);
      reel.isScheduled = true;
      reel.status = 'scheduled';

      await ScheduledItem.findOneAndUpdate(
        { contentType: 'reel', contentId: reel._id },
        { scheduledFor: reel.scheduledFor, status: 'pending' },
        { upsert: true }
      );
    }

    await reel.save();

    res.json({ 
      message: 'Reel updated successfully',
      reel 
    });
  } catch (error) {
    console.error('Update reel error:', error);
    res.status(500).json({ error: 'Failed to update reel' });
  }
});

// Publish reel immediately
router.post('/:id/publish', auth, async (req, res) => {
  try {
    const reel = await Reel.findOne({ _id: req.params.id, user: req.userId });
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    if (reel.status === 'published') {
      return res.status(400).json({ error: 'Reel is already published' });
    }

    if (!req.user.instagram?.connected) {
      return res.status(400).json({ error: 'Please connect your Instagram account first' });
    }

    reel.status = 'publishing';
    await reel.save();

    // Publish to Instagram
    const result = await publishReel(reel, req.user);

    if (result.success) {
      reel.status = 'published';
      reel.instagramReelId = result.reelId;
      reel.instagramPermalink = result.permalink;
      reel.publishedAt = new Date();
    } else {
      reel.status = 'failed';
      reel.errorMessage = result.error;
    }

    await reel.save();

    res.json({ 
      message: result.success ? 'Reel published successfully' : 'Failed to publish reel',
      reel,
      success: result.success
    });
  } catch (error) {
    console.error('Publish reel error:', error);
    res.status(500).json({ error: 'Failed to publish reel' });
  }
});

// Delete reel
router.delete('/:id', auth, async (req, res) => {
  try {
    const reel = await Reel.findOneAndDelete({ _id: req.params.id, user: req.userId });
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    await ScheduledItem.deleteOne({ contentType: 'reel', contentId: reel._id });

    res.json({ message: 'Reel deleted successfully' });
  } catch (error) {
    console.error('Delete reel error:', error);
    res.status(500).json({ error: 'Failed to delete reel' });
  }
});

module.exports = router;
