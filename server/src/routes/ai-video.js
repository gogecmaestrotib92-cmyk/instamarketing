const express = require('express');
const { auth } = require('../middleware/auth');
const replicateService = require('../services/replicate');
const { uploadToCloudinary } = require('../services/cloudinary');
const upload = require('../services/upload');
const GeneratedVideo = require('../models/GeneratedVideo');

const router = express.Router();

/**
 * Generate video from text prompt
 * POST /api/ai-video/text-to-video
 */
router.post('/text-to-video', auth, async (req, res) => {
  try {
    // Default to premium (Minimax) for better quality and length (6s vs 2s)
    const { prompt, duration = 4, aspectRatio = '9:16', quality = 'premium' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(500).json({ error: 'Replicate API not configured' });
    }

    // Set dimensions based on aspect ratio
    let width, height;
    if (aspectRatio === '9:16') {
      width = 576; height = 1024;  // Portrait for Reels
    } else if (aspectRatio === '16:9') {
      width = 1024; height = 576;  // Landscape
    } else {
      width = 768; height = 768;   // Square
    }

    // Start generation
    let result;
    if (quality === 'premium') {
      result = await replicateService.textToVideoPremium(prompt);
    } else {
      result = await replicateService.textToVideo(prompt, {
        duration: parseInt(duration),
        width,
        height
      });
    }

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Save to database
    const video = new GeneratedVideo({
      user: req.userId,
      type: 'text-to-video',
      prompt,
      videoUrl: result.videoUrl,
      duration: parseInt(duration),
      aspectRatio,
      status: 'completed'
    });
    await video.save();

    res.json({
      success: true,
      message: 'Video generated successfully!',
      video: {
        id: video._id,
        videoUrl: result.videoUrl,
        prompt,
        duration,
        aspectRatio
      }
    });

  } catch (error) {
    console.error('Text-to-video error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate video' });
  }
});

/**
 * Generate video from image (animate image)
 * POST /api/ai-video/image-to-video
 */
router.post('/image-to-video', auth, upload.single('image'), async (req, res) => {
  try {
    const { prompt, duration = 4, aspectRatio = '9:16', imageUrl } = req.body;

    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(500).json({ error: 'Replicate API not configured' });
    }

    let sourceImageUrl = imageUrl;

    // If file uploaded, upload to Cloudinary first
    if (req.file) {
      const cloudinaryResult = await uploadToCloudinary(req.file.path, {
        folder: 'instamarketing/ai-video-sources',
        resource_type: 'image'
      });

      if (!cloudinaryResult.success) {
        return res.status(500).json({ error: 'Failed to upload image' });
      }

      sourceImageUrl = cloudinaryResult.url;
    }

    if (!sourceImageUrl) {
      return res.status(400).json({ error: 'Image is required (upload file or provide imageUrl)' });
    }

    // Start generation
    const result = await replicateService.imageToVideo(sourceImageUrl, prompt, {
      duration: parseInt(duration)
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Save to database
    const video = new GeneratedVideo({
      user: req.userId,
      type: 'image-to-video',
      prompt: prompt || 'Animated from image',
      sourceImageUrl,
      videoUrl: result.videoUrl,
      duration: parseInt(duration),
      aspectRatio,
      status: 'completed'
    });
    await video.save();

    res.json({
      success: true,
      message: 'Video generated successfully!',
      video: {
        id: video._id,
        videoUrl: result.videoUrl,
        sourceImageUrl,
        prompt,
        duration,
        aspectRatio
      }
    });

  } catch (error) {
    console.error('Image-to-video error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate video' });
  }
});

/**
 * Get user's generated videos
 * GET /api/ai-video/my-videos
 */
router.get('/my-videos', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const videos = await GeneratedVideo.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await GeneratedVideo.countDocuments({ user: req.userId });

    res.json({
      videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

/**
 * Get single video
 * GET /api/ai-video/:id
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const video = await GeneratedVideo.findOne({ 
      _id: req.params.id, 
      user: req.userId 
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ video });

  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

/**
 * Delete generated video
 * DELETE /api/ai-video/:id
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const video = await GeneratedVideo.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.userId 
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ message: 'Video deleted successfully' });

  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

/**
 * Get available AI models
 * GET /api/ai-video/models
 */
router.get('/info/models', auth, async (req, res) => {
  try {
    const models = await runwayService.getModels();
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

/**
 * Post generated video to Instagram as Reel
 * POST /api/ai-video/:id/post-to-instagram
 */
router.post('/:id/post-to-instagram', auth, async (req, res) => {
  try {
    const { caption, hashtags } = req.body;

    const video = await GeneratedVideo.findOne({ 
      _id: req.params.id, 
      user: req.userId 
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Upload to Cloudinary if not already there
    let videoUrl = video.videoUrl;
    if (!videoUrl.includes('cloudinary')) {
      const cloudinaryResult = await uploadToCloudinary(videoUrl, {
        folder: 'instamarketing/reels',
        resource_type: 'video'
      });

      if (cloudinaryResult.success) {
        videoUrl = cloudinaryResult.url;
        video.cloudinaryUrl = videoUrl;
        await video.save();
      }
    }

    // Post to Instagram
    const axios = require('axios');
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !igAccountId) {
      return res.status(400).json({ error: 'Instagram not configured' });
    }

    const fullCaption = hashtags 
      ? `${caption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`
      : caption;

    // Create video container
    const containerResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igAccountId}/media`,
      null,
      {
        params: {
          video_url: videoUrl,
          caption: fullCaption,
          media_type: 'REELS',
          access_token: accessToken
        }
      }
    );

    const containerId = containerResponse.data.id;

    // Wait for video to be ready
    let status = 'IN_PROGRESS';
    let attempts = 0;
    while (status === 'IN_PROGRESS' && attempts < 30) {
      await new Promise(r => setTimeout(r, 5000));
      const statusResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${containerId}`,
        { params: { fields: 'status_code', access_token: accessToken } }
      );
      status = statusResponse.data.status_code;
      attempts++;
    }

    if (status !== 'FINISHED') {
      return res.status(500).json({ error: 'Video processing failed on Instagram' });
    }

    // Publish
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
      null,
      { params: { creation_id: containerId, access_token: accessToken } }
    );

    // Update video record
    video.postedToInstagram = true;
    video.instagramPostId = publishResponse.data.id;
    await video.save();

    res.json({
      success: true,
      message: 'Video posted to Instagram Reels!',
      instagramPostId: publishResponse.data.id
    });

  } catch (error) {
    console.error('Post to Instagram error:', error.response?.data || error);
    res.status(500).json({ error: error.response?.data?.error?.message || 'Failed to post to Instagram' });
  }
});

module.exports = router;
