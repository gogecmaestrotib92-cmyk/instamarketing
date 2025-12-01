const express = require('express');
const router = express.Router();
const openaiService = require('../services/openai');
const googleTTSService = require('../services/googleTTS');
const replicateService = require('../services/replicate');
const videoComposerService = require('../services/videoComposer');
const fetch = require('node-fetch');

// Import Cloudinary for uploading assets before Shotstack
let cloudinaryUpload = null;
let cloudinaryService = null;
try {
  cloudinaryService = require('../services/cloudinary');
  cloudinaryUpload = cloudinaryService.uploadBufferToCloudinary;
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
    console.log('   Subtitles count:', subtitles?.length || 0);
    console.log('   Subtitles received:', JSON.stringify(subtitles, null, 2));
    console.log('   Options:', JSON.stringify(options, null, 2));
    
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
 * Upload audio to Cloudinary for rendering
 * POST /api/ai/upload-audio
 */
const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

router.post('/upload-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    if (!cloudinaryUpload) {
      return res.status(503).json({ error: 'Cloudinary service not available' });
    }
    
    console.log('🎵 Uploading audio to Cloudinary...');
    console.log('   Size:', (req.file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('   Filename:', req.file.originalname);
    
    const result = await cloudinaryUpload(req.file.buffer, {
      resource_type: 'video', // Cloudinary uses 'video' for audio files too
      folder: 'instamarketing/audio'
    });
    
    if (result.success) {
      console.log('✅ Audio uploaded:', result.url);
      res.json({
        success: true,
        url: result.url,
        publicId: result.publicId
      });
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Transfer video from external URL to Cloudinary
 * POST /api/ai/transfer-to-cloudinary
 */
router.post('/transfer-to-cloudinary', async (req, res) => {
  try {
    const { videoUrl } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'videoUrl is required' });
    }
    
    if (!cloudinaryService) {
      return res.status(503).json({ error: 'Cloudinary service not available' });
    }
    
    // If already a Cloudinary URL, just return it
    if (videoUrl.includes('cloudinary.com')) {
      return res.json({ success: true, url: videoUrl });
    }
    
    console.log('📤 Transferring video to Cloudinary:', videoUrl);
    
    // Upload directly from URL using Cloudinary's upload API
    const result = await cloudinaryService.uploadToCloudinary(videoUrl, {
      resource_type: 'video',
      folder: 'instamarketing/videos'
    });
    
    if (result.success) {
      console.log('✅ Video transferred:', result.url);
      res.json({
        success: true,
        url: result.url,
        publicId: result.publicId
      });
    } else {
      throw new Error(result.error || 'Transfer failed');
    }
  } catch (error) {
    console.error('Video transfer error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Upload video to Cloudinary for rendering
 * POST /api/ai/upload-video
 */
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

// ==================== Cloudinary Video Render (Alternative to Shotstack) ====================

/**
 * Render video with text overlays and audio using Cloudinary transformations
 * This is a simpler alternative to Shotstack that uses Cloudinary's built-in video transformations
 * POST /api/ai/cloudinary/render
 */
router.post('/cloudinary/render', async (req, res) => {
  try {
    const { videoUrl, audioUrl, soundEffects, subtitles, options } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'videoUrl is required' });
    }
    
    if (!cloudinaryService) {
      return res.status(503).json({ error: 'Cloudinary service not available' });
    }
    
    console.log('🎬 Starting Cloudinary video render...');
    console.log('   Video:', videoUrl);
    console.log('   Audio:', audioUrl || 'none');
    console.log('   Sound effects:', soundEffects?.length || 0);
    console.log('   Subtitles count:', subtitles?.length || 0);
    console.log('   Options:', JSON.stringify(options));
    
    // Check if video is a Cloudinary URL - if not, auto-transfer it
    let finalVideoUrl = videoUrl;
    if (!videoUrl.includes('cloudinary.com')) {
      console.log('⚠️ Video is not on Cloudinary, transferring automatically...');
      try {
        const transferResult = await cloudinaryService.uploadToCloudinary(videoUrl, {
          resource_type: 'video',
          folder: 'instamarketing/videos'
        });
        
        if (transferResult.success && transferResult.url) {
          finalVideoUrl = transferResult.url;
          console.log('✅ Video auto-transferred:', finalVideoUrl);
        } else {
          return res.status(400).json({ 
            error: 'Failed to transfer video to Cloudinary: ' + (transferResult.error || 'Unknown error'),
            hint: 'Try uploading the video directly or use a different video source'
          });
        }
      } catch (transferError) {
        console.error('Auto-transfer failed:', transferError);
        return res.status(400).json({ 
          error: 'Video must be on Cloudinary for rendering. Auto-transfer failed: ' + transferError.message,
          hint: 'Try a different video or ensure the video URL is accessible'
        });
      }
    }
    
    // Extract audio public ID if audio URL is from Cloudinary
    let audioPublicId = null;
    console.log('🎵 Audio URL received:', audioUrl);
    
    if (audioUrl && audioUrl.includes('cloudinary.com')) {
      // Parse audio public ID from URL
      // URL format: https://res.cloudinary.com/{cloud}/video/upload/{version}/{public_id}.mp3
      const audioParts = audioUrl.split('/upload/');
      console.log('🎵 Audio URL parts:', audioParts);
      
      if (audioParts.length === 2) {
        const afterUpload = audioParts[1];
        const audioIdWithExt = afterUpload.replace(/^v\d+\//, '');
        audioPublicId = audioIdWithExt.replace(/\.[^/.]+$/, '');
        console.log('🎵 Extracted Audio Public ID:', audioPublicId);
      }
    } else if (audioUrl) {
      console.log('⚠️ Audio URL is not from Cloudinary, cannot include in render');
    }
    
    // Convert subtitles to text overlays format - include fontSize and offsets
    const textOverlays = (subtitles || []).map(sub => {
      console.log('📝 Text overlay received:', JSON.stringify(sub));
      return {
        text: sub.text,
        position: sub.position || 'bottom-center',
        fontSize: sub.fontSize || sub.style?.fontSize || 42,
        offsetX: sub.offsetX || 0,
        offsetY: sub.offsetY || 0,
        start: sub.start,
        end: sub.end
      };
    });
    
    console.log('📝 Final text overlays to render:', JSON.stringify(textOverlays));
    
    // Extract public IDs from sound effects
    const soundEffectIds = [];
    if (soundEffects && soundEffects.length > 0) {
      for (const effect of soundEffects) {
        if (effect.url && effect.url.includes('cloudinary.com')) {
          const effectParts = effect.url.split('/upload/');
          if (effectParts.length === 2) {
            const afterUpload = effectParts[1];
            const effectIdWithExt = afterUpload.replace(/^v\d+\//, '');
            const effectPublicId = effectIdWithExt.replace(/\.[^/.]+$/, '');
            soundEffectIds.push({
              publicId: effectPublicId,
              startTime: effect.startTime || 0,
              name: effect.name
            });
            console.log('🔊 Sound effect:', effect.name, 'Public ID:', effectPublicId, 'Start:', effect.startTime);
          }
        }
      }
    }
    
    // Build options for the transformation
    const transformOptions = {
      audioPublicId,
      musicVolume: options?.musicVolume || 1,
      soundEffects: soundEffectIds
    };
    
    // If we have sound effects, use Shotstack for proper audio mixing
    // Cloudinary URL transformations don't properly mix multiple audio tracks
    if (soundEffectIds.length > 0 && shotstackClient) {
      console.log('🔊 Using Shotstack for audio mixing (sound effects detected)...');
      
      try {
        // Build sound effects data for Shotstack
        const soundEffectsForShotstack = soundEffects.map(effect => ({
          url: effect.url,
          startTime: effect.startTime || 0,
          name: effect.name
        }));
        
        // Create Shotstack render with sound effects
        const shotstackResult = await shotstackClient.createShotstackRender(
          finalVideoUrl,
          audioUrl, // Music track (if any)
          subtitles || [],
          {
            duration: options?.duration || 10,
            musicVolume: options?.musicVolume || 1,
            videoVolume: options?.videoVolume || 0,
            soundEffects: soundEffectsForShotstack
          }
        );
        
        if (shotstackResult.success && shotstackResult.jobId) {
          console.log('🔊 Shotstack job submitted:', shotstackResult.jobId);
          
          // Poll for completion
          const pollResult = await shotstackClient.pollRenderStatus(shotstackResult.jobId, 120);
          
          if (pollResult.success && pollResult.url) {
            res.json({
              success: true,
              url: pollResult.url,
              status: 'done',
              message: `Video ready with ${soundEffectsForShotstack.length} sound effect(s)` + (audioUrl ? ' and music' : '')
            });
            return;
          } else {
            console.warn('Shotstack render failed:', pollResult.error);
            // Fall through to Cloudinary
          }
        }
      } catch (shotstackErr) {
        console.warn('Shotstack error, falling back to Cloudinary:', shotstackErr.message);
        // Fall through to Cloudinary
      }
    }
    
    // Generate the video URL with text overlays and audio (fallback/no sound effects)
    const resultUrl = cloudinaryService.generateVideoWithTextOverlay(finalVideoUrl, textOverlays, transformOptions);
    
    // Build response message
    let message = 'Video ready';
    if (audioPublicId) message += ' with music';
    if (soundEffectIds.length > 0) message += ` (sound effects may not be audible - Cloudinary limitation)`;
    if (subtitles?.length > 0) message += ' with text overlay';
    
    // Return immediately with the transformed URL
    res.json({
      success: true,
      url: resultUrl,
      status: 'done',
      message
    });
  } catch (error) {
    console.error('Cloudinary render error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create a pre-rendered video with text overlays using Cloudinary eager transformations
 * This actually processes and creates a new video file
 * POST /api/ai/cloudinary/render-eager
 */
router.post('/cloudinary/render-eager', async (req, res) => {
  try {
    const { videoUrl, subtitles, options } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'videoUrl is required' });
    }
    
    if (!cloudinaryService) {
      return res.status(503).json({ error: 'Cloudinary service not available' });
    }
    
    console.log('🎬 Starting Cloudinary eager video render...');
    console.log('   Video:', videoUrl);
    console.log('   Subtitles count:', subtitles?.length || 0);
    
    // Extract public ID from the Cloudinary URL
    if (!videoUrl.includes('cloudinary.com')) {
      return res.status(400).json({ 
        error: 'Video must be a Cloudinary URL' 
      });
    }
    
    // Parse public ID
    const urlParts = videoUrl.split('/upload/');
    if (urlParts.length !== 2) {
      return res.status(400).json({ error: 'Invalid Cloudinary URL format' });
    }
    
    const afterUpload = urlParts[1];
    const publicIdWithExt = afterUpload.replace(/^v\d+\//, '');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
    
    // Convert subtitles to text overlays
    const textOverlays = (subtitles || []).map(sub => ({
      text: sub.text,
      position: sub.position || 'bottom'
    }));
    
    if (textOverlays.length === 0) {
      return res.json({
        success: true,
        url: videoUrl,
        message: 'No text overlays to add'
      });
    }
    
    // Create video with eager transformation
    const result = await cloudinaryService.createVideoWithTextOverlay(publicId, textOverlays);
    
    if (result.success) {
      res.json({
        success: true,
        url: result.url,
        publicId: result.publicId,
        message: 'Video rendered with text overlays'
      });
    } else {
      throw new Error(result.error || 'Render failed');
    }
  } catch (error) {
    console.error('Cloudinary eager render error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== AI Auto-pilot Routes ====================

// In-memory storage for autopilot state (would be in database in production)
const autopilotState = {
  reels: {
    active: false,
    settings: null,
    queue: [],
    history: []
  },
  post: {
    active: false,
    settings: null,
    queue: [],
    history: []
  }
};

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to get next scheduled time based on settings
const getNextScheduledTime = (settings, existingTimes = []) => {
  const now = new Date();
  const preferredTimes = settings.preferredTimes || ['12:00'];
  
  // Find the next available time slot
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    
    for (const time of preferredTimes) {
      const [hours, minutes] = time.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      
      // Skip if this time is in the past or already scheduled
      if (date > now && !existingTimes.includes(date.toISOString())) {
        return date.toISOString();
      }
    }
  }
  
  // Default: schedule for tomorrow at noon
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);
  return tomorrow.toISOString();
};

// ==================== Reels Auto-pilot ====================

/**
 * Get Reels auto-pilot status
 * GET /api/ai/autopilot/reels/status
 */
router.get('/autopilot/reels/status', (req, res) => {
  res.json({
    active: autopilotState.reels.active,
    settings: autopilotState.reels.settings
  });
});

/**
 * Start Reels auto-pilot
 * POST /api/ai/autopilot/reels/start
 */
router.post('/autopilot/reels/start', (req, res) => {
  const { settings } = req.body;
  autopilotState.reels.active = true;
  autopilotState.reels.settings = settings;
  
  console.log('🚀 Reels Auto-pilot started with settings:', settings);
  
  res.json({
    success: true,
    message: 'Reels auto-pilot started',
    active: true
  });
});

/**
 * Stop Reels auto-pilot
 * POST /api/ai/autopilot/reels/stop
 */
router.post('/autopilot/reels/stop', (req, res) => {
  autopilotState.reels.active = false;
  
  console.log('⏹️ Reels Auto-pilot stopped');
  
  res.json({
    success: true,
    message: 'Reels auto-pilot stopped',
    active: false
  });
});

/**
 * Get Reels queue
 * GET /api/ai/autopilot/reels/queue
 */
router.get('/autopilot/reels/queue', (req, res) => {
  res.json({
    queue: autopilotState.reels.queue
  });
});

/**
 * Get Reels history
 * GET /api/ai/autopilot/reels/history
 */
router.get('/autopilot/reels/history', (req, res) => {
  res.json({
    history: autopilotState.reels.history
  });
});

/**
 * Generate a new reel for the queue
 * POST /api/ai/autopilot/reels/generate
 */
router.post('/autopilot/reels/generate', async (req, res) => {
  try {
    const { settings } = req.body;
    
    console.log('🎬 Generating new reel with settings:', settings);
    
    // Generate content based on niche
    const niche = settings?.niche || 'motivational';
    const style = settings?.style || 'cinematic';
    
    // Step 1: Generate caption/script with AI
    let caption = '';
    let hashtags = settings?.hashtags || '#viral #trending';
    
    try {
      const captionResult = await openaiService.generateCaption(niche, {
        tone: 'inspiring',
        includeEmojis: true,
        includeHashtags: false
      });
      if (captionResult.success) {
        caption = captionResult.caption;
      }
    } catch (e) {
      caption = `Amazing ${niche} content coming your way! ✨`;
    }
    
    // Step 2: Generate video prompt
    let videoPrompt = `${niche} content, ${style} style, vertical video, Instagram Reels format, high quality`;
    
    try {
      const promptResult = await openaiService.generateVideoPrompt(niche, style);
      if (promptResult.success) {
        videoPrompt = promptResult.prompt;
      }
    } catch (e) {
      console.log('Using default video prompt');
    }
    
    // Step 3: Start video generation
    let videoUrl = null;
    let predictionId = null;
    
    try {
      const videoResult = await replicateService.startTextToVideo(videoPrompt, {
        numFrames: 16,
        fps: 8,
        steps: 25
      });
      
      if (videoResult.success) {
        predictionId = videoResult.predictionId;
        
        // Poll for completion (simplified - in production would use webhooks)
        let attempts = 0;
        while (attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const status = await replicateService.getPredictionStatus(predictionId);
          
          if (status.status === 'succeeded' && status.output) {
            videoUrl = Array.isArray(status.output) ? status.output[0] : status.output;
            break;
          } else if (status.status === 'failed') {
            throw new Error('Video generation failed');
          }
          attempts++;
        }
      }
    } catch (e) {
      console.error('Video generation error:', e.message);
      // Use a placeholder video URL for demo purposes
      videoUrl = 'https://res.cloudinary.com/demo/video/upload/dog.mp4';
    }
    
    // Get existing scheduled times to avoid conflicts
    const existingTimes = autopilotState.reels.queue.map(v => v.scheduledAt);
    
    // Create the queue item
    const video = {
      id: generateId(),
      videoUrl: videoUrl || 'https://res.cloudinary.com/demo/video/upload/dog.mp4',
      caption,
      hashtags,
      status: settings?.autoApprove ? 'approved' : 'pending',
      scheduledAt: getNextScheduledTime(settings || {}, existingTimes),
      createdAt: new Date().toISOString(),
      settings: {
        niche,
        style,
        videoPrompt
      }
    };
    
    // Add to queue
    autopilotState.reels.queue.unshift(video);
    
    console.log('✅ Reel generated and added to queue:', video.id);
    
    res.json({
      success: true,
      video
    });
  } catch (error) {
    console.error('Generate reel error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Approve a video in the queue
 * POST /api/ai/autopilot/reels/queue/:id/approve
 */
router.post('/autopilot/reels/queue/:id/approve', (req, res) => {
  const { id } = req.params;
  const video = autopilotState.reels.queue.find(v => v.id === id);
  
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }
  
  video.status = 'approved';
  
  res.json({ success: true, video });
});

/**
 * Delete a video from the queue
 * DELETE /api/ai/autopilot/reels/queue/:id
 */
router.delete('/autopilot/reels/queue/:id', (req, res) => {
  const { id } = req.params;
  const index = autopilotState.reels.queue.findIndex(v => v.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Video not found' });
  }
  
  autopilotState.reels.queue.splice(index, 1);
  
  res.json({ success: true });
});

/**
 * Post a video now
 * POST /api/ai/autopilot/reels/queue/:id/post
 */
router.post('/autopilot/reels/queue/:id/post', async (req, res) => {
  try {
    const { id } = req.params;
    const videoIndex = autopilotState.reels.queue.findIndex(v => v.id === id);
    
    if (videoIndex === -1) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const video = autopilotState.reels.queue[videoIndex];
    
    // TODO: Actually post to Instagram via API
    // For now, just move to history
    console.log('📤 Posting video to Instagram:', video.id);
    
    // Move to history
    video.postedAt = new Date().toISOString();
    autopilotState.reels.history.unshift(video);
    autopilotState.reels.queue.splice(videoIndex, 1);
    
    res.json({ 
      success: true, 
      message: 'Video posted successfully',
      video
    });
  } catch (error) {
    console.error('Post video error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update video caption
 * PATCH /api/ai/autopilot/reels/queue/:id
 */
router.patch('/autopilot/reels/queue/:id', (req, res) => {
  const { id } = req.params;
  const { caption, hashtags } = req.body;
  
  const video = autopilotState.reels.queue.find(v => v.id === id);
  
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }
  
  if (caption !== undefined) video.caption = caption;
  if (hashtags !== undefined) video.hashtags = hashtags;
  
  res.json({ success: true, video });
});

// ==================== Post Auto-pilot ====================

/**
 * Get Post auto-pilot status
 * GET /api/ai/autopilot/post/status
 */
router.get('/autopilot/post/status', (req, res) => {
  res.json({
    active: autopilotState.post.active,
    settings: autopilotState.post.settings
  });
});

/**
 * Start Post auto-pilot
 * POST /api/ai/autopilot/post/start
 */
router.post('/autopilot/post/start', (req, res) => {
  const { settings } = req.body;
  autopilotState.post.active = true;
  autopilotState.post.settings = settings;
  
  console.log('🚀 Post Auto-pilot started with settings:', settings);
  
  res.json({
    success: true,
    message: 'Post auto-pilot started',
    active: true
  });
});

/**
 * Stop Post auto-pilot
 * POST /api/ai/autopilot/post/stop
 */
router.post('/autopilot/post/stop', (req, res) => {
  autopilotState.post.active = false;
  
  console.log('⏹️ Post Auto-pilot stopped');
  
  res.json({
    success: true,
    message: 'Post auto-pilot stopped',
    active: false
  });
});

/**
 * Get Post queue
 * GET /api/ai/autopilot/post/queue
 */
router.get('/autopilot/post/queue', (req, res) => {
  res.json({
    queue: autopilotState.post.queue
  });
});

/**
 * Get Post history
 * GET /api/ai/autopilot/post/history
 */
router.get('/autopilot/post/history', (req, res) => {
  res.json({
    history: autopilotState.post.history
  });
});

/**
 * Generate a new post for the queue
 * POST /api/ai/autopilot/post/generate
 */
router.post('/autopilot/post/generate', async (req, res) => {
  try {
    const { settings } = req.body;
    
    console.log('🖼️ Generating new post with settings:', settings);
    
    const niche = settings?.niche || 'motivational';
    const style = settings?.style || 'aesthetic';
    
    // Generate caption with AI
    let caption = '';
    let hashtags = settings?.hashtags || '#viral #trending';
    
    try {
      const captionResult = await openaiService.generateCaption(niche, {
        tone: settings?.captionStyle || 'engaging',
        includeEmojis: true,
        includeHashtags: false
      });
      if (captionResult.success) {
        caption = captionResult.caption;
      }
    } catch (e) {
      caption = `Check out this amazing ${niche} content! ✨`;
    }
    
    // TODO: Generate image with AI (DALL-E or Stable Diffusion)
    // For now, use a placeholder
    const imageUrl = `https://source.unsplash.com/1080x1080/?${niche},${style}`;
    
    // Get existing scheduled times
    const existingTimes = autopilotState.post.queue.map(p => p.scheduledAt);
    
    // Create the post
    const post = {
      id: generateId(),
      imageUrl,
      caption,
      hashtags,
      status: settings?.autoApprove ? 'approved' : 'pending',
      scheduledAt: getNextScheduledTime(settings || {}, existingTimes),
      createdAt: new Date().toISOString(),
      settings: {
        niche,
        style
      }
    };
    
    // Add to queue
    autopilotState.post.queue.unshift(post);
    
    console.log('✅ Post generated and added to queue:', post.id);
    
    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Generate post error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Approve a post in the queue
 * POST /api/ai/autopilot/post/queue/:id/approve
 */
router.post('/autopilot/post/queue/:id/approve', (req, res) => {
  const { id } = req.params;
  const post = autopilotState.post.queue.find(p => p.id === id);
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  post.status = 'approved';
  
  res.json({ success: true, post });
});

/**
 * Delete a post from the queue
 * DELETE /api/ai/autopilot/post/queue/:id
 */
router.delete('/autopilot/post/queue/:id', (req, res) => {
  const { id } = req.params;
  const index = autopilotState.post.queue.findIndex(p => p.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  autopilotState.post.queue.splice(index, 1);
  
  res.json({ success: true });
});

/**
 * Post now
 * POST /api/ai/autopilot/post/queue/:id/post
 */
router.post('/autopilot/post/queue/:id/post', async (req, res) => {
  try {
    const { id } = req.params;
    const postIndex = autopilotState.post.queue.findIndex(p => p.id === id);
    
    if (postIndex === -1) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const post = autopilotState.post.queue[postIndex];
    
    // TODO: Actually post to Instagram via API
    console.log('📤 Posting image to Instagram:', post.id);
    
    // Move to history
    post.postedAt = new Date().toISOString();
    autopilotState.post.history.unshift(post);
    autopilotState.post.queue.splice(postIndex, 1);
    
    res.json({ 
      success: true, 
      message: 'Post published successfully',
      post
    });
  } catch (error) {
    console.error('Post error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update post caption
 * PATCH /api/ai/autopilot/post/queue/:id
 */
router.patch('/autopilot/post/queue/:id', (req, res) => {
  const { id } = req.params;
  const { caption, hashtags } = req.body;
  
  const post = autopilotState.post.queue.find(p => p.id === id);
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  if (caption !== undefined) post.caption = caption;
  if (hashtags !== undefined) post.hashtags = hashtags;
  
  res.json({ success: true, post });
});

module.exports = router;
