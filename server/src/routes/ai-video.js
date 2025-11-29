const express = require('express');
const { auth } = require('../middleware/auth');
const replicateService = require('../services/replicate');
const { uploadToCloudinary } = require('../services/cloudinary');
const upload = require('../services/upload');
const GeneratedVideo = require('../models/GeneratedVideo');

// Try to load video processors - Shotstack for cloud, FFmpeg for local
let shotstackClient = null;
let videoProcessor = null;

try {
  shotstackClient = require('../services/shotstackClient');
  console.log('✅ Shotstack client loaded');
} catch (e) {
  console.log('Shotstack client not available:', e.message);
}

try {
  videoProcessor = require('../services/videoProcessor');
  console.log('✅ FFmpeg video processor loaded');
} catch (e) {
  console.log('FFmpeg video processor not available:', e.message);
}

const router = express.Router();

// In-memory store for pending predictions (for Vercel serverless)
const pendingPredictions = new Map();

/**
 * Check video generation status (for async polling)
 * POST /api/ai-video/status
 * 
 * Body: { id, prompt, duration, aspectRatio, musicConfig, textConfig }
 * Note: Config is passed with each request because Vercel serverless is stateless
 */
router.post('/status', auth, async (req, res) => {
  try {
    const { id, prompt, duration, aspectRatio, musicConfig, textConfig } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Prediction ID required' });
    }

    console.log(`📊 Checking status for prediction: ${id}`);
    console.log(`   Request body keys:`, Object.keys(req.body));
    console.log(`   musicConfig:`, musicConfig ? JSON.stringify(musicConfig).substring(0, 200) : 'null');
    console.log(`   textConfig:`, textConfig ? JSON.stringify(textConfig).substring(0, 200) : 'null');

    // Check Replicate status
    const statusResult = await replicateService.getPredictionStatus(id);
    
    if (!statusResult.success) {
      return res.status(500).json({ error: statusResult.error });
    }

    const { status, output, error } = statusResult;
    console.log(`   Status: ${status}, Output: ${output ? 'yes' : 'no'}`);

    if (status === 'succeeded' && output) {
      let videoUrl = Array.isArray(output) ? output[0] : output;
      
      // Use config from request body (serverless stateless)
      const metadata = {
        prompt: prompt || 'AI Generated Video',
        duration: duration || 6,
        aspectRatio: aspectRatio || '9:16',
        musicConfig,
        textConfig
      };
      
      console.log('📦 Processing config:', JSON.stringify({
        hasMusic: !!metadata.musicConfig,
        hasText: !!metadata.textConfig,
        musicUrl: metadata.musicConfig?.url ? 'yes' : 'no'
      }));

      // Process video with music and/or text if provided
      if (metadata.musicConfig || metadata.textConfig) {
        try {
          console.log('🎵 Processing video with music/text overlays...');
          
          // Build subtitles from textConfig
          const subtitles = [];
          if (metadata.textConfig) {
            if (metadata.textConfig.overlayText) {
              // For overlay text, show throughout (estimate 6s duration)
              subtitles.push({
                text: metadata.textConfig.overlayText,
                start: 0,
                end: metadata.duration || 6
              });
            }
            if (metadata.textConfig.captions && metadata.textConfig.captions.length > 0) {
              subtitles.push(...metadata.textConfig.captions.map(c => ({
                text: c.text,
                start: c.start,
                end: c.end
              })));
            }
          }

          // Get music URL from config
          let musicUrl = null;
          if (metadata.musicConfig && metadata.musicConfig.enabled !== false) {
            // Check for direct URL first (from MusicModalV2)
            if (metadata.musicConfig.url) {
              musicUrl = metadata.musicConfig.url;
            } else if (metadata.musicConfig.preset) {
              // Fallback to preset mapping
              const musicPresets = {
                'upbeat': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                'chill': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
                'epic': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
                'piano': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
                'electronic': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
              };
              musicUrl = musicPresets[metadata.musicConfig.preset] || null;
            }
          }

          console.log('🎵 Music URL:', musicUrl ? 'yes' : 'no');
          console.log('📝 Subtitles:', subtitles.length);

          if (musicUrl || subtitles.length > 0) {
            // Try Shotstack first (cloud-based, works on Vercel)
            if (shotstackClient) {
              console.log('🎬 Using Shotstack for video processing...');
              console.log('   Video URL:', videoUrl);
              console.log('   Music URL:', musicUrl);
              console.log('   Subtitles count:', subtitles.length);
              
              try {
                const renderResult = await shotstackClient.renderVideo(
                  videoUrl,
                  musicUrl,
                  subtitles,
                  {
                    duration: metadata.duration || 6,
                    musicVolume: metadata.musicConfig?.volume || 0.8
                  }
                );

                if (renderResult.success && renderResult.url) {
                  videoUrl = renderResult.url;
                  console.log('✅ Shotstack render complete:', videoUrl);
                } else {
                  console.error('⚠️ Shotstack render failed:', renderResult.error);
                  // Don't throw, just continue with original video
                }
              } catch (shotstackError) {
                console.error('⚠️ Shotstack error:', shotstackError.message);
              }
            }
            // Fallback to FFmpeg (local processing)
            else if (videoProcessor) {
              console.log('🎬 Using FFmpeg for video processing...');
              
              const processedVideoPath = await videoProcessor.processVideo({
                videoUrl: videoUrl,
                voiceoverUrl: null,
                musicUrl: musicUrl,
                musicVolume: metadata.musicConfig?.volume || 0.5,
                overlays: subtitles.length > 0 ? subtitles : null,
                aspectRatio: metadata.aspectRatio || '9:16'
              });

              // Upload processed video to Cloudinary
              if (processedVideoPath && processedVideoPath.startsWith('/uploads/')) {
                const fs = require('fs');
                const path = require('path');
                const fullPath = path.join(__dirname, '../..', processedVideoPath);
                
                if (fs.existsSync(fullPath)) {
                  console.log('☁️ Uploading processed video to Cloudinary...');
                  const cloudinaryResult = await uploadToCloudinary(fullPath, {
                    folder: 'instamarketing/processed-videos',
                    resource_type: 'video'
                  });
                  
                  if (cloudinaryResult.success) {
                    videoUrl = cloudinaryResult.url;
                    console.log('✅ Processed video uploaded:', videoUrl);
                    try { fs.unlinkSync(fullPath); } catch (e) {}
                  }
                }
              } else if (processedVideoPath && !processedVideoPath.startsWith('/uploads/')) {
                videoUrl = processedVideoPath;
              }
            } else {
              console.log('⚠️ No video processor available - returning original video');
            }

            console.log('✅ Video processing complete!');
          }
        } catch (processError) {
          console.error('⚠️ Video processing error (using original):', processError.message);
          // Continue with original video if processing fails
        }
      }
      
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
      return res.json({
        status: 'failed',
        error: error || 'Video generation failed'
      });
    } else if (status === 'canceled') {
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
