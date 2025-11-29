const express = require('express');
const { auth } = require('../middleware/auth');
const replicateService = require('../services/replicate');
const { uploadToCloudinary } = require('../services/cloudinary');
const upload = require('../services/upload');
const GeneratedVideo = require('../models/GeneratedVideo');
const videoProcessor = require('../services/videoProcessor');

const router = express.Router();

// In-memory store for pending predictions (for Vercel serverless)
const pendingPredictions = new Map();

/**
 * Check video generation status (for async polling)
 * GET /api/ai-video/status
 */
router.get('/status', auth, async (req, res) => {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Prediction ID required' });
    }

    console.log(`📊 Checking status for prediction: ${id}`);

    // Check Replicate status
    const statusResult = await replicateService.getPredictionStatus(id);
    
    if (!statusResult.success) {
      return res.status(500).json({ error: statusResult.error });
    }

    const { status, output, error } = statusResult;
    console.log(`   Status: ${status}, Output: ${output ? 'yes' : 'no'}`);

    if (status === 'succeeded' && output) {
      const videoUrl = Array.isArray(output) ? output[0] : output;
      
      // Get stored metadata
      const metadata = pendingPredictions.get(id) || {};
      
      // Save to database
      try {
        const video = new GeneratedVideo({
          user: req.userId,
          type: metadata.type || 'text-to-video',
          prompt: metadata.prompt || 'AI Generated Video',
          videoUrl: videoUrl,
          duration: metadata.duration || 5,
          aspectRatio: metadata.aspectRatio || '9:16',
          status: 'completed',
          hasMusic: !!metadata.musicConfig,
          hasText: !!metadata.textConfig
        });
        await video.save();
        console.log('✅ Video saved to database:', video._id);
        
        // Clean up
        pendingPredictions.delete(id);
        
        return res.json({
          status: 'completed',
          video: {
            id: video._id,
            videoUrl: videoUrl,
            prompt: metadata.prompt,
            duration: metadata.duration
          }
        });
      } catch (dbError) {
        console.error('DB save error:', dbError);
        // Still return success even if DB save fails
        return res.json({
          status: 'completed',
          video: {
            id: id,
            videoUrl: videoUrl,
            prompt: metadata.prompt
          }
        });
      }
    } else if (status === 'failed') {
      pendingPredictions.delete(id);
      return res.json({
        status: 'failed',
        error: error || 'Video generation failed'
      });
    } else if (status === 'canceled') {
      pendingPredictions.delete(id);
      return res.json({
        status: 'failed',
        error: 'Generation was canceled'
      });
    }

    // Still processing
    return res.json({
      status: 'processing',
      replicateStatus: status
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate video from text prompt (ASYNC - returns predictionId immediately)
 * POST /api/ai-video/text-to-video
 */
router.post('/text-to-video', auth, async (req, res) => {
  try {
    const { prompt, duration = 4, aspectRatio = '9:16', quality = 'premium', musicConfig, textConfig } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(500).json({ error: 'Replicate API not configured' });
    }

    console.log('🎬 Starting async text-to-video generation...');
    console.log('Prompt:', prompt);

    // Start async generation (returns immediately with predictionId)
    const result = await replicateService.startTextToVideo(prompt, { quality });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Store metadata for when the video completes
    pendingPredictions.set(result.predictionId, {
      userId: req.userId,
      type: 'text-to-video',
      prompt,
      duration: parseInt(duration),
      aspectRatio,
      musicConfig,
      textConfig,
      startedAt: new Date()
    });

    console.log('✅ Generation started, predictionId:', result.predictionId);

    // Return immediately with predictionId for polling
    res.json({
      success: true,
      predictionId: result.predictionId,
      status: 'processing',
      message: 'Video generation started. Poll /api/ai-video/status?id=<predictionId> for updates.'
    });

  } catch (error) {
    console.error('Text-to-video error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate video' });
  }
});

/**
 * Generate video from image (animate image) - ASYNC
 * POST /api/ai-video/image-to-video
 */
router.post('/image-to-video', auth, upload.single('image'), async (req, res) => {
  try {
    const { prompt, duration = 4, aspectRatio = '9:16', imageUrl } = req.body;
    
    // Parse musicConfig and textConfig from FormData (they come as JSON strings)
    let musicConfig = null;
    let textConfig = null;
    try {
      if (req.body.musicConfig) musicConfig = JSON.parse(req.body.musicConfig);
      if (req.body.textConfig) textConfig = JSON.parse(req.body.textConfig);
    } catch (e) {
      console.log('Could not parse music/text config:', e.message);
    }

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

    console.log('🎬 Starting async image-to-video generation...');

    // Start async generation
    const result = await replicateService.startImageToVideo(sourceImageUrl, prompt, {
      duration: parseInt(duration)
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Store metadata for when the video completes
    pendingPredictions.set(result.predictionId, {
      userId: req.userId,
      type: 'image-to-video',
      prompt: prompt || 'Animated from image',
      sourceImageUrl,
      duration: parseInt(duration),
      aspectRatio,
      musicConfig,
      textConfig,
      startedAt: new Date()
    });

    console.log('✅ Generation started, predictionId:', result.predictionId);

    // Return immediately with predictionId for polling
    res.json({
      success: true,
      predictionId: result.predictionId,
      status: 'processing',
      message: 'Video generation started.'
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
    const { caption, hashtags, videoUrl: providedVideoUrl } = req.body;

    let video = null;
    
    // Try to find by ID if it's a valid ObjectId
    if (req.params.id && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      video = await GeneratedVideo.findOne({ 
        _id: req.params.id, 
        user: req.userId 
      });
    }

    // Use DB video URL or fallback to provided URL
    let videoUrl = video ? video.videoUrl : providedVideoUrl;

    if (!videoUrl) {
      return res.status(404).json({ error: 'Video not found and no URL provided' });
    }

    // Upload to Cloudinary if not already there
    if (!videoUrl.includes('cloudinary')) {
      const cloudinaryResult = await uploadToCloudinary(videoUrl, {
        folder: 'instamarketing/reels',
        resource_type: 'video'
      });

      if (cloudinaryResult.success) {
        videoUrl = cloudinaryResult.url;
        if (video) {
          video.cloudinaryUrl = videoUrl;
          await video.save();
        }
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

    // Update video record if it exists
    if (video) {
      video.postedToInstagram = true;
      video.instagramPostId = publishResponse.data.id;
      await video.save();
    }

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
