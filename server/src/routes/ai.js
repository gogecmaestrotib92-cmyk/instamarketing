const express = require('express');
const router = express.Router();
const openaiService = require('../services/openai');
const googleTTSService = require('../services/googleTTS');
const elevenlabsService = require('../services/elevenlabs');
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

// ==================== ElevenLabs TTS Routes ====================

/**
 * Get ElevenLabs service status
 * GET /api/ai/elevenlabs/status
 */
router.get('/elevenlabs/status', async (req, res) => {
  try {
    const isAvailable = elevenlabsService.isAvailable();
    if (!isAvailable) {
      return res.json({ 
        available: false, 
        message: 'ElevenLabs API key not configured. Add ELEVENLABS_API_KEY to your environment.' 
      });
    }
    
    const subscription = await elevenlabsService.getSubscriptionInfo();
    res.json({ 
      available: true,
      subscription: subscription.success ? subscription.subscription : null
    });
  } catch (error) {
    console.error('ElevenLabs status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get available ElevenLabs voices
 * GET /api/ai/elevenlabs/voices
 */
router.get('/elevenlabs/voices', async (req, res) => {
  try {
    if (!elevenlabsService.isAvailable()) {
      // Return recommended voices even without API key (for UI)
      const recommended = elevenlabsService.getRecommendedVoices();
      return res.json({ 
        success: true, 
        voices: recommended,
        source: 'recommended'
      });
    }
    
    const result = await elevenlabsService.getVoices();
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    res.json({ success: true, voices: result.voices, source: 'api' });
  } catch (error) {
    console.error('ElevenLabs voices error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get recommended voices for autopilot
 * GET /api/ai/elevenlabs/voices/recommended
 */
router.get('/elevenlabs/voices/recommended', (req, res) => {
  const voices = elevenlabsService.getRecommendedVoices();
  res.json({ success: true, voices });
});

/**
 * ElevenLabs Text to Speech
 * POST /api/ai/elevenlabs/tts
 */
router.post('/elevenlabs/tts', async (req, res) => {
  try {
    const { text, voiceId, stability, similarityBoost, style } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!elevenlabsService.isAvailable()) {
      return res.status(503).json({ error: 'ElevenLabs service not available. Configure ELEVENLABS_API_KEY.' });
    }

    const result = await elevenlabsService.textToSpeech(text, {
      voiceId,
      stability,
      similarityBoost,
      style
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      audioUrl: result.audioUrl,
      voiceId: result.voiceId,
      model: result.model
    });
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate voiceover with style presets (ElevenLabs)
 * POST /api/ai/elevenlabs/voiceover
 */
router.post('/elevenlabs/voiceover', async (req, res) => {
  try {
    const { script, style, voiceId } = req.body;

    if (!script) {
      return res.status(400).json({ error: 'Script is required' });
    }

    if (!elevenlabsService.isAvailable()) {
      return res.status(503).json({ error: 'ElevenLabs service not available. Configure ELEVENLABS_API_KEY.' });
    }

    let result;
    if (voiceId) {
      // Use specific voice
      result = await elevenlabsService.textToSpeech(script, { voiceId });
    } else {
      // Use style preset
      result = await elevenlabsService.generateVoiceover(script, style || 'energetic');
    }

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      audioUrl: result.audioUrl,
      voiceId: result.voiceId
    });
  } catch (error) {
    console.error('ElevenLabs voiceover error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Full workflow: Generate script + ElevenLabs voiceover
 * POST /api/ai/elevenlabs/full-voiceover
 */
router.post('/elevenlabs/full-voiceover', async (req, res) => {
  try {
    const { topic, duration, voiceStyle, voiceId } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    if (!elevenlabsService.isAvailable()) {
      return res.status(503).json({ error: 'ElevenLabs service not available. Configure ELEVENLABS_API_KEY.' });
    }

    // Step 1: Generate script
    const scriptResult = await openaiService.generateReelScript(topic, duration || 30);
    if (!scriptResult.success) {
      return res.status(500).json({ error: 'Failed to generate script: ' + scriptResult.error });
    }

    // Step 2: Generate voiceover with ElevenLabs
    let voiceResult;
    if (voiceId) {
      voiceResult = await elevenlabsService.textToSpeech(scriptResult.script, { voiceId });
    } else {
      voiceResult = await elevenlabsService.generateVoiceover(scriptResult.script, voiceStyle || 'energetic');
    }
    
    if (!voiceResult.success) {
      return res.status(500).json({ error: 'Failed to generate voiceover: ' + voiceResult.error });
    }

    res.json({
      success: true,
      script: scriptResult.script,
      audioUrl: voiceResult.audioUrl,
      voiceId: voiceResult.voiceId
    });
  } catch (error) {
    console.error('ElevenLabs full voiceover error:', error);
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

// ==================== Image Generation Routes ====================

/**
 * Industry-specific visual style keywords based on professional photography standards
 */
const INDUSTRY_VISUAL_STYLES = {
  'E-Commerce / Retail': {
    lighting: 'bright studio lighting, soft shadows, product photography lighting setup',
    composition: 'clean white background, centered product, negative space for text',
    style: 'commercial product photography, lifestyle context, aspirational',
    colors: 'vibrant saturated colors, clean whites, brand color accents'
  },
  'Food & Beverage': {
    lighting: 'warm natural light, side lighting for texture, food photography lighting',
    composition: 'overhead flat lay, 45-degree angle, close-up macro details',
    style: 'appetizing food styling, steam/freshness, garnish details',
    colors: 'warm color palette, rich earth tones, fresh greens'
  },
  'Fashion & Beauty': {
    lighting: 'soft diffused beauty lighting, rim light, editorial lighting',
    composition: 'editorial style, rule of thirds, dynamic poses',
    style: 'high fashion editorial, beauty campaign, luxury aesthetic',
    colors: 'skin tones accurate, rich textures, metallic accents'
  },
  'Health & Fitness': {
    lighting: 'high contrast dramatic lighting, gym environment, natural outdoor light',
    composition: 'action shots, dynamic movement, motivational',
    style: 'athletic lifestyle, energetic, powerful poses',
    colors: 'high contrast, neon accents, clean minimal backgrounds'
  },
  'Technology': {
    lighting: 'clean modern lighting, subtle gradients, tech showcase lighting',
    composition: 'minimal composition, device focus, floating elements',
    style: 'futuristic, sleek modern, innovation focused',
    colors: 'blue tones, gradients, dark mode aesthetic, neon accents'
  },
  'Real Estate': {
    lighting: 'golden hour exterior, bright interior natural light, HDR style',
    composition: 'wide angle, leading lines, architectural symmetry',
    style: 'architectural photography, interior design magazine, luxury living',
    colors: 'warm inviting tones, natural materials, sky blue accents'
  },
  'Travel & Hospitality': {
    lighting: 'golden hour, blue hour, natural dramatic lighting',
    composition: 'landscape panoramic, point of view, establishing shots',
    style: 'wanderlust aesthetic, experiential, discovery moments',
    colors: 'vibrant saturated, natural palette, sunset/sunrise tones'
  },
  'Professional Services': {
    lighting: 'corporate office lighting, clean professional lighting',
    composition: 'business environment, handshake moments, team collaboration',
    style: 'corporate professional, trustworthy, approachable',
    colors: 'navy blue, white, subtle brand colors, clean backgrounds'
  },
  'default': {
    lighting: 'professional studio lighting, soft natural light',
    composition: 'balanced composition, clear focal point',
    style: 'commercial quality, professional, polished',
    colors: 'harmonious color palette, brand-aligned'
  }
};

/**
 * Enhance prompt using AI for better image generation accuracy
 * Uses OpenAI to add professional photography terms and visual details
 */
async function enhanceImagePrompt(basePrompt, options = {}) {
  const { industry, postType, brandColors, style } = options;
  
  // Get industry-specific visual guidance
  const industryStyle = INDUSTRY_VISUAL_STYLES[industry] || INDUSTRY_VISUAL_STYLES['default'];
  
  try {
    const OpenAI = require('openai');
    const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const enhanceRequest = `You are an expert at writing prompts for AI image generators like Flux and Midjourney.

Take this basic prompt and enhance it with specific, concrete visual details that will produce a high-quality, professional image.

BASIC PROMPT: "${basePrompt}"

CONTEXT:
- Industry: ${industry || 'general business'}
- Post Type: ${postType || 'promotional'}
- Brand Colors: ${brandColors || 'not specified'}
- Style: ${style || 'professional'}

INDUSTRY-SPECIFIC VISUAL GUIDANCE:
- Lighting: ${industryStyle.lighting}
- Composition: ${industryStyle.composition}
- Style: ${industryStyle.style}
- Colors: ${industryStyle.colors}

RULES FOR ENHANCED PROMPT:
1. Incorporate the industry-specific guidance above naturally
2. Add specific lighting terms that match the industry
3. Add camera/lens details (shallow depth of field, 85mm portrait, wide angle, macro, etc.)
4. Add composition terms that work for the content
5. Add texture/material details when relevant
6. Be SPECIFIC and CONCRETE - describe exactly what should be visible
7. Include the brand colors if specified: ${brandColors || 'use industry-appropriate colors'}
8. Add quality modifiers: 8k, ultra detailed, professional photography, commercial quality
9. Keep total length under 200 words
10. NEVER include any text, words, letters, numbers, or logos in the image description

Return ONLY the enhanced prompt, nothing else.`;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: enhanceRequest }],
      temperature: 0.7,
      max_tokens: 350
    });

    const enhancedPrompt = response.choices[0].message.content.trim();
    console.log('✨ Enhanced prompt:', enhancedPrompt);
    return enhancedPrompt;
    
  } catch (error) {
    console.error('Prompt enhancement failed, using original:', error.message);
    // Fallback: at least add basic quality modifiers
    return `${basePrompt}. ${industryStyle.lighting}, ${industryStyle.style}. Professional photography, 8k, ultra detailed, commercial quality.`;
  }
}

/**
 * Generate image from text prompt using Flux Schnell
 * Optionally uses reference image for style guidance
 * POST /api/ai/image/generate
 */
router.post('/image/generate', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', numOutputs = 1, outputFormat = 'webp', outputQuality = 90, referenceImage, enhancePrompt = true, industry, postType, brandColors, style } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Enhance prompt with AI for better accuracy
    let finalPrompt = prompt;
    if (enhancePrompt) {
      console.log('🧠 Enhancing prompt with AI...');
      finalPrompt = await enhanceImagePrompt(prompt, { industry, postType, brandColors, style });
    }

    console.log('🖼️ Generating image with Flux Schnell...');
    console.log('Original Prompt:', prompt);
    console.log('Final Prompt:', finalPrompt);
    console.log('Aspect Ratio:', aspectRatio);
    if (referenceImage) {
      console.log('Reference Image:', referenceImage);
    }

    const result = await replicateService.textToImage(finalPrompt, {
      aspectRatio,
      numOutputs,
      outputFormat,
      outputQuality,
      referenceImage
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      imageUrl: result.imageUrl,
      allImages: result.allImages,
      predictionId: result.predictionId,
      enhancedPrompt: finalPrompt
    });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start async image generation
 * POST /api/ai/image/generate/async
 */
router.post('/image/generate/async', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', numOutputs = 1, outputFormat = 'webp', outputQuality = 90 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('🖼️ Starting async image generation with Flux Schnell...');

    const result = await replicateService.startTextToImage(prompt, {
      aspectRatio,
      numOutputs,
      outputFormat,
      outputQuality
    });

    res.json(result);
  } catch (error) {
    console.error('Async image generation error:', error);
    res.status(500).json({ error: error.message });
  }
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
    
    // Convert subtitles to text overlays format - include fontSize, offsets, and style
    const textOverlays = (subtitles || []).map(sub => {
      console.log('📝 Text overlay received:', JSON.stringify(sub));
      return {
        text: sub.text,
        position: sub.position || 'bottom-center',
        fontSize: sub.fontSize || sub.style?.fontSize || 42,
        offsetX: sub.offsetX || 0,
        offsetY: sub.offsetY || 0,
        start: sub.start,
        end: sub.end,
        style: sub.style || 'tiktok' // Pass the style ID
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
    
    // Convert subtitles to text overlays - PRESERVE start/end timing for timed captions
    const textOverlays = (subtitles || []).map(sub => ({
      text: sub.text,
      position: sub.position || 'bottom-center',
      start: sub.start,
      end: sub.end,
      fontSize: sub.fontSize || 42,
      style: sub.style || 'tiktok'
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
    history: [],
    // Background jobs that continue even when user leaves page
    backgroundJobs: []
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
 * Generate a new reel for the queue - FULL VIRAL PIPELINE
 * POST /api/ai/autopilot/reels/generate
 * Pipeline: AI Script → AI Video → ElevenLabs Voiceover → Music → Text → Shotstack Render
 */
router.post('/autopilot/reels/generate', async (req, res) => {
  try {
    const { settings } = req.body;
    
    console.log('🎬 [AUTOPILOT] Starting full viral video pipeline...');
    console.log('📋 Settings:', JSON.stringify(settings, null, 2));
    
    // Extract business identity settings
    const businessName = settings?.businessName || '';
    const businessType = settings?.businessType || 'personal_brand';
    const targetAudience = settings?.targetAudience || '';
    const brandTone = settings?.brandTone || 'professional';
    const callToAction = settings?.callToAction || 'Follow for more!';
    
    // Extract content settings
    const niche = settings?.niche || 'motivational';
    const style = settings?.style || 'cinematic';
    const contentGoal = settings?.contentGoal || 'engagement';
    const hookStyle = settings?.hookStyle || 'question';
    const topics = settings?.topics || '';
    
    // Extract caption settings  
    const captionStyle = settings?.captionStyle || 'short';
    const includeEmojis = settings?.includeEmojis !== false;
    const includeCTA = settings?.includeCTA !== false;
    
    // Extract audio/visual settings
    const voiceoverSettings = settings?.voiceover || { enabled: true, voiceId: '21m00Tcm4TlvDq8ikWAM' };
    const musicSettings = settings?.music || { enabled: true, mood: 'upbeat' };
    const textSettings = settings?.textOverlay || { enabled: true, style: 'chunk', position: 'bottom' };
    
    // ==================== STEP 1: Generate Viral Script ====================
    console.log('📝 Step 1: Generating viral script...');
    let script = '';
    let caption = '';
    let hashtags = settings?.hashtags || '#viral #trending #reels';
    
    try {
      // Build context for better script generation
      const scriptContext = {
        niche,
        businessName,
        businessType,
        targetAudience,
        brandTone,
        hookStyle,
        contentGoal,
        topics: topics ? topics.split('\n').filter(t => t.trim()) : []
      };
      
      // Generate a short script optimized for 9-second video (~22 words max)
      const scriptResult = await openaiService.generateReelScript(niche, 9, scriptContext);
      if (scriptResult.success) {
        script = scriptResult.script;
      }
    } catch (e) {
      console.log('Script generation fallback:', e.message);
    }
    
    // Fallback script based on hook style (optimized for 9 seconds)
    if (!script) {
      const hookTemplates = {
        question: `Did you know this about ${niche}? Most people get this wrong. Here's the truth.`,
        statistic: `90% of people fail at ${niche}. Here's how to be in the top 10%.`,
        bold_claim: `This ${niche} secret changed everything. You need to hear this.`,
        story: `I discovered something about ${niche} that blew my mind. Let me share it.`,
        problem: `Struggling with ${niche}? Here's the solution no one talks about.`,
        curiosity: `What if I told you ${niche} is not what you think? Watch this.`,
        stop_scroll: `Stop scrolling. This ${niche} tip will change your life.`,
        secret: `The hidden truth about ${niche} that experts won't tell you.`
      };
      script = hookTemplates[hookStyle] || hookTemplates.question;
    }
    
    // Generate caption with business context
    try {
      const captionOptions = {
        tone: brandTone,
        includeEmojis,
        includeHashtags: false,
        captionStyle,
        businessName,
        callToAction: includeCTA ? callToAction : ''
      };
      
      const captionResult = await openaiService.generateCaption(niche, captionOptions);
      if (captionResult.success) {
        caption = captionResult.caption;
        if (includeCTA && callToAction && !caption.includes(callToAction)) {
          caption += `\n\n${callToAction}`;
        }
      }
    } catch (e) {
      caption = includeEmojis 
        ? `🔥 ${businessName ? businessName + ' - ' : ''}Amazing ${niche} content! ${includeCTA ? callToAction : ''} ✨`
        : `${businessName ? businessName + ' - ' : ''}Amazing ${niche} content! ${includeCTA ? callToAction : ''}`;
    }
    
    console.log('✅ Script:', script.substring(0, 80) + '...');
    
    // ==================== STEP 2: Generate AI Video ====================
    console.log('🎥 Step 2: Generating AI video with Replicate...');
    let rawVideoUrl = null;
    
    let videoPrompt = `${niche} content, ${style} style, vertical 9:16, Instagram Reels, cinematic, high quality`;
    try {
      const promptResult = await openaiService.generateVideoPrompt(niche, style);
      if (promptResult.success) {
        videoPrompt = promptResult.prompt;
      }
    } catch (e) {}
    
    try {
      const videoResult = await replicateService.startTextToVideo(videoPrompt, {
        aspectRatio: '9:16',
        duration: 9 // Luma Ray Flash 2 max duration
      });
      
      if (videoResult.success) {
        console.log('⏳ Waiting for video generation (this may take 1-3 minutes)...');
        let attempts = 0;
        while (attempts < 90) { // 90 * 3 = 270 seconds = 4.5 minutes max
          await new Promise(resolve => setTimeout(resolve, 3000));
          const status = await replicateService.getPredictionStatus(videoResult.predictionId);
          
          console.log(`   Attempt ${attempts + 1}: ${status.status}`);
          
          if (status.status === 'succeeded' && status.output) {
            rawVideoUrl = Array.isArray(status.output) ? status.output[0] : status.output;
            console.log('✅ Video generated:', rawVideoUrl);
            break;
          } else if (status.status === 'failed') {
            console.error('❌ Video generation failed:', status.error);
            throw new Error(status.error || 'Video generation failed');
          }
          attempts++;
        }
        
        if (!rawVideoUrl) {
          console.log('⚠️ Video generation timed out');
        }
      } else if (videoResult.requiresPayment) {
        console.error('❌ Replicate requires payment');
      }
    } catch (e) {
      console.error('Video generation error:', e.message);
    }
    
    // Use a working sample video if generation failed
    if (!rawVideoUrl) {
      console.log('⚠️ Using sample video as fallback');
      // Using Cloudinary demo video that works publicly
      rawVideoUrl = 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1/samples/elephants';
    }
    
    // ==================== STEP 3: Generate Voiceover (ElevenLabs) ====================
    let voiceoverUrl = null;
    
    console.log('🎤 Step 3: Checking voiceover settings...');
    console.log('   voiceoverSettings.enabled:', voiceoverSettings.enabled);
    console.log('   elevenlabsService exists:', !!elevenlabsService);
    console.log('   elevenlabsService.isAvailable():', elevenlabsService?.isAvailable?.());
    
    if (voiceoverSettings.enabled && elevenlabsService && elevenlabsService.isAvailable()) {
      console.log('🎤 Step 3: Generating ElevenLabs voiceover...');
      try {
        // Clean script for voiceover (remove timestamps/directions)
        const cleanScript = script.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
        console.log('   Clean script:', cleanScript);
        console.log('   Using voiceId:', voiceoverSettings.voiceId || '21m00Tcm4TlvDq8ikWAM');
        
        const voiceResult = await elevenlabsService.textToSpeech(cleanScript, {
          voiceId: voiceoverSettings.voiceId || '21m00Tcm4TlvDq8ikWAM',
          stability: 0.5,
          similarityBoost: 0.75
        });
        
        console.log('   Voice result:', JSON.stringify(voiceResult, null, 2));
        
        if (voiceResult.success) {
          voiceoverUrl = voiceResult.audioUrl;
          console.log('✅ Voiceover generated:', voiceoverUrl);
        } else {
          console.error('❌ Voiceover generation failed:', voiceResult.error);
        }
      } catch (e) {
        console.error('❌ Voiceover error:', e.message);
      }
    } else {
      console.log('⏭️ Step 3: Voiceover disabled or unavailable');
      if (!voiceoverSettings.enabled) console.log('   Reason: voiceover disabled in settings');
      if (!elevenlabsService) console.log('   Reason: elevenlabsService not loaded');
      if (elevenlabsService && !elevenlabsService.isAvailable()) console.log('   Reason: ElevenLabs API key not configured');
    }
    
    // ==================== STEP 4: Select Background Music ====================
    let musicUrl = null;
    
    if (musicSettings.enabled) {
      console.log('🎵 Step 4: Selecting background music...');
      
      const musicByMood = {
        upbeat: [
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
        ],
        chill: [
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
        ],
        cinematic: [
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
        ],
        electronic: [
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
        ]
      };
      
      const nicheMood = {
        motivational: 'cinematic', fitness: 'upbeat', comedy: 'upbeat',
        education: 'chill', lifestyle: 'chill', tech: 'electronic',
        gaming: 'electronic', fashion: 'upbeat', food: 'chill', travel: 'cinematic'
      };
      
      const mood = nicheMood[niche] || 'upbeat';
      const tracks = musicByMood[mood] || musicByMood.upbeat;
      musicUrl = tracks[Math.floor(Math.random() * tracks.length)];
      console.log('✅ Music selected:', musicUrl);
    }
    
    // ==================== STEP 5: Build Text Overlays ====================
    let textOverlays = [];
    const videoDuration = 9; // Luma Ray Flash 2 max duration
    
    if (textSettings.enabled && script) {
      console.log('📝 Step 5: Building optimized text overlays for', videoDuration, 'seconds...');
      
      // Word-based chunking for punchy, readable captions
      const wordsPerSecond = 2.5; // Natural speaking pace
      const maxWords = Math.floor(videoDuration * wordsPerSecond); // ~22 words for 9 sec
      const wordsPerCaption = 4; // Short, punchy chunks
      
      // Get words from script, limit to what fits in video
      const words = script.replace(/[.!?,]/g, '').split(/\s+/).filter(w => w.trim());
      const wordsToUse = words.slice(0, maxWords);
      
      // Calculate timing
      const numCaptions = Math.ceil(wordsToUse.length / wordsPerCaption);
      const captionDuration = videoDuration / numCaptions;
      
      // Build caption chunks
      for (let i = 0; i < wordsToUse.length; i += wordsPerCaption) {
        const chunk = wordsToUse.slice(i, i + wordsPerCaption).join(' ');
        const captionIndex = Math.floor(i / wordsPerCaption);
        
        textOverlays.push({
          text: chunk,
          start: Math.round(captionIndex * captionDuration * 10) / 10,
          end: Math.round((captionIndex + 1) * captionDuration * 10) / 10,
          position: 'bottom',
          style: textSettings.style || 'blockbuster'
        });
      }
      
      console.log('✅ Text overlays:', textOverlays.length, 'captions,', wordsToUse.length, 'words');
      console.log('📝 Text overlays detail:', JSON.stringify(textOverlays, null, 2));
      if (words.length > maxWords) {
        console.log('⚠️ Script trimmed from', words.length, 'to', maxWords, 'words');
      }
    } else {
      console.log('⚠️ Step 5: Text overlays SKIPPED');
      console.log('   textSettings.enabled:', textSettings?.enabled);
      console.log('   script exists:', !!script);
    }
    
    // ==================== STEP 6: Render Final Video ====================
    let finalVideoUrl = rawVideoUrl;
    let cloudinaryVideoPublicId = null;
    let audioPublicId = null;
    const videoDurationForRender = 9;
    
    const needsRender = voiceoverUrl || musicUrl || textOverlays.length > 0;
    
    // PRIORITY 1: Use Shotstack for proper timed subtitles
    if (needsRender && shotstackClient && textOverlays.length > 0) {
      console.log('🎬 Step 6: Rendering with Shotstack (for timed subtitles)...');
      
      try {
        // First upload video to Cloudinary (Shotstack needs public URLs)
        let processedVideoUrl = rawVideoUrl;
        if (cloudinaryService && !rawVideoUrl.includes('cloudinary.com')) {
          console.log('   📤 Uploading video to Cloudinary for Shotstack...');
          const videoUpload = await cloudinaryService.uploadFromUrl(rawVideoUrl, {
            resource_type: 'video',
            folder: 'autopilot/videos'
          });
          if (videoUpload.success) {
            processedVideoUrl = videoUpload.url;
            console.log('   ✅ Video uploaded:', processedVideoUrl);
          }
        }
        
        // Upload audio if provided
        let processedAudioUrl = voiceoverUrl || musicUrl;
        console.log('   🔊 Audio source - voiceoverUrl:', voiceoverUrl);
        console.log('   🔊 Audio source - musicUrl:', musicUrl);
        console.log('   🔊 Using processedAudioUrl:', processedAudioUrl);
        
        if (processedAudioUrl && cloudinaryService && !processedAudioUrl.includes('cloudinary.com')) {
          console.log('   📤 Uploading audio to Cloudinary for Shotstack...');
          const audioUpload = await cloudinaryService.uploadFromUrl(processedAudioUrl, {
            resource_type: 'video',
            folder: 'autopilot/audio'
          });
          if (audioUpload.success) {
            processedAudioUrl = audioUpload.url;
            console.log('   ✅ Audio uploaded:', processedAudioUrl);
          } else {
            console.error('   ❌ Audio upload failed:', audioUpload.error);
          }
        } else if (processedAudioUrl?.includes('cloudinary.com')) {
          console.log('   ✅ Audio already on Cloudinary:', processedAudioUrl);
        }
        
        // Render with Shotstack
        console.log('   🎬 Starting Shotstack render with', textOverlays.length, 'subtitles...');
        console.log('   🎬 Audio URL for Shotstack:', processedAudioUrl || 'NONE');
        console.log('   🎬 Text overlays being sent to Shotstack:', JSON.stringify(textOverlays.slice(0, 2), null, 2), '...');
        
        const result = await shotstackClient.renderVideo(
          processedVideoUrl,
          processedAudioUrl,
          textOverlays,
          {
            duration: videoDurationForRender,
            videoVolume: 0,
            musicVolume: voiceoverUrl ? 1 : 0.7,
            maxAttempts: 60,
            pollInterval: 3000
          }
        );
        
        console.log('   🎬 Shotstack result:', JSON.stringify(result, null, 2));
        
        if (result.success && result.url) {
          finalVideoUrl = result.url;
          console.log('✅ Shotstack render complete:', finalVideoUrl);
        } else {
          console.error('❌ Shotstack render failed:', result.error);
          // Fall through to Cloudinary
        }
      } catch (e) {
        console.error('❌ Shotstack error:', e.message);
        console.error('   Stack:', e.stack);
        // Fall through to Cloudinary
      }
    } else if (needsRender && !shotstackClient) {
      console.log('⚠️ Shotstack client not available, will use Cloudinary fallback');
    } else if (needsRender && textOverlays.length === 0) {
      console.log('⚠️ No text overlays to render with Shotstack');
    }
    
    // PRIORITY 2: Fallback to Cloudinary (limited subtitle timing support)
    if (finalVideoUrl === rawVideoUrl && needsRender && cloudinaryService) {
      console.log('🎬 Step 6: Rendering final video with Cloudinary (fallback)...');
      
      try {
        // Step 6a: Upload the raw video to Cloudinary (if not already there)
        if (!rawVideoUrl.includes('cloudinary.com')) {
          console.log('   📤 Uploading video to Cloudinary...');
          const videoUpload = await cloudinaryService.uploadFromUrl(rawVideoUrl, {
            resource_type: 'video',
            folder: 'autopilot/videos'
          });
          if (videoUpload.success) {
            cloudinaryVideoPublicId = videoUpload.publicId;
            rawVideoUrl = videoUpload.url;
            console.log('   ✅ Video uploaded:', cloudinaryVideoPublicId);
          }
        } else {
          // Extract public ID from existing Cloudinary URL
          const match = rawVideoUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
          if (match) {
            cloudinaryVideoPublicId = match[1];
          }
        }
        
        // Step 6b: Upload audio to Cloudinary (voiceover takes priority over music)
        const audioToUpload = voiceoverUrl || musicUrl;
        if (audioToUpload) {
          console.log('   📤 Uploading audio to Cloudinary...');
          const audioUpload = await cloudinaryService.uploadFromUrl(audioToUpload, {
            resource_type: 'video', // Cloudinary stores audio as video type
            folder: 'autopilot/audio'
          });
          if (audioUpload.success) {
            audioPublicId = audioUpload.publicId;
            console.log('   ✅ Audio uploaded:', audioPublicId);
          }
        }
        
        // Step 6c: Generate final video with text + audio using Cloudinary transformations
        if (cloudinaryVideoPublicId || rawVideoUrl.includes('cloudinary.com')) {
          const finalUrl = cloudinaryService.generateVideoWithTextOverlay(
            rawVideoUrl,
            textOverlays,
            {
              audioPublicId: audioPublicId,
              musicVolume: voiceoverUrl ? 0.3 : 0.7 // Lower if voiceover, louder if just music
            }
          );
          
          if (finalUrl && finalUrl !== rawVideoUrl) {
            finalVideoUrl = finalUrl;
            console.log('✅ Final video URL generated:', finalVideoUrl);
          }
        }
        
      } catch (e) {
        console.error('Cloudinary render error:', e.message);
        // Fall back to raw video
        finalVideoUrl = rawVideoUrl;
      }
    } else if (!cloudinaryService && !shotstackClient) {
      console.log('⚠️ No render service available, using raw video');
    }
    
    // ==================== STEP 7: Add to Queue ====================
    console.log('📋 Step 7: Adding to queue...');
    
    const existingTimes = autopilotState.reels.queue.map(v => v.scheduledAt);
    
    const video = {
      id: generateId(),
      videoUrl: finalVideoUrl,
      rawVideoUrl,
      voiceoverUrl,
      musicUrl,
      caption: caption + '\n\n' + hashtags,
      hashtags,
      script,
      status: settings?.autoApprove ? 'approved' : 'pending',
      scheduledAt: getNextScheduledTime(settings || {}, existingTimes),
      createdAt: new Date().toISOString(),
      settings: { niche, style, videoPrompt, voiceover: voiceoverSettings, music: musicSettings }
    };
    
    autopilotState.reels.queue.unshift(video);
    
    console.log('✅ [AUTOPILOT] Pipeline complete! Video ID:', video.id);
    
    res.json({
      success: true,
      video,
      pipeline: {
        script: !!script,
        video: !!rawVideoUrl,
        voiceover: !!voiceoverUrl,
        music: !!musicUrl,
        textOverlays: textOverlays.length,
        rendered: finalVideoUrl !== rawVideoUrl
      }
    });
  } catch (error) {
    console.error('❌ [AUTOPILOT] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== BACKGROUND JOB SYSTEM ====================
// Allows video generation to continue even when user leaves the page

/**
 * Internal function to run the full generation pipeline
 * Returns the generated video data
 */
async function runGenerationPipeline(settings, jobId) {
  const updateJobProgress = (step, progress, message) => {
    const job = autopilotState.reels.backgroundJobs.find(j => j.id === jobId);
    if (job) {
      job.currentStep = step;
      job.progress = progress;
      job.stepMessage = message;
      job.updatedAt = new Date().toISOString();
    }
  };
  
  console.log(`🎬 [JOB ${jobId}] Starting full viral video pipeline...`);
  console.log('📋 Settings:', JSON.stringify(settings, null, 2));
  
  // Extract business identity settings
  const businessName = settings?.businessName || '';
  const businessType = settings?.businessType || 'personal_brand';
  const targetAudience = settings?.targetAudience || '';
  const brandTone = settings?.brandTone || 'professional';
  const callToAction = settings?.callToAction || 'Follow for more!';
  
  // Extract content settings
  const niche = settings?.niche || 'motivational';
  const style = settings?.style || 'cinematic';
  const contentGoal = settings?.contentGoal || 'engagement';
  const hookStyle = settings?.hookStyle || 'question';
  const topics = settings?.topics || '';
  
  // Extract caption settings  
  const captionStyle = settings?.captionStyle || 'short';
  const includeEmojis = settings?.includeEmojis !== false;
  const includeCTA = settings?.includeCTA !== false;
  
  // Extract audio/visual settings
  const voiceoverSettings = settings?.voiceover || { enabled: true, voiceId: '21m00Tcm4TlvDq8ikWAM' };
  const musicSettings = settings?.music || { enabled: true, mood: 'upbeat' };
  const textSettings = settings?.textOverlay || { enabled: true, style: 'chunk', position: 'bottom' };
  
  // ==================== STEP 1: Generate Viral Script ====================
  updateJobProgress('script', 10, 'Generating viral script...');
  console.log(`📝 [JOB ${jobId}] Step 1: Generating viral script...`);
  let script = '';
  let caption = '';
  let hashtags = settings?.hashtags || '#viral #trending #reels';
  
  try {
    const scriptContext = {
      niche,
      businessName,
      businessType,
      targetAudience,
      brandTone,
      hookStyle,
      contentGoal,
      topics: topics ? topics.split('\n').filter(t => t.trim()) : []
    };
    
    const scriptResult = await openaiService.generateReelScript(niche, 9, scriptContext);
    if (scriptResult.success) {
      script = scriptResult.script;
    }
  } catch (e) {
    console.log(`[JOB ${jobId}] Script generation fallback:`, e.message);
  }
  
  // Fallback script
  if (!script) {
    const hookTemplates = {
      question: `Did you know this about ${niche}? Most people get this wrong. Here's the truth.`,
      statistic: `90% of people fail at ${niche}. Here's how to be in the top 10%.`,
      bold_claim: `This ${niche} secret changed everything. You need to hear this.`,
      story: `I discovered something about ${niche} that blew my mind. Let me share it.`,
      problem: `Struggling with ${niche}? Here's the solution no one talks about.`,
      curiosity: `What if I told you ${niche} is not what you think? Watch this.`,
      stop_scroll: `Stop scrolling. This ${niche} tip will change your life.`,
      secret: `The hidden truth about ${niche} that experts won't tell you.`
    };
    script = hookTemplates[hookStyle] || hookTemplates.question;
  }
  
  // Generate caption
  try {
    const captionOptions = {
      tone: brandTone,
      includeEmojis,
      includeHashtags: false,
      captionStyle,
      businessName,
      callToAction: includeCTA ? callToAction : ''
    };
    
    const captionResult = await openaiService.generateCaption(niche, captionOptions);
    if (captionResult.success) {
      caption = captionResult.caption;
      if (includeCTA && callToAction && !caption.includes(callToAction)) {
        caption += `\n\n${callToAction}`;
      }
    }
  } catch (e) {
    caption = includeEmojis 
      ? `🔥 ${businessName ? businessName + ' - ' : ''}Amazing ${niche} content! ${includeCTA ? callToAction : ''} ✨`
      : `${businessName ? businessName + ' - ' : ''}Amazing ${niche} content! ${includeCTA ? callToAction : ''}`;
  }
  
  updateJobProgress('script', 20, 'Script generated');
  console.log(`✅ [JOB ${jobId}] Script:`, script.substring(0, 80) + '...');
  
  // ==================== STEP 2: Generate AI Video ====================
  updateJobProgress('video', 25, 'Generating AI video...');
  console.log(`🎥 [JOB ${jobId}] Step 2: Generating AI video with Replicate...`);
  let rawVideoUrl = null;
  
  let videoPrompt = `${niche} content, ${style} style, vertical 9:16, Instagram Reels, cinematic, high quality`;
  try {
    const promptResult = await openaiService.generateVideoPrompt(niche, style);
    if (promptResult.success) {
      videoPrompt = promptResult.prompt;
    }
  } catch (e) {}
  
  try {
    const videoResult = await replicateService.startTextToVideo(videoPrompt, {
      aspectRatio: '9:16',
      duration: 9
    });
    
    if (videoResult.success) {
      console.log(`⏳ [JOB ${jobId}] Waiting for video generation...`);
      let attempts = 0;
      while (attempts < 90) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const status = await replicateService.getPredictionStatus(videoResult.predictionId);
        
        // Update progress based on attempts
        const videoProgress = Math.min(25 + Math.floor(attempts * 0.5), 55);
        updateJobProgress('video', videoProgress, `Generating video... ${Math.floor((attempts / 90) * 100)}%`);
        
        console.log(`   [JOB ${jobId}] Attempt ${attempts + 1}: ${status.status}`);
        
        if (status.status === 'succeeded' && status.output) {
          rawVideoUrl = Array.isArray(status.output) ? status.output[0] : status.output;
          console.log(`✅ [JOB ${jobId}] Video generated:`, rawVideoUrl);
          break;
        } else if (status.status === 'failed') {
          console.error(`❌ [JOB ${jobId}] Video generation failed:`, status.error);
          throw new Error(status.error || 'Video generation failed');
        }
        attempts++;
      }
    } else if (videoResult.requiresPayment) {
      console.error(`❌ [JOB ${jobId}] Replicate requires payment`);
    }
  } catch (e) {
    console.error(`[JOB ${jobId}] Video generation error:`, e.message);
  }
  
  if (!rawVideoUrl) {
    console.log(`⚠️ [JOB ${jobId}] Using sample video as fallback`);
    rawVideoUrl = 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1/samples/elephants';
  }
  
  updateJobProgress('video', 55, 'Video generated');
  
  // ==================== STEP 3: Generate Voiceover ====================
  let voiceoverUrl = null;
  
  if (voiceoverSettings.enabled && elevenlabsService && elevenlabsService.isAvailable()) {
    updateJobProgress('voiceover', 60, 'Generating voiceover...');
    console.log(`🎤 [JOB ${jobId}] Step 3: Generating ElevenLabs voiceover...`);
    try {
      const cleanScript = script.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
      
      const voiceResult = await elevenlabsService.textToSpeech(cleanScript, {
        voiceId: voiceoverSettings.voiceId || '21m00Tcm4TlvDq8ikWAM',
        stability: 0.5,
        similarityBoost: 0.75
      });
      
      if (voiceResult.success) {
        voiceoverUrl = voiceResult.audioUrl;
        console.log(`✅ [JOB ${jobId}] Voiceover generated:`, voiceoverUrl);
      }
    } catch (e) {
      console.error(`❌ [JOB ${jobId}] Voiceover error:`, e.message);
    }
  }
  
  updateJobProgress('voiceover', 70, 'Voiceover complete');
  
  // ==================== STEP 4: Select Background Music ====================
  let musicUrl = null;
  
  if (musicSettings.enabled) {
    updateJobProgress('music', 72, 'Selecting music...');
    console.log(`🎵 [JOB ${jobId}] Step 4: Selecting background music...`);
    
    const musicByMood = {
      upbeat: ['https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'],
      chill: ['https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'],
      cinematic: ['https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'],
      electronic: ['https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3']
    };
    
    const nicheMood = {
      motivational: 'cinematic', fitness: 'upbeat', comedy: 'upbeat',
      education: 'chill', lifestyle: 'chill', tech: 'electronic'
    };
    
    const mood = nicheMood[niche] || 'upbeat';
    const tracks = musicByMood[mood] || musicByMood.upbeat;
    musicUrl = tracks[Math.floor(Math.random() * tracks.length)];
    console.log(`✅ [JOB ${jobId}] Music selected:`, musicUrl);
  }
  
  updateJobProgress('music', 75, 'Music selected');
  
  // ==================== STEP 5: Build Text Overlays ====================
  let textOverlays = [];
  const videoDuration = 9;
  
  if (textSettings.enabled && script) {
    updateJobProgress('text', 78, 'Building subtitles...');
    console.log(`📝 [JOB ${jobId}] Step 5: Building text overlays...`);
    
    const wordsPerSecond = 2.5;
    const maxWords = Math.floor(videoDuration * wordsPerSecond);
    const wordsPerCaption = 4;
    
    const words = script.replace(/[.!?,]/g, '').split(/\s+/).filter(w => w.trim());
    const wordsToUse = words.slice(0, maxWords);
    
    const numCaptions = Math.ceil(wordsToUse.length / wordsPerCaption);
    const captionDuration = videoDuration / numCaptions;
    
    for (let i = 0; i < wordsToUse.length; i += wordsPerCaption) {
      const chunk = wordsToUse.slice(i, i + wordsPerCaption).join(' ');
      const captionIndex = Math.floor(i / wordsPerCaption);
      
      textOverlays.push({
        text: chunk,
        start: Math.round(captionIndex * captionDuration * 10) / 10,
        end: Math.round((captionIndex + 1) * captionDuration * 10) / 10,
        position: 'bottom',
        style: textSettings.style || 'blockbuster'
      });
    }
    
    console.log(`✅ [JOB ${jobId}] Text overlays:`, textOverlays.length, 'captions');
  }
  
  updateJobProgress('text', 80, 'Subtitles ready');
  
  // ==================== STEP 6: Render Final Video ====================
  let finalVideoUrl = rawVideoUrl;
  const needsRender = voiceoverUrl || musicUrl || textOverlays.length > 0;
  
  if (needsRender && shotstackClient && textOverlays.length > 0) {
    updateJobProgress('render', 82, 'Rendering final video...');
    console.log(`🎬 [JOB ${jobId}] Step 6: Rendering with Shotstack...`);
    
    try {
      let processedVideoUrl = rawVideoUrl;
      if (cloudinaryService && !rawVideoUrl.includes('cloudinary.com')) {
        const videoUpload = await cloudinaryService.uploadFromUrl(rawVideoUrl, {
          resource_type: 'video',
          folder: 'autopilot/videos'
        });
        if (videoUpload.success) {
          processedVideoUrl = videoUpload.url;
        }
      }
      
      let processedAudioUrl = voiceoverUrl || musicUrl;
      if (processedAudioUrl && cloudinaryService && !processedAudioUrl.includes('cloudinary.com')) {
        const audioUpload = await cloudinaryService.uploadFromUrl(processedAudioUrl, {
          resource_type: 'video',
          folder: 'autopilot/audio'
        });
        if (audioUpload.success) {
          processedAudioUrl = audioUpload.url;
        }
      }
      
      // Update progress during Shotstack render
      updateJobProgress('render', 85, 'Shotstack rendering...');
      
      const result = await shotstackClient.renderVideo(
        processedVideoUrl,
        processedAudioUrl,
        textOverlays,
        {
          duration: 9,
          videoVolume: 0,
          musicVolume: voiceoverUrl ? 1 : 0.7,
          maxAttempts: 60,
          pollInterval: 3000
        }
      );
      
      if (result.success && result.url) {
        finalVideoUrl = result.url;
        console.log(`✅ [JOB ${jobId}] Shotstack render complete:`, finalVideoUrl);
      }
    } catch (e) {
      console.error(`❌ [JOB ${jobId}] Shotstack error:`, e.message);
    }
  }
  
  updateJobProgress('complete', 100, 'Video ready!');
  
  // Return the video data
  return {
    videoUrl: finalVideoUrl,
    rawVideoUrl,
    voiceoverUrl,
    musicUrl,
    caption: caption + '\n\n' + hashtags,
    hashtags,
    script,
    status: settings?.autoApprove ? 'approved' : 'pending',
    settings: { niche, style, videoPrompt, voiceover: voiceoverSettings, music: musicSettings },
    textOverlays
  };
}

/**
 * Start a background video generation job
 * POST /api/ai/autopilot/reels/generate/background
 * Returns immediately with a job ID
 */
router.post('/autopilot/reels/generate/background', async (req, res) => {
  try {
    const { settings } = req.body;
    
    // Create a new background job
    const jobId = generateId();
    const job = {
      id: jobId,
      status: 'processing',
      currentStep: 'starting',
      progress: 0,
      stepMessage: 'Starting generation...',
      settings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      result: null,
      error: null
    };
    
    autopilotState.reels.backgroundJobs.push(job);
    
    console.log(`🚀 [BACKGROUND JOB] Created job ${jobId}`);
    
    // Return immediately with job ID
    res.json({
      success: true,
      jobId,
      message: 'Background job started. You can leave this page and check back later.'
    });
    
    // Run the pipeline in the background (don't await)
    runGenerationPipeline(settings, jobId)
      .then(videoData => {
        const job = autopilotState.reels.backgroundJobs.find(j => j.id === jobId);
        if (job) {
          job.status = 'completed';
          job.progress = 100;
          job.stepMessage = 'Video ready!';
          job.result = videoData;
          job.completedAt = new Date().toISOString();
          
          // Also add to queue
          const existingTimes = autopilotState.reels.queue.map(v => v.scheduledAt);
          const video = {
            id: generateId(),
            ...videoData,
            scheduledAt: getNextScheduledTime(settings || {}, existingTimes),
            createdAt: new Date().toISOString()
          };
          autopilotState.reels.queue.unshift(video);
          
          console.log(`✅ [BACKGROUND JOB] Job ${jobId} completed`);
        }
      })
      .catch(error => {
        const job = autopilotState.reels.backgroundJobs.find(j => j.id === jobId);
        if (job) {
          job.status = 'failed';
          job.error = error.message;
          job.completedAt = new Date().toISOString();
          console.error(`❌ [BACKGROUND JOB] Job ${jobId} failed:`, error.message);
        }
      });
      
  } catch (error) {
    console.error('Background job creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get background job status
 * GET /api/ai/autopilot/reels/jobs/:id
 */
router.get('/autopilot/reels/jobs/:id', (req, res) => {
  const { id } = req.params;
  const job = autopilotState.reels.backgroundJobs.find(j => j.id === id);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json({
    success: true,
    job: {
      id: job.id,
      status: job.status,
      currentStep: job.currentStep,
      progress: job.progress,
      stepMessage: job.stepMessage,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedAt: job.completedAt,
      result: job.result,
      error: job.error
    }
  });
});

/**
 * Get all background jobs
 * GET /api/ai/autopilot/reels/jobs
 */
router.get('/autopilot/reels/jobs', (req, res) => {
  const jobs = autopilotState.reels.backgroundJobs.map(job => ({
    id: job.id,
    status: job.status,
    currentStep: job.currentStep,
    progress: job.progress,
    stepMessage: job.stepMessage,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    error: job.error
  }));
  
  res.json({
    success: true,
    jobs: jobs.slice(-20) // Last 20 jobs
  });
});

/**
 * Cancel a background job (if still processing)
 * DELETE /api/ai/autopilot/reels/jobs/:id
 */
router.delete('/autopilot/reels/jobs/:id', (req, res) => {
  const { id } = req.params;
  const jobIndex = autopilotState.reels.backgroundJobs.findIndex(j => j.id === id);
  
  if (jobIndex === -1) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  // Remove the job
  autopilotState.reels.backgroundJobs.splice(jobIndex, 1);
  
  res.json({ success: true, message: 'Job removed' });
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
    
    // Generate image prompt for Flux Schnell
    let imagePrompt = '';
    try {
      // Create a detailed image prompt based on niche and style
      const promptResult = await openaiService.chat([
        {
          role: 'system',
          content: `You are an expert at creating image prompts for AI image generation. Create a single, detailed prompt for generating a stunning Instagram post image. Focus on visual details, lighting, colors, and composition. Keep it under 200 words. Do NOT include any text or words in the image. The style should be ${style}.`
        },
        {
          role: 'user',
          content: `Create an image prompt for a ${niche} Instagram post in ${style} style. Topics to consider: ${settings?.topics?.join(', ') || niche}. The image should be eye-catching and scroll-stopping for Instagram.`
        }
      ]);
      
      if (promptResult.success) {
        imagePrompt = promptResult.content;
      }
    } catch (e) {
      console.log('Image prompt generation failed, using fallback:', e.message);
    }
    
    // Fallback prompt if AI generation failed
    if (!imagePrompt) {
      imagePrompt = `A stunning ${style} ${niche} image for Instagram. Professional photography, vibrant colors, beautiful composition, high quality, 4K, trending on Instagram, visually striking, no text`;
    }
    
    console.log('📝 Image prompt:', imagePrompt);
    
    // Generate image with Flux Schnell via Replicate
    let imageUrl = '';
    try {
      const replicateService = require('../services/replicate');
      const imageResult = await replicateService.textToImage(imagePrompt, {
        aspectRatio: '1:1', // Square for Instagram posts
        outputFormat: 'webp',
        outputQuality: 95
      });
      
      if (imageResult.success && imageResult.imageUrl) {
        imageUrl = imageResult.imageUrl;
        console.log('✅ Flux Schnell image generated:', imageUrl);
      } else {
        throw new Error(imageResult.error || 'Image generation failed');
      }
    } catch (e) {
      console.error('❌ Flux Schnell generation failed:', e.message);
      // Fallback to Unsplash if Replicate fails
      imageUrl = `https://source.unsplash.com/1080x1080/?${niche},${style}`;
      console.log('⚠️ Using Unsplash fallback:', imageUrl);
    }
    
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
      },
      imagePrompt // Store the prompt for reference
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

// ==================== New AI Auto-Pilot V2 Routes ====================

/**
 * Generate related topics based on main topic
 * POST /api/ai/generate-topics
 * 
 * Generates natural, benefit-focused topics with diverse angles
 */
router.post('/generate-topics', async (req, res) => {
  try {
    const { mainTopic, count = 8 } = req.body;
    
    if (!mainTopic) {
      return res.status(400).json({ error: 'Main topic is required' });
    }
    
    console.log('🎯 Generating related topics for:', mainTopic);
    
    let topics = [];
    
    // Try to use OpenAI for better topic generation
    if (openaiService) {
      try {
        const prompt = `You are a content strategist. The user wants to create social media content about: "${mainTopic}"

Generate ${count} diverse content topics. Each topic should:
1. Be a natural, readable headline (not a template)
2. Focus on different angles: benefits, how-to, science, tips, testimonials, comparisons, myths, impact
3. Be specific to the actual use cases and benefits of the topic
4. Sound like real article/video titles

DIVERSITY ANGLES TO COVER:
- Benefits for specific use case (sleep, work, health, etc.)
- How it enhances/improves something specific
- The science/research behind it
- Practical tips for using it
- User testimonials/success stories
- Comparison of different types/options
- Impact on specific activities (sports, daily life, etc.)
- Common myths debunked
- Step-by-step guides
- Before and after results

EXAMPLE for "nasal strips for nose, breathing, sleeping, training":
- "Benefits of Using Nasal Strips for Better Breathing During Sleep"
- "How Nasal Strips Can Enhance Your Workout Performance"
- "The Science Behind Nasal Strips and Improved Airflow"
- "Tips for a Better Night's Sleep with Nasal Strips"
- "User Testimonials: How Nasal Strips Changed My Breathing"
- "Comparing Different Types of Nasal Strips: Which One is Right for You"
- "The Impact of Nasal Breathing on Athletic Performance"
- "Common Myths About Nasal Strips Debunked"

Now generate ${count} similar natural topics for: "${mainTopic}"

Return ONLY a JSON array of strings. No markdown, no explanations.`;

        const result = await openaiService.chat([
          { role: 'system', content: 'You generate natural, benefit-focused content topics. Return only valid JSON arrays.' },
          { role: 'user', content: prompt }
        ]);
        
        if (result.success && result.content) {
          // Parse the JSON array from the response
          const match = result.content.match(/\[[\s\S]*?\]/);
          if (match) {
            try {
              topics = JSON.parse(match[0]);
            } catch (parseErr) {
              console.log('JSON parse error, cleaning response...');
              const cleaned = match[0].replace(/[\n\r]/g, ' ').replace(/,\s*]/g, ']');
              topics = JSON.parse(cleaned);
            }
          }
        }
      } catch (e) {
        console.log('OpenAI topic generation failed, using enhanced fallback:', e.message);
      }
    }
    
    // Enhanced fallback with natural, benefit-focused topics
    if (topics.length === 0) {
      const topic = mainTopic.trim();
      
      // Generate diverse, natural-sounding topics
      const fallbackTopics = [
        // Benefits angles
        `Benefits of ${topic} for Better Results`,
        `How ${topic} Can Improve Your Daily Life`,
        `The Positive Impact of ${topic} on Your Health`,
        
        // How-to / Enhancement angles
        `How ${topic} Can Enhance Your Performance`,
        `Ways to Get the Most Out of ${topic}`,
        `Tips for Better Results with ${topic}`,
        
        // Science / Research angles
        `The Science Behind ${topic} and Why It Works`,
        `What Research Says About ${topic}`,
        `Understanding How ${topic} Actually Works`,
        
        // Practical tips
        `Practical Tips for Using ${topic} Effectively`,
        `A Beginner's Guide to ${topic}`,
        `How to Choose the Right ${topic} for You`,
        
        // Testimonials / Stories
        `User Testimonials: How ${topic} Changed Their Lives`,
        `Real Stories: Success with ${topic}`,
        `Before and After: Results with ${topic}`,
        
        // Comparisons
        `Comparing Different Types of ${topic}: Which One is Best`,
        `${topic} Options: Finding What Works for You`,
        
        // Myths / Facts
        `Common Myths About ${topic} Debunked`,
        `The Truth About ${topic}: Facts vs Fiction`,
        
        // Impact on activities
        `The Impact of ${topic} on Your Routine`,
        `How ${topic} Fits Into a Healthy Lifestyle`
      ];
      
      // Shuffle and pick the required count
      const shuffled = fallbackTopics.sort(() => Math.random() - 0.5);
      topics = shuffled.slice(0, count);
    }
    
    // Ensure we have unique, non-empty topics
    topics = [...new Set(topics.filter(t => t && t.trim()))].slice(0, count);
    
    console.log('✅ Generated topics:', topics);
    
    res.json({
      success: true,
      topics
    });
  } catch (error) {
    console.error('Topic generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start Auto-Pilot V2
 * POST /api/ai/autopilot/v2/start
 */
router.post('/autopilot/v2/start', async (req, res) => {
  try {
    const { topics, frequency, timeSlots, postTypes, brandDetails } = req.body;
    
    console.log('🚀 Starting Auto-Pilot V2...');
    console.log('Topics:', topics);
    console.log('Frequency:', frequency);
    console.log('Time Slots:', timeSlots);
    console.log('Post Types:', postTypes);
    console.log('Brand Details:', brandDetails);
    
    // Store the configuration (in production, save to database)
    const config = {
      id: generateId(),
      topics,
      frequency,
      timeSlots,
      postTypes,
      brandDetails,
      status: 'active',
      createdAt: new Date().toISOString(),
      nextPostAt: null,
      postsGenerated: 0
    };
    
    // Calculate next post time
    const now = new Date();
    const sortedSlots = [...timeSlots].sort();
    let nextSlot = sortedSlots.find(slot => {
      const [hours, minutes] = slot.split(':').map(Number);
      const slotTime = new Date(now);
      slotTime.setHours(hours, minutes, 0, 0);
      return slotTime > now;
    });
    
    if (!nextSlot) {
      // All slots passed today, use first slot tomorrow
      nextSlot = sortedSlots[0];
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const [hours, minutes] = nextSlot.split(':').map(Number);
      tomorrow.setHours(hours, minutes, 0, 0);
      config.nextPostAt = tomorrow.toISOString();
    } else {
      const [hours, minutes] = nextSlot.split(':').map(Number);
      const nextTime = new Date(now);
      nextTime.setHours(hours, minutes, 0, 0);
      config.nextPostAt = nextTime.toISOString();
    }
    
    // Store in autopilot state (would be database in production)
    if (!autopilotState.v2) {
      autopilotState.v2 = { configs: [], queue: [] };
    }
    autopilotState.v2.configs.push(config);
    
    console.log('✅ Auto-Pilot V2 started. Next post at:', config.nextPostAt);
    
    res.json({
      success: true,
      message: 'Auto-Pilot started successfully',
      config
    });
  } catch (error) {
    console.error('Auto-Pilot V2 start error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Auto-Pilot V2 Status
 * GET /api/ai/autopilot/v2/status
 */
router.get('/autopilot/v2/status', (req, res) => {
  const configs = autopilotState.v2?.configs || [];
  const activeConfig = configs.find(c => c.status === 'active');
  
  res.json({
    success: true,
    active: !!activeConfig,
    config: activeConfig || null
  });
});

/**
 * Stop Auto-Pilot V2
 * POST /api/ai/autopilot/v2/stop
 */
router.post('/autopilot/v2/stop', (req, res) => {
  if (autopilotState.v2?.configs) {
    autopilotState.v2.configs.forEach(c => {
      c.status = 'stopped';
      c.stoppedAt = new Date().toISOString();
    });
  }
  
  res.json({
    success: true,
    message: 'Auto-Pilot stopped'
  });
});

// ==================== Stock Video Routes ====================

// Import stock video service
let stockVideoService = null;
try {
  stockVideoService = require('../services/stockVideoService');
  console.log('✅ Stock video service loaded');
} catch (e) {
  console.log('Stock video service not available:', e.message);
}

// Import subtitle generator
let subtitleGenerator = null;
try {
  subtitleGenerator = require('../services/subtitleGenerator');
  console.log('✅ Subtitle generator loaded');
} catch (e) {
  console.log('Subtitle generator not available:', e.message);
}

/**
 * Search stock videos from Pexels and Pixabay
 * POST /api/ai/stock-video/search
 */
router.post('/stock-video/search', async (req, res) => {
  try {
    if (!stockVideoService) {
      return res.status(500).json({ error: 'Stock video service not available' });
    }

    const { query, contentType, orientation = 'portrait', perPage = 10 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log(`🎬 Stock video search: "${query}" (${contentType})`);

    const videos = await stockVideoService.searchStockVideos(query, {
      orientation,
      perPage,
      minDuration: 5,
      maxDuration: 60
    });

    res.json({
      success: true,
      videos,
      count: videos.length
    });
  } catch (error) {
    console.error('Stock video search error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get a random stock video for a topic
 * POST /api/ai/stock-video/random
 */
router.post('/stock-video/random', async (req, res) => {
  try {
    if (!stockVideoService) {
      return res.status(500).json({ error: 'Stock video service not available' });
    }

    const { topic, contentType = 'default' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    console.log(`🎬 Getting random stock video for: "${topic}" (${contentType})`);

    const video = await stockVideoService.getRandomStockVideo(topic, contentType);

    if (!video) {
      return res.status(404).json({ error: 'No suitable videos found' });
    }

    res.json({
      success: true,
      video
    });
  } catch (error) {
    console.error('Random stock video error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get stock video clips for a target duration (for stitching)
 * POST /api/ai/stock-video/clips
 */
router.post('/stock-video/clips', async (req, res) => {
  try {
    if (!stockVideoService) {
      return res.status(500).json({ error: 'Stock video service not available' });
    }

    const { topic, targetDuration = 15, contentType = 'default' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    console.log(`🎬 Getting clips for ${targetDuration}s video on: "${topic}"`);

    const clips = await stockVideoService.getVideoClipsForDuration(topic, targetDuration, {
      contentType
    });

    res.json({
      success: true,
      clips,
      totalDuration: clips.reduce((sum, c) => sum + c.useDuration, 0)
    });
  } catch (error) {
    console.error('Stock video clips error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ENHANCED Voiceover Video Generation
 * Full pipeline: Script → Voiceover → Subtitles → Scene Videos → Composition
 * 
 * This endpoint creates a complete voiceover video with:
 * - AI-generated script
 * - Text-to-speech voiceover (ElevenLabs or Google TTS)
 * - Synchronized subtitles matching the voiceover
 * - Different stock videos for each scene/segment
 * 
 * POST /api/ai/voiceover-video/generate
 */
router.post('/voiceover-video/generate', async (req, res) => {
  // IMMEDIATE LOG - Should always appear
  console.log('========================================');
  console.log('🚀 VOICEOVER-VIDEO ENDPOINT HIT - v4');
  console.log('========================================');
  console.log('cloudinaryUpload available:', !!cloudinaryUpload);
  console.log('shotstackClient available:', !!shotstackClient);
  
  try {
    const { 
      topic, 
      contentType = 'tips',
      duration = 15,
      voiceStyle = 'energetic',
      voiceId = null, // ElevenLabs voice ID
      subtitleStyle = 'sentence', // 'word', 'phrase', 'sentence'
      useSceneVideos = true, // Get different videos for each scene
      maxWordsPerSubtitle = 6
    } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    console.log('🎬 Starting enhanced voiceover video generation...');
    console.log(`   Topic: "${topic}"`);
    console.log(`   Content Type: ${contentType}`);
    console.log(`   Voice Style: ${voiceStyle}`);
    console.log(`   Voice ID: ${voiceId || 'default'}`);
    console.log(`   Scene Videos: ${useSceneVideos}`);

    // STEP 1: Generate script WITH visual scene descriptions
    console.log('\n📝 Step 1: Generating script with visual scenes...');
    
    let scriptResult;
    let aiGeneratedScenes = [];
    
    // Try the new scene-aware script generation first
    if (useSceneVideos) {
      const sceneScriptResult = await openaiService.generateScriptWithScenes(topic, duration, contentType);
      if (sceneScriptResult.success && sceneScriptResult.scenes?.length > 0) {
        scriptResult = { success: true, script: sceneScriptResult.script };
        aiGeneratedScenes = sceneScriptResult.scenes;
        console.log('   ✅ AI generated script with', aiGeneratedScenes.length, 'scene descriptions:');
        aiGeneratedScenes.forEach((s, i) => console.log(`      ${i+1}. "${s.video}" for: "${s.text?.substring(0, 40)}..."`));
      } else {
        // Fallback to regular script generation
        scriptResult = await openaiService.generateReelScript(`${contentType}: ${topic}`, duration);
        console.log('   ⚠️ Falling back to regular script generation');
      }
    } else {
      scriptResult = await openaiService.generateReelScript(`${contentType}: ${topic}`, duration);
    }
    
    if (!scriptResult.success) {
      return res.status(500).json({ error: 'Failed to generate script: ' + scriptResult.error });
    }
    console.log('   ✅ Script generated:', scriptResult.script.substring(0, 100) + '...');

    // STEP 2: Generate voiceover WITH TIMESTAMPS (try ElevenLabs first, fallback to Google TTS)
    console.log('\n🎤 Step 2: Generating voiceover with timestamps...');
    let voiceResult = null;
    let ttsProvider = 'google';
    let wordTimestamps = null; // EXACT word timings from ElevenLabs

    if (elevenlabsService && elevenlabsService.isAvailable()) {
      try {
        // Use timestamps API for EXACT word timing synchronization
        if (typeof elevenlabsService.textToSpeechWithTimestamps === 'function') {
          console.log('   🎯 Using ElevenLabs timestamps API for EXACT timing...');
          voiceResult = await elevenlabsService.textToSpeechWithTimestamps(scriptResult.script, { voiceId: voiceId || undefined });
          
          if (voiceResult.success && voiceResult.wordTimings && voiceResult.wordTimings.length > 0) {
            ttsProvider = 'elevenlabs';
            // Use the pre-parsed word timings from the ElevenLabs service
            wordTimestamps = voiceResult.wordTimings;
            console.log(`   ✅ ElevenLabs voiceover with ${wordTimestamps.length} EXACT word timestamps`);
          } else if (voiceResult.success) {
            ttsProvider = 'elevenlabs';
            console.log('   ✅ ElevenLabs voiceover generated (timestamps parsing failed)');
          }
        } else {
          // Fallback to regular TTS without timestamps
          if (voiceId) {
            voiceResult = await elevenlabsService.textToSpeech(scriptResult.script, { voiceId });
          } else {
            voiceResult = await elevenlabsService.generateVoiceover(scriptResult.script, voiceStyle);
          }
          if (voiceResult.success) {
            ttsProvider = 'elevenlabs';
            console.log('   ✅ ElevenLabs voiceover generated (no timestamps)');
          }
        }
      } catch (e) {
        console.log('   ⚠️ ElevenLabs failed, falling back to Google TTS:', e.message);
      }
    }

    if (!voiceResult || !voiceResult.success) {
      voiceResult = await googleTTSService.generateVoiceover(scriptResult.script, voiceStyle);
      if (!voiceResult.success) {
        return res.status(500).json({ error: 'Failed to generate voiceover: ' + voiceResult.error });
      }
      console.log('   ✅ Google TTS voiceover generated');
    }

    // STEP 3: Generate subtitles with timing
    console.log('\n📝 Step 3: Generating subtitles...');
    let subtitles = [];
    let scenes = [];
    let estimatedDuration = voiceResult.duration || duration; // Use actual audio duration if available

    // PRIORITY 1: Use EXACT word timestamps from ElevenLabs (if available)
    if (wordTimestamps && wordTimestamps.length > 0) {
      console.log(`   🎯 Using EXACT word timestamps from ElevenLabs (${wordTimestamps.length} words)`);
      subtitles = generateSubtitlesFromTimestamps(wordTimestamps, maxWordsPerSubtitle || 3);
      
      // Use the exact duration from word timestamps
      const lastWord = wordTimestamps[wordTimestamps.length - 1];
      estimatedDuration = lastWord.end + 0.5; // Add small buffer for safety
      console.log(`   ✅ Generated ${subtitles.length} subtitle segments with EXACT timing (${estimatedDuration.toFixed(2)}s)`);
      
      // Log first few subtitle timings for debugging
      if (subtitles.length > 0) {
        console.log('   📊 Sample subtitle timings:');
        subtitles.slice(0, 3).forEach((s, i) => {
          console.log(`      ${i+1}. "${s.text}" [${s.start.toFixed(2)}s - ${s.end.toFixed(2)}s]`);
        });
      }
    } else if (subtitleGenerator) {
      // FALLBACK: Use WPM estimation (less accurate)
      console.log(`   📝 Falling back to WPM estimation (no timestamps available)`);
      try {
        // Generate sentence-level captions for readability
        const captionResult = subtitleGenerator.generateSentenceCaptions(
          scriptResult.script, 
          voiceStyle, 
          maxWordsPerSubtitle
        );
        
        subtitles = captionResult.captions || [];
        estimatedDuration = captionResult.totalDuration || duration;
        console.log(`   ✅ Generated ${subtitles.length} subtitle segments (${estimatedDuration.toFixed(1)}s)`);
      } catch (subError) {
        console.log(`   ⚠️ Subtitle generation failed: ${subError.message}`);
        // Create basic subtitles manually
        subtitles = createBasicSubtitles(scriptResult.script, duration);
        console.log(`   ✅ Created ${subtitles.length} basic subtitles as fallback`);
      }
    } else {
      // LAST FALLBACK: Basic subtitle splitting
      subtitles = createBasicSubtitles(scriptResult.script, duration);
      console.log(`   ✅ Created ${subtitles.length} basic subtitles`);
    }

    // Generate scene breakpoints from script (independent of subtitle method)
    if (useSceneVideos) {
      // PRIORITY 1: Use AI-generated scene descriptions if available
      if (aiGeneratedScenes && aiGeneratedScenes.length > 0) {
        console.log(`   🎯 Using AI-generated scene descriptions (${aiGeneratedScenes.length} scenes)`);
        
        // Safety mapping for abstract terms that AI might still return
        const abstractToConcreteMap = {
          'consistency': 'person gym workout daily',
          'discipline': 'athlete training hard',
          'motivation': 'person working out sunrise',
          'success': 'person celebrating achievement',
          'results': 'fit person showing muscles',
          'mindset': 'person meditating focus',
          'focus': 'person concentrated working',
          'key': 'person unlocking success',
          'secret': 'person revealing tip',
          'tip': 'person giving advice',
          'tips': 'person explaining teaching'
        };
        
        const sceneDuration = estimatedDuration / aiGeneratedScenes.length;
        let currentTime = 0;
          
          for (let i = 0; i < aiGeneratedScenes.length; i++) {
            const aiScene = aiGeneratedScenes[i];
            let searchTerm = aiScene.video || 'fitness workout gym';
            
            // Check if the AI returned an abstract term and map it
            const lowerTerm = searchTerm.toLowerCase();
            for (const [abstract, concrete] of Object.entries(abstractToConcreteMap)) {
              if (lowerTerm.includes(abstract)) {
                console.log(`      ⚠️ Mapping abstract "${searchTerm}" to "${concrete}"`);
                searchTerm = concrete;
                break;
              }
            }
            
            scenes.push({
              index: i,
              text: aiScene.text?.substring(0, 100) || '',
              searchTerm: searchTerm,
              startTime: currentTime,
              endTime: currentTime + sceneDuration,
              duration: sceneDuration
            });
            console.log(`      Scene ${i+1}: "${searchTerm}" (${sceneDuration.toFixed(1)}s) - from: "${aiScene.text?.substring(0, 40)}..."`);
            currentTime += sceneDuration;
          }
          console.log(`   ✅ Created ${scenes.length} scenes from AI descriptions`);
        } else {
          // FALLBACK: Extract keywords from script text
          console.log(`   📝 Falling back to keyword extraction from script...`);
        
        // Split script into sentences for scene detection
        const sentences = scriptResult.script.match(/[^.!?]+[.!?]+/g) || [scriptResult.script];
        
        // Aim for 3-5 scenes for 15 second videos
        const targetScenes = Math.min(5, Math.max(3, Math.ceil(estimatedDuration / 5))); // ~5 seconds per scene
        const sentencesPerScene = Math.max(1, Math.ceil(sentences.length / targetScenes));
        const secondsPerWord = estimatedDuration / scriptResult.script.split(' ').length;
        
        console.log(`   📊 Scene planning: ${sentences.length} sentences, targeting ${targetScenes} scenes`);
        
        // Comprehensive visual keyword mappings - maps concepts to searchable video terms
        const visualMappings = {
          // Fitness & Exercise
          'abs': 'abs workout fitness',
          'muscle': 'muscle gym workout',
          'exercise': 'exercise fitness gym',
          'workout': 'workout gym fitness',
          'plank': 'plank exercise core',
          'crunch': 'crunch abs exercise',
          'crunches': 'crunch abs exercise',
          'pushup': 'pushup exercise fitness',
          'pushups': 'pushup exercise fitness',
          'squat': 'squat exercise gym',
          'squats': 'squat exercise gym',
          'core': 'core workout abs',
          'cardio': 'running cardio fitness',
          'running': 'running jogging fitness',
          'jogging': 'jogging running outdoor',
          'strength': 'weights gym strength',
          'weights': 'weights gym training',
          'training': 'training gym fitness',
          'gym': 'gym workout fitness',
          'stretch': 'stretching yoga fitness',
          'stretching': 'stretching yoga fitness',
          'yoga': 'yoga stretching meditation',
          'meditation': 'meditation peaceful calm',
          
          // Nutrition & Food
          'nutrition': 'healthy food vegetables',
          'diet': 'healthy food salad',
          'food': 'food cooking kitchen',
          'eating': 'eating food healthy',
          'eat': 'eating food meal',
          'protein': 'protein food meat eggs',
          'calories': 'food healthy eating',
          'carbs': 'bread pasta food',
          'vegetables': 'vegetables salad healthy',
          'fruits': 'fruits healthy food',
          'meal': 'meal food cooking',
          'meals': 'meal prep cooking',
          'breakfast': 'breakfast food morning',
          'lunch': 'lunch food meal',
          'dinner': 'dinner food meal',
          'snack': 'snack healthy food',
          'water': 'water drinking glass',
          'hydration': 'water drinking hydration',
          'drink': 'drinking water beverage',
          'cooking': 'cooking kitchen food',
          'kitchen': 'kitchen cooking food',
          
          // Health & Wellness
          'health': 'healthy lifestyle wellness',
          'healthy': 'healthy food lifestyle',
          'wellness': 'wellness spa relaxation',
          'sleep': 'sleeping bedroom night',
          'sleeping': 'sleeping bed rest',
          'rest': 'rest relaxation peaceful',
          'recovery': 'rest massage recovery',
          'energy': 'energy active morning',
          'tired': 'tired rest sleeping',
          'stress': 'stress relaxation calm',
          'relax': 'relaxation spa peaceful',
          'relaxation': 'relaxation spa massage',
          
          // Body Parts
          'body': 'body fitness workout',
          'legs': 'legs workout gym',
          'arms': 'arms workout biceps',
          'back': 'back workout gym',
          'chest': 'chest workout gym',
          'shoulders': 'shoulders workout gym',
          'biceps': 'biceps arms workout',
          'triceps': 'triceps arms workout',
          
          // Success & Motivation
          'success': 'success celebration winner',
          'successful': 'success business achievement',
          'goal': 'goal target achievement',
          'goals': 'goals planning success',
          'achieve': 'achievement success winner',
          'achievement': 'achievement trophy success',
          'motivation': 'motivation inspiration sunrise',
          'motivated': 'motivation success energy',
          'inspiration': 'inspiration sunrise nature',
          'results': 'results success achievement',
          'progress': 'progress growth success',
          'improvement': 'improvement growth progress',
          'consistency': 'person training gym daily workout',
          'consistent': 'fitness routine gym training',
          'discipline': 'athlete training hard workout',
          'focus': 'person concentrated determined',
          'determination': 'athlete pushing hard workout',
          'mindset': 'person thinking meditation',
          'confidence': 'confident person success happy',
          'believe': 'person motivation success happy',
          'key': 'success achievement golden',
          'secret': 'mystery reveal success',
          'tip': 'advice helping teaching',
          'tips': 'advice helping tips',
          'important': 'attention focus important',
          'remember': 'thinking focus brain',
          'never': 'stop warning attention',
          'always': 'routine daily habit',
          'every': 'daily routine repetition',
          'first': 'start beginning number one',
          'second': 'two number second',
          'third': 'three number third',
          
          // Time & Routine
          'morning': 'morning sunrise wake',
          'night': 'night stars moon',
          'daily': 'routine calendar day',
          'routine': 'routine morning schedule',
          'schedule': 'schedule calendar planning',
          'time': 'clock time schedule',
          'minutes': 'clock timer time',
          'hours': 'clock time schedule',
          'week': 'calendar week planning',
          'month': 'calendar planning goals',
          
          // Actions
          'start': 'start beginning action',
          'begin': 'start beginning sunrise',
          'try': 'action motivation start',
          'change': 'transformation change growth',
          'transform': 'transformation change fitness',
          'build': 'building construction strength',
          'grow': 'growth nature plants',
          'learn': 'learning study education',
          'practice': 'practice training repetition',
          
          // Nature & Environment
          'nature': 'nature forest outdoor',
          'outdoor': 'outdoor nature hiking',
          'sun': 'sun sunrise outdoor',
          'sunrise': 'sunrise morning nature',
          'sunset': 'sunset evening nature',
          'beach': 'beach ocean waves',
          'ocean': 'ocean waves beach',
          'mountain': 'mountain hiking nature',
          'forest': 'forest trees nature',
          
          // Lifestyle
          'lifestyle': 'lifestyle modern living',
          'life': 'life lifestyle living',
          'living': 'living lifestyle home',
          'home': 'home living room',
          'work': 'work office business',
          'business': 'business office professional',
          'money': 'money finance wealth',
          'wealth': 'wealth money success'
        };
        
        // Helper function to extract the best search term from scene text
        const extractSceneKeywords = (sceneText, baseTopic, sceneIndex) => {
          const text = sceneText.toLowerCase();
          
          // Priority 1: Look for specific visual keywords in the scene text
          const words = text.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
          
          for (const word of words) {
            if (visualMappings[word]) {
              console.log(`      Scene ${sceneIndex + 1} keyword found: "${word}" -> "${visualMappings[word]}"`);
              return visualMappings[word];
            }
          }
          
          // Priority 2: Check for common phrases
          const phrasePatterns = [
            { pattern: /nutrition|diet|eat|food|meal/i, search: 'healthy food nutrition' },
            { pattern: /workout|exercise|training|gym/i, search: 'workout gym fitness' },
            { pattern: /sleep|rest|recovery/i, search: 'sleeping rest bedroom' },
            { pattern: /water|hydrat|drink/i, search: 'drinking water hydration' },
            { pattern: /success|goal|achieve|result/i, search: 'success achievement celebration' },
            { pattern: /motivation|inspire|believe/i, search: 'motivation inspiration sunrise' },
            { pattern: /morning|wake|start.*day/i, search: 'morning sunrise routine' },
            { pattern: /night|evening|before.*bed/i, search: 'night relaxation bedroom' },
            { pattern: /protein|muscle|strength/i, search: 'protein muscle gym' },
            { pattern: /cardio|running|jog/i, search: 'running cardio fitness' },
            { pattern: /stretch|yoga|flex/i, search: 'yoga stretching fitness' },
            { pattern: /stress|relax|calm/i, search: 'relaxation meditation calm' },
            { pattern: /energy|power|strong/i, search: 'energy fitness active' },
            { pattern: /focus|concentrat|mind/i, search: 'focus meditation concentration' },
            { pattern: /routine|habit|daily|consistent/i, search: 'routine calendar planning' },
            { pattern: /tip|advice|secret|trick/i, search: 'idea lightbulb inspiration' }
          ];
          
          for (const { pattern, search } of phrasePatterns) {
            if (pattern.test(text)) {
              console.log(`      Scene ${sceneIndex + 1} phrase match: "${pattern}" -> "${search}"`);
              return search;
            }
          }
          
          // Priority 3: Fall back to topic-based search
          const topicWords = baseTopic.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
          for (const word of topicWords) {
            if (visualMappings[word]) {
              console.log(`      Scene ${sceneIndex + 1} using topic keyword: "${word}" -> "${visualMappings[word]}"`);
              return visualMappings[word];
            }
          }
          
          // Priority 4: Use last meaningful word from topic
          const meaningfulTopicWords = topicWords.filter(w => !['tips', 'for', 'about', 'the', 'how', 'why', 'what'].includes(w));
          if (meaningfulTopicWords.length > 0) {
            const lastWord = meaningfulTopicWords[meaningfulTopicWords.length - 1];
            console.log(`      Scene ${sceneIndex + 1} using topic fallback: "${lastWord}"`);
            return lastWord + ' lifestyle';
          }
          
          return 'motivation lifestyle';
        };
        
        let currentTime = 0;
        for (let i = 0; i < sentences.length; i += sentencesPerScene) {
          const sceneSentences = sentences.slice(i, i + sentencesPerScene);
          const sceneText = sceneSentences.join(' ');
          const sceneWords = sceneText.split(' ').filter(w => w.length > 0).length;
          const sceneDuration = sceneWords * secondsPerWord;
          
          // Extract keywords from scene content to match storytelling
          const sceneIndex = scenes.length;
          const searchTerm = extractSceneKeywords(sceneText, topic, sceneIndex);
          
          console.log(`      Scene ${sceneIndex + 1}: "${sceneText.substring(0, 60)}..." -> search: "${searchTerm}"`);
          
          scenes.push({
            index: sceneIndex,
            text: sceneText.substring(0, 100),
            searchTerm: searchTerm,
            startTime: currentTime,
            endTime: currentTime + sceneDuration,
            duration: sceneDuration
          });
          
          console.log(`      Scene ${scenes.length}: "${searchTerm}" (${sceneDuration.toFixed(1)}s) - from: "${sceneText.substring(0, 50)}..."`);
          currentTime += sceneDuration;
        }
        console.log(`   ✅ Identified ${scenes.length} scenes for video matching`);
      } // Close the else block for AI scene fallback
    } // Close useSceneVideos

    // STEP 4: Get stock videos for scenes
    console.log('\n🎥 Step 4: Finding stock videos...');
    console.log(`   Scenes to match: ${scenes.length}`);
    scenes.forEach((s, i) => console.log(`      ${i+1}. "${s.searchTerm}" (${s.duration?.toFixed(1)}s)`));
    
    let sceneVideos = [];
    let backgroundVideo = null;

    if (stockVideoService) {
      if (useSceneVideos && scenes.length > 0) {
        // Get different videos for each scene
        sceneVideos = await stockVideoService.getVideosForScenes(scenes);
        console.log(`   ✅ Found ${sceneVideos.length} scene videos for ${scenes.length} scenes`);
        
        // Log each matched video
        sceneVideos.forEach((v, i) => {
          console.log(`      Video ${i+1}: ${v.source} #${v.id} for "${v.sceneSearchTerm}" (${v.useDuration?.toFixed(1)}s)`);
        });
      }
      
      // Fallback: if no scene videos found, get a single random video
      if (sceneVideos.length === 0) {
        console.log('   ⚠️ No scene videos found, trying fallback...');
        backgroundVideo = await stockVideoService.getRandomStockVideo(topic, contentType);
        if (backgroundVideo) {
          console.log(`   ✅ Found fallback video: ${backgroundVideo.source} #${backgroundVideo.id}`);
        } else {
          // Try generic abstract background
          backgroundVideo = await stockVideoService.getRandomStockVideo('abstract motion background', 'default');
          if (backgroundVideo) {
            console.log(`   ✅ Found generic fallback video: ${backgroundVideo.source} #${backgroundVideo.id}`);
          }
        }
      }
      
      // FINAL FALLBACK: Use curated background if API fails completely
      if (sceneVideos.length === 0 && !backgroundVideo) {
        console.log('   ⚠️ API returned no videos, using curated fallback...');
        const curatedBg = stockVideoService.getCuratedBackground('abstract');
        if (curatedBg) {
          backgroundVideo = {
            id: 'curated-' + Date.now(),
            source: 'curated',
            url: curatedBg.url,
            name: curatedBg.name,
            duration: 15, // Assume 15s for looping
            thumbnail: null
          };
          console.log(`   ✅ Using curated background: ${curatedBg.name}`);
        }
      }
    } else {
      console.log('   ⚠️ Stock video service not available');
    }

    // STEP 5: Start video composition (try Shotstack FIRST - most reliable)
    console.log('\n🎬 Step 5: Starting video composition...');
    let compositionJobId = null;
    let compositionError = null;
    let compositionService = null;
    
    console.log(`   Shotstack available: ${!!shotstackClient}`);
    console.log(`   Scene videos found: ${sceneVideos.length}`);
    console.log(`   Background video: ${backgroundVideo ? 'yes' : 'no'}`);
    
    // Prepare audio URL - ElevenLabs already uploads to Cloudinary, so it should already be a cloud URL
    let audioUrl = voiceResult.audioUrl;
    console.log(`   Audio URL: ${audioUrl?.includes('cloudinary') ? '✅ Already on Cloudinary' : '⚠️ Not on Cloudinary'}`);
    
    // TRY SHOTSTACK FIRST (most reliable, has watermark on free tier but works well)
    // VERSION: v6 - Use Cloudinary fetch URL to proxy Pexels videos
    // FIX: Cloudinary fetch transforms Pexels URL into Cloudinary CDN URL
    if (shotstackClient && (sceneVideos.length > 0 || backgroundVideo)) {
      console.log('   🔧 PEXELS FIX v6 - Using Cloudinary fetch URL proxy');

      // Helper function to convert Pexels URL to Cloudinary fetch URL
      const getCloudinaryFetchUrl = (pexelsUrl) => {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'ddvtwoyxp';
        // Cloudinary fetch URL format: https://res.cloudinary.com/{cloud}/video/fetch/{url}
        const encodedUrl = encodeURIComponent(pexelsUrl);
        return `https://res.cloudinary.com/${cloudName}/video/fetch/${encodedUrl}`;
      };

      try {
        if (sceneVideos.length > 1) {
          // Multi-clip composition with scene switching
          console.log(`   📤 Processing ${sceneVideos.length} scene videos for Shotstack...`);
          
          const clips = [];
          for (let idx = 0; idx < sceneVideos.length; idx++) {
            const sceneVideo = sceneVideos[idx];
            let videoUrl = sceneVideo.url;
            
            // Convert Pexels URL to Cloudinary fetch URL
            if (videoUrl.includes('pexels.com')) {
              const cloudinaryUrl = getCloudinaryFetchUrl(videoUrl);
              console.log(`   🔄 Scene ${idx + 1}: Converting Pexels to Cloudinary fetch`);
              console.log(`      From: ${videoUrl.substring(0, 60)}...`);
              console.log(`      To: ${cloudinaryUrl.substring(0, 80)}...`);
              videoUrl = cloudinaryUrl;
            }
            
            clips.push({
              url: videoUrl,
              duration: sceneVideo.duration || 10,
              useDuration: sceneVideo.useDuration || sceneVideo.playbackDuration,
              startAt: 0
            });
          }
          
          // Log final clip URLs being sent to Shotstack
          console.log(`   🎬 Final clip URLs for Shotstack:`);
          clips.forEach((c, i) => console.log(`      ${i + 1}. ${c.url.substring(0, 80)}...`));

          console.log(`   🎬 Creating multi-clip render with ${clips.length} clips...`);
          console.log(`   📊 Target duration from audio: ${estimatedDuration}s`);
          
          // Create multi-clip render - pass target duration to sync with audio
          const jobResult = await shotstackClient.createMultiClipRender(
            clips,
            audioUrl,
            subtitles,
            {
              musicVolume: 1,
              videoVolume: 0,
              targetDuration: estimatedDuration // Sync video to audio duration
            }
          );

          if (jobResult.success) {
            compositionJobId = jobResult.jobId;
            compositionService = 'shotstack';
            console.log(`   ✅ Multi-clip composition started: ${compositionJobId}`);
          } else {
            compositionError = jobResult.error || 'Multi-clip render failed';
            console.log(`   ❌ Multi-clip render failed: ${compositionError}`);
          }
        } else if (backgroundVideo || sceneVideos.length === 1) {
          // Single video composition with looping
          const video = sceneVideos[0] || backgroundVideo;
          // IMPORTANT: Download from Pexels ourselves then upload to Cloudinary
          // Use Cloudinary fetch URL to proxy Pexels videos
          let videoUrl = video.url;
          
          console.log(`   📥 Single video mode - Original URL: ${videoUrl}`);
          
          if (videoUrl.includes('pexels.com')) {
            // Convert to Cloudinary fetch URL
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'ddvtwoyxp';
            const encodedUrl = encodeURIComponent(videoUrl);
            videoUrl = `https://res.cloudinary.com/${cloudName}/video/fetch/${encodedUrl}`;
            console.log(`   🔄 Converted to Cloudinary fetch URL`);
          }

          console.log(`   🎬 Creating single video render...`);
          console.log(`   Video URL: ${videoUrl}`);
          console.log(`   Audio URL: ${audioUrl}`);
          console.log(`   Subtitles: ${subtitles.length}`);
          
          const jobResult = await shotstackClient.createShotstackRender(
            videoUrl,
            audioUrl,
            subtitles,
            {
              duration: estimatedDuration,
              musicVolume: 1,
              videoVolume: 0,
              loopVideo: true,
              videoDurationOriginal: video.duration
            }
          );

          if (jobResult.success) {
            compositionJobId = jobResult.jobId;
            compositionService = 'shotstack';
            console.log(`   ✅ Single video composition started: ${compositionJobId}`);
          } else {
            compositionError = jobResult.error || 'Single video render failed';
            console.log(`   ❌ Single video render failed: ${compositionError}`);
          }
        }
      } catch (renderError) {
        compositionError = renderError.message;
        console.log(`   ❌ Shotstack render error: ${compositionError}`);
      }
    }
    
    // Final status
    if (!compositionJobId && !compositionService) {
      if (!shotstackClient) {
        compositionError = 'No video composition service available (configure SHOTSTACK_API_KEY)';
      } else if (sceneVideos.length === 0 && !backgroundVideo) {
        compositionError = 'No stock videos found for composition';
      }
      console.log(`   ⚠️ ${compositionError}`);
    }

    // Return result
    const result = {
      success: true,
      script: scriptResult.script,
      audioUrl: voiceResult.audioUrl,
      ttsProvider,
      subtitles,
      subtitleCount: subtitles.length,
      estimatedDuration,
      scenes: scenes.map(s => ({ index: s.index, searchTerm: s.searchTerm, duration: s.duration })),
      sceneCount: scenes.length,
      videos: sceneVideos.map(v => ({ source: v.source, id: v.id, sceneIndex: v.sceneIndex, url: v.url })),
      backgroundVideo: backgroundVideo ? { source: backgroundVideo.source, id: backgroundVideo.id, url: backgroundVideo.url } : null,
      compositionJobId,
      compositionService: compositionService || null,
      compositionError,
      compositionStatus: compositionJobId ? 'processing' : 'failed',
      message: compositionJobId 
        ? `Video composition started with ${compositionService}` 
        : `Voiceover generated but video composition failed: ${compositionError || 'Unknown error'}. You can download the audio and combine it with video manually.`
    };

    console.log('\n✅ Enhanced voiceover video generation complete');
    console.log(`   Composition Job: ${compositionJobId || 'none'}`);
    console.log(`   Service: ${compositionService || 'none'}`);
    
    res.json(result);

  } catch (error) {
    console.error('Enhanced voiceover video error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper: Extract search keywords from text with optional topic context
 * Improved to generate better video search queries
 */
function extractSearchKeywords(text, topicContext = '') {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
    'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
    'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'also',
    'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
    'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'our',
    'their', 'what', 'which', 'who', 'about', 'get', 'make', 'let', 'dont', 'here',
    'know', 'think', 'like', 'want', 'see', 'come', 'go', 'thing', 'things',
    'really', 'even', 'new', 'way', 'one', 'two', 'first', 'now', 'heres'
  ]);

  // Extract words from the scene text
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  // Get unique meaningful words
  const uniqueWords = [...new Set(words)];
  
  // If we found good keywords, use them
  if (uniqueWords.length >= 2) {
    return uniqueWords.slice(0, 3).join(' ');
  }
  
  // Fallback: use topic context if scene didn't have good keywords
  if (topicContext) {
    const topicWords = topicContext.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
    
    if (topicWords.length > 0) {
      // Combine scene words with topic for better results
      const combined = [...uniqueWords, ...topicWords].slice(0, 3);
      return combined.join(' ') || topicContext;
    }
  }
  
  return uniqueWords.slice(0, 3).join(' ') || 'abstract motion background';
}

/**
 * Helper: Use AI to generate video search keywords for each scene
 * This ensures videos are DIRECTLY related to both the topic AND the script content
 */
async function generateAIVideoKeywords(topic, script, numScenes, openaiService) {
  try {
    if (!openaiService || !openaiService.client) {
      console.log('   ⚠️ OpenAI not available for video keywords, using fallback');
      return getFallbackVideoKeywords(topic, numScenes);
    }

    const prompt = `You are a stock video search expert. Given a topic and script, generate ${numScenes} different video search queries that would find VISUALLY RELEVANT stock footage on Pexels.

TOPIC: "${topic}"

SCRIPT: "${script.substring(0, 500)}"

Generate ${numScenes} video search queries. Each query should:
1. Be 2-4 words that describe a VISUAL scene (not abstract concepts)
2. Be directly related to the topic "${topic}"
3. Be something that would have good stock video results on Pexels
4. Be different from each other for visual variety

IMPORTANT: Focus on VISUAL, CONCRETE things that can be filmed:
- ✅ Good: "person counting money", "luxury car driving", "gym workout training"
- ❌ Bad: "success mindset", "financial freedom", "motivation tips"

Return ONLY a JSON array of ${numScenes} search strings, nothing else.
Example: ["business meeting office", "money cash counting", "success celebration"]`;

    const response = await openaiService.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 200
    });

    const content = response.choices[0]?.message?.content?.trim();
    
    // Parse JSON response
    try {
      const keywords = JSON.parse(content);
      if (Array.isArray(keywords) && keywords.length > 0) {
        console.log(`   ✅ AI generated keywords: ${keywords.join(', ')}`);
        return keywords;
      }
    } catch (parseError) {
      // Try to extract keywords from non-JSON response
      const matches = content.match(/"([^"]+)"/g);
      if (matches && matches.length > 0) {
        const keywords = matches.map(m => m.replace(/"/g, ''));
        console.log(`   ✅ AI keywords (parsed): ${keywords.join(', ')}`);
        return keywords;
      }
    }

    console.log('   ⚠️ AI response not parseable, using fallback');
    return getFallbackVideoKeywords(topic, numScenes);

  } catch (error) {
    console.log(`   ⚠️ AI keyword generation failed: ${error.message}, using fallback`);
    return getFallbackVideoKeywords(topic, numScenes);
  }
}

/**
 * Helper: Fallback video keywords when AI is not available
 */
function getFallbackVideoKeywords(topic, numScenes) {
  const cleanTopic = topic.toLowerCase().trim();
  
  // Visual keyword mappings for common topics - USE SPECIFIC PEXELS-FRIENDLY TERMS
  const VISUAL_KEYWORDS = {
    // Fitness related
    'abs': ['abs workout gym', 'fitness training core', 'gym exercise athletic', 'person doing crunches', 'fitness motivation gym', 'athletic body workout'],
    'fitness': ['gym workout weights', 'running jogging outdoor', 'yoga stretching exercise', 'athlete training sports', 'person exercising gym', 'fitness motivation'],
    'gym': ['gym workout weights', 'fitness training exercise', 'person lifting weights', 'athletic gym training', 'muscle workout fitness', 'gym equipment exercise'],
    'workout': ['workout gym fitness', 'exercise training athletic', 'person exercising gym', 'fitness motivation training', 'home workout exercise', 'athletic training sports'],
    'exercise': ['exercise fitness gym', 'person working out', 'athletic training sports', 'yoga fitness stretching', 'running jogging outdoor', 'gym exercise equipment'],
    
    // Money related
    'money': ['person counting money', 'luxury car driving', 'business office meeting', 'wealthy lifestyle mansion', 'cash dollars bills', 'shopping luxury store'],
    'finance': ['stock market trading', 'business meeting office', 'laptop computer working', 'city skyline business', 'professional handshake', 'money counting cash'],
    'wealth': ['luxury lifestyle mansion', 'expensive car driving', 'business success celebration', 'wealthy person lifestyle', 'money cash counting', 'luxury shopping store'],
    
    // Business related
    'business': ['office meeting team', 'laptop working coffee', 'handshake business deal', 'city skyline buildings', 'presentation boardroom', 'entrepreneur working'],
    'entrepreneur': ['startup office working', 'laptop coffee working', 'business meeting team', 'presentation success', 'office professional work', 'hustle motivation'],
    
    // Health related
    'health': ['healthy food vegetables', 'person exercising outdoors', 'yoga meditation peaceful', 'doctor medical healthcare', 'nature walking hiking', 'wellness spa relaxation'],
    'diet': ['healthy food preparation', 'vegetables cooking kitchen', 'healthy eating lifestyle', 'salad preparation fresh', 'nutrition food healthy', 'cooking healthy meal'],
    
    // Motivation related
    'motivation': ['sunrise mountain peak', 'person running athlete', 'victory celebration winner', 'ocean waves peaceful', 'city lights night', 'nature landscape beautiful'],
    'success': ['celebration confetti party', 'trophy award winning', 'business handshake deal', 'luxury lifestyle car', 'graduation achievement', 'mountain peak summit'],
    'tips': ['professional explaining teaching', 'laptop working office', 'person speaking camera', 'writing notes planning', 'education learning study', 'office work professional'],
    
    // Lifestyle related  
    'travel': ['airplane flying clouds', 'beach vacation tropical', 'city tourism sightseeing', 'backpacker hiking nature', 'road trip driving scenic', 'passport luggage airport'],
    'food': ['cooking kitchen chef', 'restaurant dining meal', 'food preparation ingredients', 'eating delicious plate', 'kitchen cooking healthy', 'cafe coffee breakfast'],
    'technology': ['computer coding programming', 'smartphone mobile apps', 'futuristic digital technology', 'robot automation modern', 'data center servers', 'tech startup office'],
    'love': ['couple romantic together', 'wedding ceremony love', 'holding hands walking', 'sunset romantic beach', 'family happy together', 'proposal engagement ring'],
  };

  // Find matching keywords - check each word in the topic
  const topicWords = cleanTopic.split(/\s+/);
  for (const word of topicWords) {
    if (VISUAL_KEYWORDS[word]) {
      const shuffled = VISUAL_KEYWORDS[word].sort(() => Math.random() - 0.5);
      console.log(`   📹 Fallback matched "${word}" -> ${shuffled.slice(0, numScenes).join(', ')}`);
      return shuffled.slice(0, numScenes);
    }
  }
  
  // Also check if topic contains any keyword
  for (const [key, visuals] of Object.entries(VISUAL_KEYWORDS)) {
    if (cleanTopic.includes(key)) {
      const shuffled = visuals.sort(() => Math.random() - 0.5);
      console.log(`   📹 Fallback matched (contains) "${key}" -> ${shuffled.slice(0, numScenes).join(', ')}`);
      return shuffled.slice(0, numScenes);
    }
  }

  // Generic fallback - use topic directly with visual modifiers
  console.log(`   📹 No match found, using topic directly: ${topic}`);
  return [
    `${cleanTopic}`,
    `${cleanTopic} lifestyle`,
    `${cleanTopic} professional`,
    `person ${cleanTopic}`,
    'lifestyle motivation',
    'professional working'
  ].slice(0, numScenes);
}

/**
 * Helper: Create basic subtitles from script when subtitleGenerator fails
 * @param {string} script - The script text
 * @param {number} duration - Target duration in seconds
 * @returns {Array} - Array of subtitle objects with text, start, end
 */
/**
 * Convert ElevenLabs character-level timestamps to word timestamps
 * This enables EXACT subtitle timing based on actual speech
 */
function convertCharTimestampsToWords(text, characters, startTimes, endTimes) {
  const words = [];
  let currentWord = '';
  let wordStart = null;
  let wordEnd = null;
  
  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    const startTime = startTimes[i];
    const endTime = endTimes[i];
    
    if (char === ' ' || char === '\n' || char === '\t') {
      // End of word
      if (currentWord.length > 0 && wordStart !== null) {
        words.push({
          word: currentWord,
          start: wordStart,
          end: wordEnd
        });
      }
      currentWord = '';
      wordStart = null;
      wordEnd = null;
    } else {
      // Part of a word
      if (wordStart === null) {
        wordStart = startTime;
      }
      currentWord += char;
      wordEnd = endTime;
    }
  }
  
  // Don't forget the last word
  if (currentWord.length > 0 && wordStart !== null) {
    words.push({
      word: currentWord,
      start: wordStart,
      end: wordEnd
    });
  }
  
  return words;
}

/**
 * Generate subtitles from EXACT word timestamps (ElevenLabs timestamps API)
 * Groups words into readable chunks with REAL timing
 */
function generateSubtitlesFromTimestamps(wordTimestamps, maxWordsPerChunk = 3) {
  const subtitles = [];
  
  for (let i = 0; i < wordTimestamps.length; i += maxWordsPerChunk) {
    const chunk = wordTimestamps.slice(i, i + maxWordsPerChunk);
    if (chunk.length === 0) continue;
    
    const text = chunk.map(w => w.word).join(' ');
    const start = chunk[0].start;
    const end = chunk[chunk.length - 1].end;
    
    subtitles.push({
      text: text,
      start: parseFloat(start.toFixed(3)),
      end: parseFloat(end.toFixed(3))
    });
  }
  
  return subtitles;
}

function createBasicSubtitles(script, duration = 15) {
  const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
  const totalWords = script.split(' ').filter(w => w.length > 0).length;
  const secondsPerWord = duration / totalWords;
  
  const subtitles = [];
  let currentTime = 0;
  
  for (const sentence of sentences) {
    const sentenceText = sentence.trim();
    const words = sentenceText.split(' ').filter(w => w.length > 0);
    
    // Split long sentences into chunks of max 6 words
    const maxWords = 6;
    for (let i = 0; i < words.length; i += maxWords) {
      const chunk = words.slice(i, i + maxWords);
      const chunkText = chunk.join(' ');
      const chunkDuration = chunk.length * secondsPerWord;
      
      subtitles.push({
        text: chunkText,
        start: parseFloat(currentTime.toFixed(2)),
        end: parseFloat((currentTime + chunkDuration).toFixed(2))
      });
      
      currentTime += chunkDuration;
    }
    
    // Small pause after each sentence
    currentTime += 0.2;
  }
  
  return subtitles;
}

/**
 * Compose video with audio using Shotstack
 * Loops the video to match audio duration
 * POST /api/ai/compose-video
 */
router.post('/compose-video', async (req, res) => {
  try {
    if (!shotstackClient) {
      return res.status(500).json({ error: 'Shotstack service not available' });
    }

    let { videoUrl, audioUrl, audioDuration, subtitles = [], soundEffects = [] } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    console.log('🎬 Composing video with Shotstack...');
    console.log('   Video:', videoUrl);
    console.log('   Audio:', audioUrl || 'none');
    console.log('   Duration:', audioDuration || 'auto');
    console.log('   Subtitles:', subtitles.length);

    // Upload video to Cloudinary if it's a temporary URL
    if (cloudinaryUpload && (videoUrl.includes('replicate.delivery') || videoUrl.includes('pexels.com') || videoUrl.includes('pixabay.com'))) {
      console.log('📤 Uploading video to Cloudinary for persistent URL...');
      try {
        const videoResponse = await fetch(videoUrl);
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
        const uploadResult = await cloudinaryUpload(videoBuffer, {
          folder: 'instamarketing/composed',
          resource_type: 'video'
        });
        if (uploadResult.success) {
          videoUrl = uploadResult.url;
          console.log('✅ Video uploaded:', videoUrl);
        }
      } catch (uploadErr) {
        console.error('⚠️ Video upload failed:', uploadErr.message);
      }
    }

    // Upload audio to Cloudinary if needed
    if (cloudinaryUpload && audioUrl && audioUrl.includes('replicate.delivery')) {
      console.log('📤 Uploading audio to Cloudinary...');
      try {
        const audioResponse = await fetch(audioUrl);
        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
        const uploadResult = await cloudinaryUpload(audioBuffer, {
          folder: 'instamarketing/audio',
          resource_type: 'video'
        });
        if (uploadResult.success) {
          audioUrl = uploadResult.url;
          console.log('✅ Audio uploaded:', audioUrl);
        }
      } catch (uploadErr) {
        console.error('⚠️ Audio upload failed:', uploadErr.message);
      }
    }

    // Create Shotstack render with looping support
    const jobResult = await shotstackClient.createShotstackRender(
      videoUrl,
      audioUrl,
      subtitles,
      {
        duration: audioDuration || 30,
        musicVolume: 1,
        videoVolume: 0, // Mute original video
        soundEffects,
        loopVideo: true // Enable video looping
      }
    );

    if (jobResult.success && jobResult.jobId) {
      console.log('✅ Shotstack job started:', jobResult.jobId);
      res.json({
        success: true,
        jobId: jobResult.jobId,
        message: 'Video composition started'
      });
    } else {
      throw new Error('Failed to start Shotstack render');
    }
  } catch (error) {
    console.error('Compose video error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Compose video with multiple clips stitched together
 * POST /api/ai/compose-video/multi-clip
 */
router.post('/compose-video/multi-clip', async (req, res) => {
  try {
    if (!shotstackClient) {
      return res.status(500).json({ error: 'Shotstack service not available' });
    }

    const { clips, audioUrl, audioDuration, subtitles = [] } = req.body;

    if (!clips || !Array.isArray(clips) || clips.length === 0) {
      return res.status(400).json({ error: 'At least one video clip is required' });
    }

    console.log(`🎬 Composing multi-clip video (${clips.length} clips)...`);

    // Upload all clips to Cloudinary for persistent URLs
    const uploadedClips = [];
    for (const clip of clips) {
      let url = clip.url;
      
      if (cloudinaryUpload && (url.includes('pexels.com') || url.includes('pixabay.com'))) {
        try {
          const response = await fetch(url);
          const buffer = Buffer.from(await response.arrayBuffer());
          const result = await cloudinaryUpload(buffer, {
            folder: 'instamarketing/clips',
            resource_type: 'video'
          });
          if (result.success) {
            url = result.url;
          }
        } catch (e) {
          console.error('Clip upload failed:', e.message);
        }
      }

      uploadedClips.push({
        ...clip,
        url
      });
    }

    // Build multi-clip timeline
    const jobResult = await shotstackClient.createMultiClipRender(
      uploadedClips,
      audioUrl,
      subtitles,
      { duration: audioDuration }
    );

    if (jobResult.success && jobResult.jobId) {
      console.log('✅ Multi-clip job started:', jobResult.jobId);
      res.json({
        success: true,
        jobId: jobResult.jobId,
        message: 'Multi-clip video composition started'
      });
    } else {
      throw new Error('Failed to start multi-clip render');
    }
  } catch (error) {
    console.error('Multi-clip compose error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check video composition render status
 * Uses Shotstack for video rendering
 * GET /api/ai/compose-video/status/:jobId
 */
router.get('/compose-video/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const service = req.query.service;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    console.log(`📊 Checking render status for ${jobId} (service: ${service || 'shotstack'})`);

    let status = null;

    // Check Shotstack
    if (shotstackClient) {
      try {
        console.log('   Checking Shotstack...');
        status = await shotstackClient.getRenderStatus(jobId);
        if (status) {
          console.log(`   Shotstack status: ${status.status}`);
          return res.json({
            success: true,
            service: 'shotstack',
            ...status
          });
        }
      } catch (e) {
        console.log(`   Shotstack check failed: ${e.message}`);
        return res.status(500).json({ error: e.message, service: 'shotstack' });
      }
    }

    // No service could provide status
    return res.status(404).json({ 
      error: 'Could not find render job',
      jobId,
      servicesChecked: shotstackClient ? ['shotstack'] : []
    });
  } catch (error) {
    console.error('Compose status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Website Scraper Routes ====================

// Load website scraper service
let websiteScraperService = null;
try {
  websiteScraperService = require('../services/websiteScraper');
  console.log('✅ Website scraper service loaded');
} catch (e) {
  console.log('Website scraper not available:', e.message);
}

/**
 * Fetch and extract data from a website
 * POST /api/ai/fetch-website
 */
router.post('/fetch-website', async (req, res) => {
  try {
    const { url, deep = true } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Website URL is required' });
    }

    if (!websiteScraperService) {
      return res.status(503).json({ error: 'Website scraper service not available' });
    }

    console.log(`🌐 Fetching website data: ${url} (deep: ${deep})`);

    // Use deep scraping to get more images from sub-pages
    const result = deep && websiteScraperService.scrapeWebsiteDeep
      ? await websiteScraperService.scrapeWebsiteDeep(url, true)
      : await websiteScraperService.scrapeWebsite(url);

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to fetch website' });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Website fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Validate if an image URL is accessible
 * POST /api/ai/validate-image
 */
router.post('/validate-image', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    if (!websiteScraperService) {
      return res.status(503).json({ error: 'Website scraper service not available' });
    }

    const isValid = await websiteScraperService.validateImage(imageUrl);

    res.json({
      success: true,
      valid: isValid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== VIDEO-FIRST GENERATION ====================
// NEW APPROACH: Select videos FIRST, then generate script to match their durations
// This ensures perfect sync between visuals and voiceover

// Load curated videos service
let curatedVideosService = null;
try {
  curatedVideosService = require('../services/curatedVideos');
  console.log('✅ Curated videos service loaded for Video-First approach');
} catch (e) {
  console.log('Curated videos not available:', e.message);
}

/**
 * VIDEO-FIRST Generation Pipeline
 * 1. Select best curated videos for topic (EXACT durations known)
 * 2. Generate script that FITS those video durations
 * 3. Generate voiceover synced to video timing
 * 4. Generate subtitles from voiceover timestamps
 * 5. Render final video with Shotstack
 * 
 * POST /api/ai/generate-video-first
 */
router.post('/generate-video-first', async (req, res) => {
  try {
    const {
      topic,
      contentType = 'motivation', // fitness, health, motivation, hooks
      targetDuration = 15, // Target video length in seconds
      voiceId = null, // ElevenLabs voice ID
      maxWordsPerSubtitle = 3
    } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    console.log('\n🎬 ========== VIDEO-FIRST GENERATION ==========');
    console.log(`   Topic: "${topic}"`);
    console.log(`   Content Type: ${contentType}`);
    console.log(`   Target Duration: ${targetDuration}s`);

    // ==================== STEP 1: SELECT VIDEOS FIRST ====================
    console.log('\n📹 STEP 1: Selecting curated videos FIRST...');
    
    let selectedVideos = [];
    let totalVideoDuration = 0;
    
    if (curatedVideosService) {
      // Get 3-5 videos that fit our target duration
      const numScenes = Math.ceil(targetDuration / 5); // ~5 seconds per scene
      
      // Extract keywords from topic for video matching
      const topicKeywords = topic.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3);
      
      console.log(`   Looking for ${numScenes} scenes, keywords: ${topicKeywords.join(', ')}`);
      
      // Build scene requests
      const sceneRequests = [];
      for (let i = 0; i < numScenes; i++) {
        // Rotate through keywords for variety
        const keyword = topicKeywords[i % topicKeywords.length] || contentType;
        sceneRequests.push({
          index: i,
          searchTerm: keyword,
          duration: Math.min(5, targetDuration / numScenes) // Each scene ~5s
        });
      }
      
      // Get curated videos for each scene
      selectedVideos = curatedVideosService.getCuratedVideosForScenes(sceneRequests, contentType);
      
      if (selectedVideos.length === 0) {
        // Fallback: get random defaults
        console.log('   ⚠️ No curated videos found, using defaults...');
        for (let i = 0; i < numScenes; i++) {
          const defaultVideo = curatedVideosService.getRandomDefault(contentType);
          if (defaultVideo) {
            selectedVideos.push({
              ...defaultVideo,
              sceneIndex: i,
              useDuration: Math.min(5, targetDuration / numScenes)
            });
          }
        }
      }
      
      // Calculate total video duration
      totalVideoDuration = selectedVideos.reduce((sum, v) => sum + (v.useDuration || v.duration || 5), 0);
      
      console.log(`   ✅ Selected ${selectedVideos.length} videos (total: ${totalVideoDuration.toFixed(1)}s)`);
      selectedVideos.forEach((v, i) => {
        console.log(`      ${i + 1}. "${v.description}" (${v.useDuration || v.duration}s) - matched: ${v.matchedKeyword}`);
      });
    } else {
      console.log('   ⚠️ Curated videos service not available');
      totalVideoDuration = targetDuration;
    }

    // ==================== STEP 2: GENERATE SCRIPT TO FIT VIDEO DURATIONS ====================
    console.log('\n📝 STEP 2: Generating script to FIT video durations...');
    
    // Calculate words based on video duration (2.5 words/second speaking rate)
    const maxWords = Math.floor(totalVideoDuration * 2.5);
    
    // Build scene descriptions for GPT
    const sceneDescriptions = selectedVideos.map((v, i) => 
      `Scene ${i + 1} (${v.useDuration || v.duration}s): ${v.description}`
    ).join('\n');
    
    let script = '';
    try {
      const scriptPrompt = `You are a viral video scriptwriter. Write a script for this ${totalVideoDuration.toFixed(0)}-second video.

TOPIC: "${topic}"

VIDEO SCENES (write script that matches these visuals):
${sceneDescriptions || `Single scene (${totalVideoDuration}s): Generic ${contentType} content`}

RULES:
1. MAXIMUM ${maxWords} words total (VERY IMPORTANT - video is ${totalVideoDuration.toFixed(0)} seconds)
2. Write script that MATCHES what's happening in each scene
3. Use viral hooks: questions, bold claims, or curiosity gaps
4. End with a call-to-action
5. Be punchy and conversational

Return ONLY the script text, no scene labels or directions.`;

      const scriptResult = await openaiService.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: scriptPrompt }],
        max_tokens: 300,
        temperature: 0.8
      });
      
      script = scriptResult.choices[0]?.message?.content?.trim() || '';
      
      // Verify word count
      const wordCount = script.split(/\s+/).length;
      console.log(`   ✅ Script generated: ${wordCount} words for ${totalVideoDuration.toFixed(1)}s video`);
      
      if (wordCount > maxWords * 1.2) {
        console.log(`   ⚠️ Script too long (${wordCount} > ${maxWords}), may need trimming`);
      }
    } catch (scriptError) {
      console.error('   ❌ Script generation failed:', scriptError.message);
      // Fallback script
      script = `Here's something amazing about ${topic}. This is going to change everything. Don't miss this. Follow for more!`;
    }
    
    console.log(`   📜 Script: "${script.substring(0, 100)}..."`);

    // ==================== STEP 3: GENERATE VOICEOVER WITH TIMESTAMPS ====================
    console.log('\n🎤 STEP 3: Generating voiceover with EXACT timestamps...');
    
    let voiceResult = null;
    let wordTimestamps = null;
    let audioDuration = totalVideoDuration;
    
    if (elevenlabsService && elevenlabsService.isAvailable()) {
      try {
        // Use timestamps API for EXACT word timing
        if (typeof elevenlabsService.textToSpeechWithTimestamps === 'function') {
          voiceResult = await elevenlabsService.textToSpeechWithTimestamps(script, { 
            voiceId: voiceId || undefined 
          });
          
          if (voiceResult.success && voiceResult.wordTimings?.length > 0) {
            wordTimestamps = voiceResult.wordTimings;
            // Get actual audio duration from last word
            const lastWord = wordTimestamps[wordTimestamps.length - 1];
            audioDuration = lastWord.end + 0.3; // Small buffer
            console.log(`   ✅ Voiceover with ${wordTimestamps.length} word timestamps (${audioDuration.toFixed(2)}s)`);
          } else if (voiceResult.success) {
            console.log('   ✅ Voiceover generated (no timestamps)');
          }
        } else {
          // Fallback to regular TTS
          voiceResult = await elevenlabsService.textToSpeech(script, { 
            voiceId: voiceId || '21m00Tcm4TlvDq8ikWAM' 
          });
        }
      } catch (e) {
        console.error('   ❌ ElevenLabs error:', e.message);
      }
    }
    
    if (!voiceResult || !voiceResult.success) {
      console.log('   ⚠️ Falling back to Google TTS...');
      voiceResult = await googleTTSService.generateVoiceover(script, 'energetic');
    }
    
    if (!voiceResult.success) {
      return res.status(500).json({ error: 'Failed to generate voiceover' });
    }

    // ==================== STEP 4: GENERATE SUBTITLES ====================
    console.log('\n📝 STEP 4: Generating subtitles...');
    
    let subtitles = [];
    
    if (wordTimestamps && wordTimestamps.length > 0) {
      // Use EXACT timestamps from ElevenLabs
      subtitles = generateSubtitlesFromTimestamps(wordTimestamps, maxWordsPerSubtitle);
      console.log(`   ✅ ${subtitles.length} subtitle segments with EXACT timing`);
    } else {
      // Fallback: estimate timing based on word count
      subtitles = createBasicSubtitles(script, audioDuration);
      console.log(`   ✅ ${subtitles.length} subtitle segments (estimated timing)`);
    }

    // ==================== STEP 5: RENDER VIDEO WITH SHOTSTACK ====================
    console.log('\n🎬 STEP 5: Rendering video with Shotstack...');
    
    let compositionJobId = null;
    let compositionError = null;
    
    if (shotstackClient && selectedVideos.length > 0) {
      try {
        // Videos are already on Cloudinary - use directly!
        const uploadedClips = selectedVideos.map(video => ({
          url: video.url, // Already Cloudinary URL
          duration: video.duration || 10,
          useDuration: video.useDuration || 5,
          startAt: 0
        }));
        
        console.log(`   ⚡ Using ${uploadedClips.length} Cloudinary-hosted videos`);
        
        // Audio: ElevenLabs service already uploads to Cloudinary, so skip re-upload
        let audioUrl = voiceResult.audioUrl;
        console.log(`   Audio URL: ${audioUrl?.includes('cloudinary') ? '✅ Already on Cloudinary' : '⚠️ Not on Cloudinary'}`);
        
        // Create multi-clip render
        console.log(`   🎬 Creating ${uploadedClips.length}-clip render synced to ${audioDuration.toFixed(2)}s audio...`);
        
        const jobResult = await shotstackClient.createMultiClipRender(
          uploadedClips,
          audioUrl,
          subtitles,
          {
            musicVolume: 1,
            videoVolume: 0,
            targetDuration: audioDuration
          }
        );
        
        if (jobResult.success) {
          compositionJobId = jobResult.jobId;
          console.log(`   ✅ Render job started: ${compositionJobId}`);
        } else {
          compositionError = jobResult.error;
          console.log(`   ❌ Render failed: ${compositionError}`);
        }
      } catch (renderError) {
        compositionError = renderError.message;
        console.error('   ❌ Render error:', compositionError);
      }
    } else {
      compositionError = 'Shotstack not available or no videos selected';
    }

    // ==================== RETURN RESULT ====================
    console.log('\n✅ ========== VIDEO-FIRST GENERATION COMPLETE ==========');
    
    const result = {
      success: true,
      approach: 'VIDEO-FIRST',
      topic,
      script,
      audioUrl: voiceResult.audioUrl,
      audioDuration: audioDuration.toFixed(2),
      videos: selectedVideos.map(v => ({
        description: v.description,
        duration: v.useDuration || v.duration,
        matchedKeyword: v.matchedKeyword,
        url: v.url
      })),
      totalVideoDuration: totalVideoDuration.toFixed(2),
      subtitles,
      subtitleCount: subtitles.length,
      hasExactTimestamps: !!wordTimestamps,
      compositionJobId,
      compositionError,
      compositionStatus: compositionJobId ? 'processing' : 'failed',
      message: compositionJobId 
        ? 'Video-First generation started! Poll /api/ai/compose-video/status/:jobId for result.'
        : `Generation completed but rendering failed: ${compositionError}`
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('Video-First generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
