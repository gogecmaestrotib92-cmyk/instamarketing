/**
 * Shotstack Video Render API Route
 * 
 * POST /api/render-video
 * 
 * Renders a video with music and subtitles using Shotstack API.
 * This is a cloud-based alternative to FFmpeg for serverless platforms.
 * 
 * Request Body:
 * {
 *   "videoUrl": "URL from Replicate",
 *   "audioUrl": "URL of background music",
 *   "subtitles": [
 *     { "text": "Hello world", "start": 0, "end": 2.5 },
 *     { "text": "Another line", "start": 2.5, "end": 5.0 }
 *   ],
 *   "options": {
 *     "duration": 6,
 *     "musicVolume": 0.8,
 *     "subtitleStyle": { ... }
 *   }
 * }
 * 
 * Response:
 * { "success": true, "url": "https://cdn.shotstack.io/..." }
 * or
 * { "success": false, "error": "Error message" }
 */

const express = require('express');
const { auth } = require('../middleware/auth');
const {
  createShotstackRender,
  pollRenderStatus,
  renderVideo
} = require('../services/shotstackClient');

const router = express.Router();

/**
 * POST /api/render-video
 * Full render workflow: submit + poll until complete
 */
router.post('/', auth, async (req, res) => {
  try {
    const { videoUrl, audioUrl, subtitles, options = {} } = req.body;

    // Validate required fields
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: 'videoUrl is required'
      });
    }

    // Validate videoUrl format
    if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
      return res.status(400).json({
        success: false,
        error: 'videoUrl must be a valid HTTP/HTTPS URL'
      });
    }

    // Validate subtitles format if provided
    if (subtitles && !Array.isArray(subtitles)) {
      return res.status(400).json({
        success: false,
        error: 'subtitles must be an array'
      });
    }

    if (subtitles) {
      for (let i = 0; i < subtitles.length; i++) {
        const sub = subtitles[i];
        if (!sub.text || typeof sub.start !== 'number' || typeof sub.end !== 'number') {
          return res.status(400).json({
            success: false,
            error: `Invalid subtitle at index ${i}. Each subtitle must have: text (string), start (number), end (number)`
          });
        }
        if (sub.start < 0 || sub.end <= sub.start) {
          return res.status(400).json({
            success: false,
            error: `Invalid timing at subtitle ${i}. start must be >= 0 and end must be > start`
          });
        }
      }
    }

    console.log('🎬 Starting video render...');
    console.log('   Video URL:', videoUrl);
    console.log('   Audio URL:', audioUrl || 'none');
    console.log('   Subtitles:', subtitles?.length || 0);

    // Perform full render workflow
    const result = await renderVideo(videoUrl, audioUrl, subtitles || [], {
      ...options,
      maxAttempts: 120,     // 10 minutes max (120 * 5s)
      pollInterval: 5000    // Poll every 5 seconds
    });

    if (result.success) {
      console.log('✅ Render complete:', result.url);
      return res.json({
        success: true,
        url: result.url
      });
    } else {
      console.error('❌ Render failed:', result.error);
      return res.status(500).json({
        success: false,
        error: result.error || 'Video render failed'
      });
    }

  } catch (error) {
    console.error('❌ Render API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /api/render-video/start
 * Start render job without waiting (async mode)
 * Returns jobId for manual polling
 */
router.post('/start', auth, async (req, res) => {
  try {
    const { videoUrl, audioUrl, subtitles, options = {} } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: 'videoUrl is required'
      });
    }

    console.log('🎬 Starting async video render...');

    const result = await createShotstackRender(videoUrl, audioUrl, subtitles || [], options);

    if (result.success) {
      return res.json({
        success: true,
        jobId: result.jobId,
        message: 'Render job started. Use /api/render-video/status/:jobId to check progress.'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to start render job'
      });
    }

  } catch (error) {
    console.error('❌ Start render error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/render-video/status/:jobId
 * Check render job status
 */
router.get('/status/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'jobId is required'
      });
    }

    const { getRenderStatus } = require('../services/shotstackClient');
    const status = await getRenderStatus(jobId);

    return res.json({
      success: true,
      status: status.status,
      progress: status.progress,
      url: status.url,
      error: status.error
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;
