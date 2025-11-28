const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const advancedVideoGenerator = require('../services/advancedVideoGenerator');
const videoEnhancer = require('../services/videoEnhancer');
const videoProcessor = require('../services/videoProcessor');

/**
 * @route   POST /api/video/generate
 * @desc    Generate AI video with optimized prompt and optional music/text
 * @access  Private
 */
router.post('/generate', auth, async (req, res) => {
  try {
    const {
      // Legacy parameters
      subject,
      action,
      shotType,
      style,
      cameraMovement,
      lighting,
      setting,
      mood,
      audioCues,
      customPrompt,
      negatives,
      template,
      // Generation options
      model,
      numFrames,
      numInferenceSteps,
      fps,
      guidanceScale,
      seed,
      // New parameters from CreateVideo page
      script,
      musicConfig,
      textConfig
    } = req.body;

    // Support both old (subject/customPrompt) and new (script) API
    const promptText = script || customPrompt || subject;
    
    if (!promptText) {
      return res.status(400).json({ error: 'Subject, script, or custom prompt is required' });
    }

    const promptOptions = {
      subject: subject || promptText,
      action,
      shotType,
      style,
      cameraMovement,
      lighting,
      setting,
      mood,
      audioCues,
      customPrompt: customPrompt || script,
      negatives: negatives || [],
      template
    };

    const generationOptions = {
      model: model || 'damo-text2video',
      numFrames: numFrames || 16,
      numInferenceSteps: numInferenceSteps || 50,
      fps: fps || 8,
      guidanceScale: guidanceScale || 7.5,
      seed
    };

    // Generate the base video
    const result = await advancedVideoGenerator.generateSingle(promptOptions, generationOptions);

    // If music or text config provided, process the video with them
    if ((musicConfig || textConfig) && result.url) {
      try {
        const overlays = [];
        
        // Add text overlay if provided
        if (textConfig) {
          // Add overlay text as a permanent subtitle
          if (textConfig.overlayText) {
            overlays.push({
              text: textConfig.overlayText,
              start: 0,
              end: 999 // Show throughout
            });
          }
          
          // Add timed captions
          if (textConfig.captions && textConfig.captions.length > 0) {
            overlays.push(...textConfig.captions);
          }
        }

        const processedResult = await videoProcessor.processVideo({
          videoUrl: result.url,
          voiceoverUrl: null,
          musicUrl: musicConfig?.trackUrl || null,
          overlays: overlays.length > 0 ? overlays : null
        });

        return res.json({
          success: true,
          url: processedResult,
          originalUrl: result.url,
          hasMusic: !!musicConfig,
          hasText: !!textConfig,
          predictionId: result.predictionId
        });
      } catch (processError) {
        console.error('Post-processing error:', processError);
        // Return original video if processing fails
        return res.json({
          success: true,
          ...result,
          processingError: processError.message
        });
      }
    }

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate video' });
  }
});

/**
 * @route   POST /api/video/generate-bracketed
 * @desc    Generate multiple video variations with seed bracketing
 * @access  Private
 */
router.post('/generate-bracketed', auth, async (req, res) => {
  try {
    const {
      subject,
      action,
      shotType,
      style,
      cameraMovement,
      lighting,
      setting,
      mood,
      audioCues,
      customPrompt,
      negatives,
      template,
      // Generation options
      numVariations,
      model,
      numFrames,
      numInferenceSteps,
      fps,
      guidanceScale
    } = req.body;

    if (!subject && !customPrompt) {
      return res.status(400).json({ error: 'Subject or custom prompt is required' });
    }

    const promptOptions = {
      subject,
      action,
      shotType,
      style,
      cameraMovement,
      lighting,
      setting,
      mood,
      audioCues,
      customPrompt,
      negatives: negatives || [],
      template
    };

    const generationOptions = {
      numVariations: numVariations || 3,
      model: model || 'damo-text2video',
      numFrames: numFrames || 16,
      numInferenceSteps: numInferenceSteps || 50,
      fps: fps || 8,
      guidanceScale: guidanceScale || 7.5
    };

    const result = await advancedVideoGenerator.generateWithBracketing(promptOptions, generationOptions);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Bracketed generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate videos' });
  }
});

/**
 * @route   GET /api/video/bracketing-status/:jobId
 * @desc    Check status of bracketed generation
 * @access  Private
 */
router.get('/bracketing-status/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = await advancedVideoGenerator.checkBracketingStatus(jobId);
    res.json(status);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/video/from-image
 * @desc    Generate video from image (Stable Video Diffusion)
 * @access  Private
 */
router.post('/from-image', auth, async (req, res) => {
  try {
    const { imageUrl, motionBucketId, fps, numFrames } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const result = await advancedVideoGenerator.generateFromImage(imageUrl, {
      motionBucketId,
      fps,
      numFrames
    });

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Image-to-video error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate video from image' });
  }
});

/**
 * @route   POST /api/video/build-prompt
 * @desc    Build optimized prompt without generating
 * @access  Private
 */
router.post('/build-prompt', auth, async (req, res) => {
  try {
    const prompt = advancedVideoGenerator.buildOptimizedPrompt(req.body);
    res.json({
      success: true,
      prompt
    });
  } catch (error) {
    console.error('Prompt build error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/video/suggestions/:contentType
 * @desc    Get prompt suggestions for content type
 * @access  Private
 */
router.get('/suggestions/:contentType', auth, async (req, res) => {
  try {
    const { contentType } = req.params;
    const suggestions = advancedVideoGenerator.getPromptSuggestions(contentType);
    res.json({
      success: true,
      contentType,
      suggestions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/video/enhance
 * @desc    Post-process and enhance video
 * @access  Private
 */
router.post('/enhance', auth, async (req, res) => {
  try {
    const {
      videoUrl,
      upscale,
      upscaleScale,
      interpolate,
      targetFps,
      denoise,
      denoiseStrength,
      temporalEnhance,
      colorGrade
    } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    // Start enhancement process
    const result = await videoEnhancer.fullPostProcessingPipeline(videoUrl, {
      upscale: upscale !== false,
      upscaleScale: upscaleScale || 2,
      interpolate: interpolate || false,
      targetFps: targetFps || 30,
      denoise: denoise !== false,
      denoiseStrength: denoiseStrength || 'medium',
      temporalEnhance: temporalEnhance !== false,
      colorGrade: colorGrade || null
    });

    res.json(result);

  } catch (error) {
    console.error('Enhancement error:', error);
    res.status(500).json({ error: error.message || 'Failed to enhance video' });
  }
});

/**
 * @route   POST /api/video/upscale
 * @desc    Upscale video only
 * @access  Private
 */
router.post('/upscale', auth, async (req, res) => {
  try {
    const { videoUrl, scale, faceEnhance } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    const result = await videoEnhancer.upscaleVideo(videoUrl, {
      scale: scale || 4,
      faceEnhance: faceEnhance !== false
    });

    res.json({
      success: true,
      output: result
    });

  } catch (error) {
    console.error('Upscale error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/video/interpolate
 * @desc    Interpolate frames for smoother video
 * @access  Private
 */
router.post('/interpolate', auth, async (req, res) => {
  try {
    const { videoUrl, targetFps } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    const result = await videoEnhancer.interpolateFrames(videoUrl, {
      targetFps: targetFps || 60
    });

    res.json({
      success: true,
      output: result
    });

  } catch (error) {
    console.error('Interpolation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/video/export-platform
 * @desc    Export video optimized for specific platform
 * @access  Private
 */
router.post('/export-platform', auth, async (req, res) => {
  try {
    const { inputPath, platform } = req.body;

    if (!inputPath) {
      return res.status(400).json({ error: 'Input path is required' });
    }

    const result = await videoEnhancer.exportForPlatform(inputPath, platform || 'instagram_reels');

    res.json({
      success: true,
      output: result
    });

  } catch (error) {
    console.error('Platform export error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/video/models
 * @desc    Get available video generation models
 * @access  Private
 */
router.get('/models', auth, async (req, res) => {
  const models = [
    {
      id: 'damo-text2video',
      name: 'DAMO Text-to-Video',
      description: 'Fast text-to-video generation with good quality',
      type: 'text-to-video',
      maxFrames: 16,
      quality: 'medium',
      speed: 'fast'
    },
    {
      id: 'stable-video-diffusion',
      name: 'Stable Video Diffusion',
      description: 'High quality image-to-video generation',
      type: 'image-to-video',
      maxFrames: 25,
      quality: 'high',
      speed: 'medium'
    }
  ];

  res.json({ models });
});

/**
 * @route   GET /api/video/presets
 * @desc    Get available style and setting presets
 * @access  Private
 */
router.get('/presets', auth, async (req, res) => {
  const presets = {
    shotTypes: [
      { id: 'extreme_close_up', name: 'Extreme Close-up', description: 'Very tight shot on details' },
      { id: 'close_up', name: 'Close-up', description: 'Captures expression and emotion' },
      { id: 'medium_close_up', name: 'Medium Close-up', description: 'From chest up' },
      { id: 'medium', name: 'Medium', description: 'From waist up' },
      { id: 'medium_wide', name: 'Medium Wide', description: 'Full body with environment' },
      { id: 'wide', name: 'Wide', description: 'Establishing scene' },
      { id: 'extreme_wide', name: 'Extreme Wide', description: 'Vast landscape view' },
      { id: 'aerial', name: 'Aerial', description: 'Drone shot from above' },
      { id: 'pov', name: 'POV', description: 'First-person perspective' },
      { id: 'low_angle', name: 'Low Angle', description: 'Looking up at subject' },
      { id: 'high_angle', name: 'High Angle', description: 'Looking down at subject' }
    ],
    styles: [
      { id: 'cinematic', name: 'Cinematic', description: 'Film-like quality with depth' },
      { id: 'commercial', name: 'Commercial', description: 'Polished, vibrant look' },
      { id: 'documentary', name: 'Documentary', description: 'Natural, authentic feel' },
      { id: 'artistic', name: 'Artistic', description: 'Creative, dramatic style' },
      { id: 'social', name: 'Social Media', description: 'High energy, engaging' },
      { id: 'minimal', name: 'Minimal', description: 'Clean, simple aesthetic' },
      { id: 'vintage', name: 'Vintage', description: 'Nostalgic film look' },
      { id: 'modern', name: 'Modern', description: 'Contemporary sleek style' },
      { id: 'dramatic', name: 'Dramatic', description: 'High contrast, moody' },
      { id: 'soft', name: 'Soft', description: 'Gentle, ethereal feel' }
    ],
    cameraMovements: [
      { id: 'static', name: 'Static', description: 'Locked camera' },
      { id: 'pan_left', name: 'Pan Left', description: 'Smooth horizontal left' },
      { id: 'pan_right', name: 'Pan Right', description: 'Smooth horizontal right' },
      { id: 'tilt_up', name: 'Tilt Up', description: 'Vertical up' },
      { id: 'tilt_down', name: 'Tilt Down', description: 'Vertical down' },
      { id: 'zoom_in', name: 'Zoom In', description: 'Slow zoom in' },
      { id: 'zoom_out', name: 'Zoom Out', description: 'Slow zoom out' },
      { id: 'dolly_in', name: 'Dolly In', description: 'Push toward subject' },
      { id: 'dolly_out', name: 'Dolly Out', description: 'Pull away from subject' },
      { id: 'tracking', name: 'Tracking', description: 'Follow subject' },
      { id: 'orbit', name: 'Orbit', description: 'Circle around subject' },
      { id: 'steadicam', name: 'Steadicam', description: 'Smooth flowing movement' },
      { id: 'handheld', name: 'Handheld', description: 'Organic subtle movement' }
    ],
    lighting: [
      { id: 'natural', name: 'Natural', description: 'Daylight' },
      { id: 'golden_hour', name: 'Golden Hour', description: 'Warm sunset light' },
      { id: 'blue_hour', name: 'Blue Hour', description: 'Cool ambient light' },
      { id: 'studio', name: 'Studio', description: 'Professional setup' },
      { id: 'soft', name: 'Soft', description: 'Diffused gentle light' },
      { id: 'dramatic', name: 'Dramatic', description: 'High contrast shadows' },
      { id: 'rim', name: 'Rim Light', description: 'Backlit silhouette' },
      { id: 'neon', name: 'Neon', description: 'Colorful artificial' }
    ],
    templates: [
      { id: 'product_showcase', name: 'Product Showcase', description: 'For product videos' },
      { id: 'lifestyle', name: 'Lifestyle', description: 'Daily life scenes' },
      { id: 'testimonial', name: 'Testimonial', description: 'Speaking to camera' },
      { id: 'tutorial', name: 'Tutorial', description: 'Educational content' },
      { id: 'cinematic', name: 'Cinematic', description: 'Film-style scenes' },
      { id: 'social_hook', name: 'Social Hook', description: 'Attention grabbing' }
    ],
    colorGrades: [
      { id: 'cinematic', name: 'Cinematic' },
      { id: 'warm', name: 'Warm' },
      { id: 'cool', name: 'Cool' },
      { id: 'vintage', name: 'Vintage' },
      { id: 'dramatic', name: 'Dramatic' },
      { id: 'vibrant', name: 'Vibrant' },
      { id: 'muted', name: 'Muted' },
      { id: 'noir', name: 'Noir' }
    ]
  };

  res.json(presets);
});

/**
 * @route   POST /api/video/finalize
 * @desc    Add audio and subtitles to video
 * @access  Private
 */
router.post('/finalize', auth, async (req, res) => {
  try {
    const { videoUrl, voiceoverUrl, musicUrl, overlays } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    const finalVideoUrl = await videoProcessor.processVideo({
      videoUrl,
      voiceoverUrl,
      musicUrl,
      overlays
    });

    res.json({
      success: true,
      url: finalVideoUrl
    });

  } catch (error) {
    console.error('Video finalization error:', error);
    res.status(500).json({ error: error.message || 'Failed to finalize video' });
  }
});

module.exports = router;
