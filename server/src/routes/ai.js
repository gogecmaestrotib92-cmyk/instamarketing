const express = require('express');
const router = express.Router();
const openaiService = require('../services/openai');
const googleTTSService = require('../services/googleTTS');
const replicateService = require('../services/replicate');
const videoComposerService = require('../services/videoComposer');
const fetch = require('node-fetch');

// Import Cloudinary for uploading assets before Shotstack
let cloudinaryUpload = null;
try {
  const cloudinary = require('../services/cloudinary');
  cloudinaryUpload = cloudinary.uploadBufferToCloudinary;
  console.log('✅ Cloudinary loaded for AI routes');
} catch (e) {
  console.log('Cloudinary not available:', e.message);
}

// Try to load Shotstack for cloud video processing (works on Vercel)
let shotstackClient = null;
try {
  shotstackClient = require('../services/shotstackClient');
  console.log('✅ Shotstack client loaded for AI routes');
} catch (e) {
  console.log('Shotstack not available for AI routes:', e.message);
}

/**
 * AI Content Generation Routes
 * OpenAI + Google Text-to-Speech + Replicate Video + Video Composer
 */

// ==================== OpenAI Routes ====================

/**
 * Generate Instagram caption
 * POST /api/ai/caption
 */
router.post('/caption', async (req, res) => {
  try {
    const { topic, tone, includeEmojis, includeHashtags, language } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const result = await openaiService.generateCaption(topic, {
      tone,
      includeEmojis,
      includeHashtags,
      language
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ caption: result.caption });
  } catch (error) {
    console.error('Caption generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate hashtags
 * POST /api/ai/hashtags
 */
router.post('/hashtags', async (req, res) => {
  try {
    const { topic, count } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const result = await openaiService.generateHashtags(topic, count || 15);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ hashtags: result.hashtags });
  } catch (error) {
    console.error('Hashtags generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate content ideas
 * POST /api/ai/ideas
 */
router.post('/ideas', async (req, res) => {
  try {
    const { niche, count } = req.body;

    if (!niche) {
      return res.status(400).json({ error: 'Niche is required' });
    }

    const result = await openaiService.generateContentIdeas(niche, count || 5);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ ideas: result.ideas });
  } catch (error) {
    console.error('Ideas generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate Reel script
 * POST /api/ai/script
 */
router.post('/script', async (req, res) => {
  try {
    const { topic, duration } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const result = await openaiService.generateReelScript(topic, duration || 30);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ script: result.script });
  } catch (error) {
    console.error('Script generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Improve existing caption
 * POST /api/ai/improve
 */
router.post('/improve', async (req, res) => {
  try {
    const { caption } = req.body;

    if (!caption) {
      return res.status(400).json({ error: 'Caption is required' });
    }

    const result = await openaiService.improveCaption(caption);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ improvedCaption: result.improvedCaption });
  } catch (error) {
    console.error('Caption improvement error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate video prompt
 * POST /api/ai/video-prompt
 */
router.post('/video-prompt', async (req, res) => {
  try {
    const { topic, style } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const result = await openaiService.generateVideoPrompt(topic, style || 'cinematic');

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ prompt: result.prompt });
  } catch (error) {
    console.error('Video prompt generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Chat with AI assistant
 * POST /api/ai/chat
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await openaiService.chat(message, history || []);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ response: result.response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Google TTS Routes ====================

/**
 * List available voices
 * GET /api/ai/voices
 */
router.get('/voices', async (req, res) => {
  try {
    const { language } = req.query;
    const result = await googleTTSService.listVoices(language || 'en-US');

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ voices: result.voices });
  } catch (error) {
    console.error('List voices error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get recommended voices
 * GET /api/ai/voices/recommended
 */
router.get('/voices/recommended', (req, res) => {
  const voices = googleTTSService.getRecommendedVoices();
  res.json({ voices });
});

/**
 * Text to speech
 * POST /api/ai/tts
 */
router.post('/tts', async (req, res) => {
  try {
    const { text, languageCode, voiceName, speakingRate, pitch } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long (max 5000 characters)' });
    }

    const result = await googleTTSService.textToSpeech(text, {
      languageCode,
      voiceName,
      speakingRate,
      pitch
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      audioUrl: result.audioUrl,
      filename: result.filename
    });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate voiceover with style presets
 * POST /api/ai/voiceover
 */
router.post('/voiceover', async (req, res) => {
  try {
    const { script, style } = req.body;

    if (!script) {
      return res.status(400).json({ error: 'Script is required' });
    }

    const result = await googleTTSService.generateVoiceover(script, style || 'energetic');

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      audioUrl: result.audioUrl,
      filename: result.filename
    });
  } catch (error) {
    console.error('Voiceover error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Full workflow: Generate script + voiceover
 * POST /api/ai/full-voiceover
 */
router.post('/full-voiceover', async (req, res) => {
  try {
    const { topic, duration, voiceStyle } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // Step 1: Generate script
    const scriptResult = await openaiService.generateReelScript(topic, duration || 30);
    if (!scriptResult.success) {
      return res.status(500).json({ error: 'Failed to generate script: ' + scriptResult.error });
    }

    // Step 2: Generate voiceover
    const voiceResult = await googleTTSService.generateVoiceover(
      scriptResult.script, 
      voiceStyle || 'energetic'
    );
    if (!voiceResult.success) {
      return res.status(500).json({ error: 'Failed to generate voiceover: ' + voiceResult.error });
    }

    res.json({
      script: scriptResult.script,
      audioUrl: voiceResult.audioUrl,
      filename: voiceResult.filename
    });
  } catch (error) {
    console.error('Full voiceover error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Replicate Video Routes ====================

/**
 * Generate video from text (synchronous - waits for completion)
 * POST /api/ai/video/generate
 */
router.post('/video/generate', async (req, res) => {
  try {
    const { prompt, numFrames, fps, steps } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('🎬 Video generation request:', prompt);

    const result = await replicateService.textToVideo(prompt, {
      numFrames: numFrames || 16,
      fps: fps || 8,
      steps: steps || 25
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error, requiresPayment: result.requiresPayment });
    }

    res.json({
      success: true,
      videoUrl: result.videoUrl,
      predictionId: result.predictionId
    });
  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start async video generation (returns immediately)
 * POST /api/ai/video/start
 */
router.post('/video/start', async (req, res) => {
  try {
    const { prompt, numFrames, fps, steps } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await replicateService.startTextToVideo(prompt, {
      numFrames: numFrames || 16,
      fps: fps || 8,
      steps: steps || 25
    });

    res.json(result);
  } catch (error) {
    console.error('Start video error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check video generation status
 * GET /api/ai/video/status/:id
 */
router.get('/video/status/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Prediction ID is required' });
    }

    const result = await replicateService.getPredictionStatus(id);
    res.json(result);
  } catch (error) {
    console.error('Video status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get available video models
 * GET /api/ai/video/models
 */
router.get('/video/models', (req, res) => {
  res.json(replicateService.getModels());
});

// ==================== Video Composer Routes ====================

/**
 * Compose video with audio and text
 * POST /api/ai/video/compose
 */
router.post('/video/compose', async (req, res) => {
  try {
    const { videoUrl, audioUrl, text, textPosition, fontSize } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    console.log('🎬 Composing video...');
    const result = await videoComposerService.composeVideo({
      videoUrl,
      audioUrl,
      text,
      textPosition: textPosition || 'bottom',
      fontSize: fontSize || 36
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      videoUrl: result.videoUrl,
      filename: result.filename
    });
  } catch (error) {
    console.error('Video compose error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Full Reel Creator: Generate video + voiceover + text from topic
 * POST /api/ai/reel/create
 */
router.post('/reel/create', async (req, res) => {
  try {
    const { 
      topic, 
      videoPrompt, 
      voiceStyle = 'energetic',
      textOverlay,
      textPosition = 'bottom'
    } = req.body;

    if (!topic && !videoPrompt) {
      return res.status(400).json({ error: 'Topic or video prompt is required' });
    }

    const results = {
      steps: [],
      errors: []
    };

    // Step 1: Generate script from topic
    console.log('📝 Step 1: Generating script...');
    let script = '';
    if (topic) {
      const scriptResult = await openaiService.generateReelScript(topic, 15);
      if (scriptResult.success) {
        script = scriptResult.script;
        results.steps.push({ step: 'script', success: true, data: script });
      } else {
        results.errors.push({ step: 'script', error: scriptResult.error });
      }
    }

    // Step 2: Generate voiceover from script
    console.log('🎤 Step 2: Generating voiceover...');
    let audioUrl = null;
    if (script) {
      const voiceResult = await googleTTSService.generateVoiceover(script, voiceStyle);
      if (voiceResult.success) {
        audioUrl = voiceResult.audioUrl;
        results.steps.push({ step: 'voiceover', success: true, data: audioUrl });
      } else {
        results.errors.push({ step: 'voiceover', error: voiceResult.error });
      }
    }

    // Step 3: Start video generation
    console.log('🎬 Step 3: Starting video generation...');
    const videoPromptFinal = videoPrompt || `${topic}, cinematic, high quality, smooth motion`;
    const videoResult = await replicateService.startTextToVideo(videoPromptFinal, {
      numFrames: 16,
      fps: 8,
      steps: 25
    });

    if (videoResult.success) {
      results.steps.push({ 
        step: 'video', 
        success: true, 
        predictionId: videoResult.predictionId,
        status: 'processing'
      });
    } else {
      results.errors.push({ step: 'video', error: videoResult.error });
    }

    // Return partial results - video will be composed when ready
    res.json({
      success: true,
      message: 'Reel creation started',
      script: script,
      audioUrl: audioUrl,
      videoPredictionId: videoResult.predictionId,
      textOverlay: textOverlay || script?.substring(0, 50) + '...',
      results
    });

  } catch (error) {
    console.error('Reel create error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Finalize reel: Compose video with audio and text after video is ready
 * POST /api/ai/reel/finalize
 * 
 * Uses Shotstack for cloud processing (works on Vercel), falls back to FFmpeg locally
 * Returns immediately with jobId - frontend should poll for completion
 */
router.post('/reel/finalize', async (req, res) => {
  try {
    let { videoUrl, audioUrl, text, textPosition } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    console.log('🎬 Finalizing reel...');
    console.log('   Video:', videoUrl);
    console.log('   Audio:', audioUrl || 'none');
    console.log('   Text:', text || 'none');

    // Build subtitles array if text provided
    const subtitles = text ? [{ text, start: 0, end: 6 }] : [];

    // Try Shotstack first (cloud-based, works on Vercel)
    if (shotstackClient && (audioUrl || subtitles.length > 0)) {
      console.log('☁️ Using Shotstack for reel composition...');
      
      try {
        // CRITICAL: Upload video to Cloudinary first
        // Replicate URLs expire quickly, Shotstack needs persistent URLs!
        if (cloudinaryUpload && videoUrl.includes('replicate.delivery')) {
          console.log('📤 Uploading video to Cloudinary (Replicate URLs expire)...');
          try {
            const videoResponse = await fetch(videoUrl);
            const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
            const uploadResult = await cloudinaryUpload(videoBuffer, {
              folder: 'instamarketing/reels',
              resource_type: 'video'
            });
            if (uploadResult.success) {
              videoUrl = uploadResult.url;
              console.log('✅ Video uploaded to Cloudinary:', videoUrl);
            }
          } catch (uploadErr) {
            console.error('⚠️ Video upload failed:', uploadErr.message);
            // Continue with original URL - might work if not expired
          }
        }

        // Start Shotstack render job - DON'T WAIT (Vercel has 10s timeout)
        const jobResult = await shotstackClient.createShotstackRender(
          videoUrl,
          audioUrl,
          subtitles,
          { duration: 6, musicVolume: 0.8 }
        );

        if (jobResult.success && jobResult.jobId) {
          console.log('✅ Shotstack job started:', jobResult.jobId);
          
          // Return immediately with job ID - frontend will poll
          return res.json({
            success: true,
            processing: true,
            shotstackJobId: jobResult.jobId,
            videoUrl: videoUrl, // Return original video for now
            message: 'Reel processing started! Checking for completion...'
          });
        }
      } catch (shotstackError) {
        console.error('Shotstack error:', shotstackError.message);
        // Fall through - return original video
      }
    }

    // No processing needed or Shotstack failed - return original video
    // FFmpeg won't work on Vercel anyway
    console.log('ℹ️ Returning original video (no cloud processing available)');
    res.json({
      success: true,
      videoUrl: videoUrl,
      message: 'Reel ready (original video)'
    });
  } catch (error) {
    console.error('Reel finalize error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Video Edit Render Routes ====================

/**
 * Start a video render job with music and subtitles
 * POST /api/ai/shotstack/render
 */
router.post('/shotstack/render', async (req, res) => {
  try {
    const { videoUrl, audioUrl, subtitles, options } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'videoUrl is required' });
    }
    
    if (!shotstackClient) {
      return res.status(503).json({ error: 'Shotstack service not available' });
    }
    
    console.log('🎬 Starting video edit render...');
    console.log('   Video:', videoUrl);
    console.log('   Audio:', audioUrl || 'none');
    console.log('   Subtitles:', subtitles?.length || 0);
    
    const jobResult = await shotstackClient.createShotstackRender(
      videoUrl,
      audioUrl,
      subtitles || [],
      {
        duration: options?.duration,
        musicVolume: options?.musicVolume || 1,
        videoVolume: options?.videoVolume || 0
      }
    );
    
    if (jobResult.success && jobResult.jobId) {
      res.json({
        success: true,
        jobId: jobResult.jobId,
        message: 'Render job started'
      });
    } else {
      throw new Error(jobResult.error || 'Failed to start render job');
    }
  } catch (error) {
    console.error('Shotstack render error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get render job status
 * GET /api/ai/shotstack/status/:jobId
 */
router.get('/shotstack/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required' });
    }
    
    if (!shotstackClient) {
      return res.status(503).json({ error: 'Shotstack service not available' });
    }
    
    const status = await shotstackClient.getRenderStatus(jobId);
    res.json(status);
  } catch (error) {
    console.error('Shotstack status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Upload video to Cloudinary for rendering
 * POST /api/ai/upload-video
 */
const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

router.post('/upload-video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }
    
    if (!cloudinaryUpload) {
      return res.status(503).json({ error: 'Cloudinary service not available' });
    }
    
    console.log('📤 Uploading video to Cloudinary...');
    console.log('   Size:', (req.file.size / 1024 / 1024).toFixed(2), 'MB');
    
    const result = await cloudinaryUpload(req.file.buffer, {
      resource_type: 'video',
      folder: 'instamarketing/videos'
    });
    
    if (result.success) {
      console.log('✅ Video uploaded:', result.url);
      res.json({
        success: true,
        url: result.url,
        publicId: result.publicId
      });
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
