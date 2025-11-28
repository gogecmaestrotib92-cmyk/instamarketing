const express = require('express');
const { auth } = require('../middleware/auth');
const replicateService = require('../services/replicate');
const { uploadToCloudinary } = require('../services/cloudinary');
const upload = require('../services/upload');
const GeneratedVideo = require('../models/GeneratedVideo');
const videoProcessor = require('../services/videoProcessor');

const router = express.Router();

/**
 * Generate video from text prompt
 * POST /api/ai-video/text-to-video
 */
router.post('/text-to-video', auth, async (req, res) => {
  try {
    // Default to premium (Minimax) for better quality and length (6s vs 2s)
    const { prompt, duration = 4, aspectRatio = '9:16', quality = 'premium', musicConfig, textConfig } = req.body;

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

    let finalVideoUrl = result.videoUrl;

    // Process video with music and/or text if provided
    if (musicConfig || textConfig) {
      try {
        console.log('Processing video with music/text overlays...');
        
        // Build overlays from textConfig
        const overlays = [];
        if (textConfig) {
          if (textConfig.overlayText) {
            overlays.push({
              text: textConfig.overlayText,
              start: 0,
              end: 999 // Show throughout
            });
          }
          if (textConfig.captions && textConfig.captions.length > 0) {
            overlays.push(...textConfig.captions);
          }
        }

        // Get music URL from preset or null
        let musicUrl = null;
        if (musicConfig && musicConfig.preset) {
          // Map preset names to actual music file URLs
          const musicPresets = {
            'upbeat': 'https://cdn.pixabay.com/audio/2024/02/14/audio_66b66f5a36.mp3',
            'chill': 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
            'epic': 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0ef25e06d.mp3',
            'piano': 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3',
            'electronic': 'https://cdn.pixabay.com/audio/2022/03/15/audio_8d84e1a0c1.mp3'
          };
          musicUrl = musicPresets[musicConfig.preset] || null;
        }

        const processedVideoPath = await videoProcessor.processVideo({
          videoUrl: result.videoUrl,
          voiceoverUrl: null,
          musicUrl: musicUrl,
          overlays: overlays.length > 0 ? overlays : null,
          aspectRatio: aspectRatio
        });

        // Upload processed video to get a public URL
        if (processedVideoPath && processedVideoPath.startsWith('/uploads/')) {
          const fs = require('fs');
          const path = require('path');
          const fullPath = path.join(__dirname, '../..', processedVideoPath);
          
          if (fs.existsSync(fullPath)) {
            const cloudinaryResult = await uploadToCloudinary(fullPath, {
              folder: 'instamarketing/processed-videos',
              resource_type: 'video'
            });
            
            if (cloudinaryResult.success) {
              finalVideoUrl = cloudinaryResult.url;
              // Clean up local file
              try { fs.unlinkSync(fullPath); } catch (e) {}
            }
          }
        } else if (processedVideoPath) {
          finalVideoUrl = processedVideoPath;
        }

        console.log('Video processed successfully with music/text');
      } catch (processError) {
        console.error('Video processing error (continuing with original):', processError);
        // Continue with original video if processing fails
      }
    }

    // Save to database
    const video = new GeneratedVideo({
      user: req.userId,
      type: 'text-to-video',
      prompt,
      videoUrl: finalVideoUrl,
      duration: parseInt(duration),
      aspectRatio,
      status: 'completed',
      hasMusic: !!musicConfig,
      hasText: !!textConfig
    });
    await video.save();

    res.json({
      success: true,
      message: 'Video generated successfully!',
      video: {
        id: video._id,
        videoUrl: finalVideoUrl,
        prompt,
        duration,
        aspectRatio,
        hasMusic: !!musicConfig,
        hasText: !!textConfig
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

    // Start generation
    const result = await replicateService.imageToVideo(sourceImageUrl, prompt, {
      duration: parseInt(duration)
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    let finalVideoUrl = result.videoUrl;

    // Process video with music and/or text if provided
    if (musicConfig || textConfig) {
      try {
        console.log('Processing video with music/text overlays...');
        
        // Build overlays from textConfig
        const overlays = [];
        if (textConfig) {
          if (textConfig.overlayText) {
            overlays.push({
              text: textConfig.overlayText,
              start: 0,
              end: 999
            });
          }
          if (textConfig.captions && textConfig.captions.length > 0) {
            overlays.push(...textConfig.captions);
          }
        }

        // Get music URL from preset
        let musicUrl = null;
        if (musicConfig && musicConfig.preset) {
          const musicPresets = {
            'upbeat': 'https://cdn.pixabay.com/audio/2024/02/14/audio_66b66f5a36.mp3',
            'chill': 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
            'epic': 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0ef25e06d.mp3',
            'piano': 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3',
            'electronic': 'https://cdn.pixabay.com/audio/2022/03/15/audio_8d84e1a0c1.mp3'
          };
          musicUrl = musicPresets[musicConfig.preset] || null;
        }

        const processedVideoPath = await videoProcessor.processVideo({
          videoUrl: result.videoUrl,
          voiceoverUrl: null,
          musicUrl: musicUrl,
          overlays: overlays.length > 0 ? overlays : null,
          aspectRatio: aspectRatio
        });

        // Upload processed video
        if (processedVideoPath && processedVideoPath.startsWith('/uploads/')) {
          const fs = require('fs');
          const path = require('path');
          const fullPath = path.join(__dirname, '../..', processedVideoPath);
          
          if (fs.existsSync(fullPath)) {
            const cloudResult = await uploadToCloudinary(fullPath, {
              folder: 'instamarketing/processed-videos',
              resource_type: 'video'
            });
            
            if (cloudResult.success) {
              finalVideoUrl = cloudResult.url;
              try { fs.unlinkSync(fullPath); } catch (e) {}
            }
          }
        } else if (processedVideoPath) {
          finalVideoUrl = processedVideoPath;
        }

        console.log('Video processed successfully with music/text');
      } catch (processError) {
        console.error('Video processing error:', processError);
      }
    }

    // Save to database
    const video = new GeneratedVideo({
      user: req.userId,
      type: 'image-to-video',
      prompt: prompt || 'Animated from image',
      sourceImageUrl,
      videoUrl: finalVideoUrl,
      duration: parseInt(duration),
      aspectRatio,
      status: 'completed',
      hasMusic: !!musicConfig,
      hasText: !!textConfig
    });
    await video.save();

    res.json({
      success: true,
      message: 'Video generated successfully!',
      video: {
        id: video._id,
        videoUrl: finalVideoUrl,
        sourceImageUrl,
        prompt,
        duration,
        aspectRatio,
        hasMusic: !!musicConfig,
        hasText: !!textConfig
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
