/**
 * Advanced AI Video Generator Service
 * Implements best practices for high-quality AI video generation
 */

const Replicate = require('replicate');
const { v4: uuidv4 } = require('uuid');
const videoEnhancer = require('./videoEnhancer');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

/**
 * VIDEO GENERATION MODELS with their capabilities
 */
const VIDEO_MODELS = {
  // High quality text-to-video
  'damo-text2video': {
    version: '1e205ea73084bd17a0a3b43396e49ba0d6bc2e754e9283b2df49fad2dcf95755',
    name: 'DAMO Text-to-Video',
    maxFrames: 16,
    defaultFps: 8,
    supportsNegativePrompt: true,
    quality: 'medium',
    speed: 'fast'
  },
  // Stable Video Diffusion - Image to Video
  'stable-video-diffusion': {
    version: '3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
    name: 'Stable Video Diffusion',
    type: 'image-to-video',
    maxFrames: 25,
    defaultFps: 6,
    supportsNegativePrompt: false,
    quality: 'high',
    speed: 'medium'
  },
  // AnimateDiff for consistent animation
  'animatediff': {
    version: 'beecf59c4aee8d81fc04b0381033f7e7c1c5c42f43ea5a7f9e4b2b8b9f8a3c74',
    name: 'AnimateDiff',
    maxFrames: 16,
    defaultFps: 8,
    supportsNegativePrompt: true,
    quality: 'high',
    speed: 'slow'
  },
  // Minimax (Hailuo) - High Quality & Longer
  'minimax': {
    version: '5aa835260ff7f40f4069c41185f72036accf99e29957bb4a3b3a911f3b6c1912',
    name: 'Minimax Video-01',
    maxFrames: 150, // 6s * 25fps
    defaultFps: 25,
    supportsNegativePrompt: false,
    quality: 'premium',
    speed: 'slow'
  }
};

/**
 * PROMPT TEMPLATES for different content types
 */
const PROMPT_TEMPLATES = {
  'product_showcase': {
    structure: '[product] rotating slowly on [background], [lighting], studio photography, commercial quality',
    defaults: {
      background: 'clean white background',
      lighting: 'soft studio lighting'
    }
  },
  'lifestyle': {
    structure: '[subject] [action] in [location], [style], natural lighting, lifestyle photography',
    defaults: {
      style: 'modern aesthetic'
    }
  },
  'testimonial': {
    structure: '[person_description] speaking to camera, [setting], professional lighting, corporate video',
    defaults: {
      setting: 'modern office background'
    }
  },
  'tutorial': {
    structure: '[action] demonstration, [setting], clear focus, educational content, step by step',
    defaults: {
      setting: 'clean workspace'
    }
  },
  'cinematic': {
    structure: '[shot_type] of [subject] [action], [style], cinematic lighting, film quality, shallow depth of field',
    defaults: {
      style: 'dramatic cinematic'
    }
  },
  'social_hook': {
    structure: '[attention_grabber], vibrant colors, high energy, social media optimized, engaging',
    defaults: {}
  }
};

/**
 * Advanced AI Video Generator
 */
class AdvancedVideoGenerator {
  constructor() {
    this.activeJobs = new Map();
  }

  /**
   * BUILD OPTIMIZED PROMPT using structured approach
   */
  buildOptimizedPrompt(options) {
    const {
      template = null,
      subject = '',
      action = '',
      shotType = 'medium',
      style = 'cinematic',
      cameraMovement = 'static',
      lighting = 'natural',
      setting = '',
      mood = '',
      audioCues = '',
      customPrompt = '',
      negatives = []
    } = options;

    // Shot type descriptions
    const shotTypes = {
      'extreme_close_up': 'extreme close-up showing fine details',
      'close_up': 'close-up shot capturing expression and emotion',
      'medium_close_up': 'medium close-up from chest up',
      'medium': 'medium shot showing subject from waist up',
      'medium_wide': 'medium wide shot showing full body with some environment',
      'wide': 'wide shot establishing scene and context',
      'extreme_wide': 'extreme wide establishing shot showing vast landscape',
      'aerial': 'aerial drone shot from above',
      'pov': 'point of view shot from subject perspective',
      'tracking': 'tracking shot following the subject',
      'dutch': 'dutch angle tilted shot for dramatic effect',
      'low_angle': 'low angle shot looking up at subject',
      'high_angle': 'high angle shot looking down at subject'
    };

    // Camera movement descriptions
    const cameraMovements = {
      'static': 'locked off static camera',
      'pan_left': 'smooth panning left',
      'pan_right': 'smooth panning right',
      'tilt_up': 'tilting upward',
      'tilt_down': 'tilting downward',
      'zoom_in': 'slow zoom in',
      'zoom_out': 'slow zoom out',
      'dolly_in': 'dolly pushing in toward subject',
      'dolly_out': 'dolly pulling back from subject',
      'tracking': 'tracking alongside subject',
      'orbit': 'orbiting around subject',
      'crane_up': 'crane rising up',
      'crane_down': 'crane descending',
      'steadicam': 'smooth steadicam movement',
      'handheld': 'subtle handheld organic movement'
    };

    // Style presets
    const styles = {
      'cinematic': 'cinematic film look, professional color grading, shallow depth of field, 35mm film',
      'commercial': 'commercial production quality, perfect lighting, vibrant colors, polished',
      'documentary': 'documentary style, natural lighting, authentic feel, realistic',
      'artistic': 'artistic cinematography, creative angles, dramatic shadows, expressive',
      'social': 'social media optimized, bright vibrant colors, high energy, engaging',
      'minimal': 'minimalist aesthetic, clean composition, simple elegance',
      'vintage': 'vintage film look, warm tones, slight grain, nostalgic',
      'modern': 'contemporary modern aesthetic, sleek, sophisticated',
      'dramatic': 'dramatic lighting, moody atmosphere, high contrast',
      'soft': 'soft diffused lighting, gentle colors, ethereal feel'
    };

    // Lighting presets
    const lightingStyles = {
      'natural': 'natural daylight',
      'golden_hour': 'golden hour warm sunlight',
      'blue_hour': 'blue hour ambient light',
      'studio': 'professional studio lighting',
      'soft': 'soft diffused lighting',
      'dramatic': 'dramatic directional lighting',
      'rim': 'rim lighting with silhouette',
      'neon': 'neon colored lighting',
      'candle': 'warm candlelight ambiance'
    };

    // If using template
    let basePrompt = '';
    if (template && PROMPT_TEMPLATES[template]) {
      const tmpl = PROMPT_TEMPLATES[template];
      basePrompt = tmpl.structure;
      
      // Replace placeholders
      const replacements = {
        '[product]': subject,
        '[subject]': subject,
        '[person_description]': subject,
        '[action]': action,
        '[attention_grabber]': subject,
        '[shot_type]': shotTypes[shotType] || shotType,
        '[background]': setting || tmpl.defaults.background || 'neutral background',
        '[location]': setting,
        '[setting]': setting || tmpl.defaults.setting || '',
        '[lighting]': lightingStyles[lighting] || lighting,
        '[style]': styles[style] || style
      };

      for (const [placeholder, value] of Object.entries(replacements)) {
        if (value) {
          basePrompt = basePrompt.replace(placeholder, value);
        }
      }
    } else if (customPrompt) {
      basePrompt = customPrompt;
    } else {
      // Build from components using the 6-part formula:
      // [shot type] + [subject] + [action] + [style] + [camera movement] + [audio cues]
      const parts = [];
      
      // 1. Shot Type (Front-loaded)
      if (shotType) parts.push(shotTypes[shotType] || shotType);
      
      // 2. Subject (Critical)
      if (subject) parts.push(subject);
      
      // 3. Action (Single action focus)
      if (action) parts.push(action);
      
      // 4. Style & Lighting
      if (style) parts.push(styles[style] || style);
      if (lighting) parts.push(lightingStyles[lighting] || lighting);
      if (setting) parts.push(`in ${setting}`);
      if (mood) parts.push(`${mood} mood`);
      
      // 5. Camera Movement
      if (cameraMovement) parts.push(cameraMovements[cameraMovement] || cameraMovement);
      
      // 6. Audio Cues (for realism)
      if (audioCues) parts.push(`sound of ${audioCues}`);
      
      basePrompt = parts.join(', ');
    }

    // Add quality boosters at the end
    const qualityBoosters = [
      'ultra high definition',
      '8K resolution',
      'professional quality',
      'sharp focus',
      'detailed',
      'high fidelity',
      'hyperrealistic'
    ];
    
    const finalPrompt = `${basePrompt}, ${qualityBoosters.join(', ')}`;

    // Build negative prompt
    const defaultNegatives = [
      'warped faces',
      'distorted limbs',
      'watermark',
      'text',
      'bad anatomy',
      'blurry',
      'low quality',
      'pixelated',
      'distorted features',
      'logo',
      'deformed',
      'disfigured',
      'wrong proportions',
      'mutation',
      'extra limbs',
      'duplicate',
      'morbid',
      'ugly',
      'grainy',
      'noise',
      'oversaturated',
      'overexposed',
      'underexposed',
      'artifacts',
      'compression artifacts',
      'flickering',
      'inconsistent',
      'jittery'
    ];

    const allNegatives = [...new Set([...defaultNegatives, ...negatives])];

    return {
      positive: finalPrompt,
      negative: allNegatives.join(', '),
      metadata: {
        template,
        shotType,
        style,
        cameraMovement,
        lighting
      }
    };
  }

  /**
   * GENERATE VIDEO with seed bracketing for quality selection
   */
  async generateWithBracketing(promptOptions, generationOptions = {}) {
    const {
      numVariations = 3,
      model = 'damo-text2video',
      numFrames = 16,
      numInferenceSteps = 50,
      fps = 8,
      guidanceScale = 7.5,
      // 9:16 vertical format for TikTok/Instagram Reels
      width = 576,
      height = 1024,
      aspectRatio = '9:16'
    } = generationOptions;

    const prompt = this.buildOptimizedPrompt(promptOptions);
    const jobId = uuidv4();
    
    console.log('Generated prompt:', prompt.positive);
    console.log('Negative prompt:', prompt.negative);

    const modelConfig = VIDEO_MODELS[model] || VIDEO_MODELS['damo-text2video'];
    const seeds = [];
    const predictions = [];

    // Generate seeds
    for (let i = 0; i < numVariations; i++) {
      seeds.push(Math.floor(Math.random() * 2147483647));
    }

    // Start all generations
    for (let i = 0; i < numVariations; i++) {
      try {
        let input = {};
        
        if (model === 'minimax') {
          input = {
            prompt: prompt.positive,
            prompt_optimizer: true,
            seed: seeds[i]
          };
        } else {
          input = {
            prompt: prompt.positive,
            num_frames: Math.min(numFrames, modelConfig.maxFrames),
            num_inference_steps: numInferenceSteps,
            fps: fps,
            guidance_scale: guidanceScale
          };

          // Add negative prompt if supported
          if (modelConfig.supportsNegativePrompt) {
            input.negative_prompt = prompt.negative;
          }

          // Add seed
          input.seed = seeds[i];
        }

        const prediction = await replicate.predictions.create({
          version: modelConfig.version,
          input
        });

        predictions.push({
          id: prediction.id,
          seed: seeds[i],
          index: i
        });

        console.log(`Started variation ${i + 1} with seed ${seeds[i]}, prediction ID: ${prediction.id}`);
      } catch (error) {
        console.error(`Error starting variation ${i}:`, error);
      }
    }

    // Store job info
    this.activeJobs.set(jobId, {
      prompt,
      predictions,
      model,
      status: 'processing',
      startedAt: new Date()
    });

    return {
      jobId,
      prompt,
      predictions,
      model: modelConfig.name
    };
  }

  /**
   * CHECK STATUS of all variations
   */
  async checkBracketingStatus(jobId) {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    const results = [];
    let allComplete = true;

    for (const pred of job.predictions) {
      try {
        const status = await replicate.predictions.get(pred.id);
        results.push({
          id: pred.id,
          seed: pred.seed,
          index: pred.index,
          status: status.status,
          output: status.output,
          error: status.error
        });

        if (status.status !== 'succeeded' && status.status !== 'failed') {
          allComplete = false;
        }
      } catch (error) {
        results.push({
          id: pred.id,
          seed: pred.seed,
          index: pred.index,
          status: 'error',
          error: error.message
        });
      }
    }

    if (allComplete) {
      job.status = 'complete';
      job.completedAt = new Date();
    }

    return {
      jobId,
      status: job.status,
      results,
      prompt: job.prompt
    };
  }

  /**
   * GENERATE FROM IMAGE (Image-to-Video)
   */
  async generateFromImage(imageUrl, options = {}) {
    const {
      motionBucketId = 127,
      fps = 6,
      numFrames = 25,
      decodeChunkSize = 8
    } = options;

    try {
      const prediction = await replicate.predictions.create({
        version: VIDEO_MODELS['stable-video-diffusion'].version,
        input: {
          input_image: imageUrl,
          motion_bucket_id: motionBucketId,
          fps: fps,
          num_frames: numFrames,
          decode_chunk_size: decodeChunkSize
        }
      });

      return {
        predictionId: prediction.id,
        status: 'processing'
      };
    } catch (error) {
      console.error('Image-to-video error:', error);
      throw error;
    }
  }

  /**
   * SINGLE VIDEO GENERATION with optimized settings
   * Default: 9:16 vertical format for TikTok/Instagram Reels
   */
  async generateSingle(promptOptions, options = {}) {
    const {
      model = 'damo-text2video',
      numFrames = 16,
      numInferenceSteps = 50,
      fps = 8,
      guidanceScale = 7.5,
      seed = null,
      // 9:16 vertical format for TikTok/Instagram Reels
      width = 576,
      height = 1024,
      aspectRatio = '9:16'
    } = options;

    const prompt = this.buildOptimizedPrompt(promptOptions);
    const modelConfig = VIDEO_MODELS[model] || VIDEO_MODELS['damo-text2video'];

    let input = {};
    const generatedSeed = seed || Math.floor(Math.random() * 2147483647);

    if (model === 'minimax') {
      input = {
        prompt: prompt.positive,
        prompt_optimizer: true,
        seed: generatedSeed,
        // 9:16 vertical format
        aspect_ratio: aspectRatio
      };
    } else {
      input = {
        prompt: prompt.positive,
        num_frames: Math.min(numFrames, modelConfig.maxFrames),
        num_inference_steps: numInferenceSteps,
        fps: fps,
        guidance_scale: guidanceScale,
        seed: generatedSeed,
        // 9:16 vertical dimensions for TikTok/Reels
        width: width,
        height: height
      };

      if (modelConfig.supportsNegativePrompt) {
        input.negative_prompt = prompt.negative;
      }
    }

    try {
      const prediction = await replicate.predictions.create({
        version: modelConfig.version,
        input
      });

      return {
        predictionId: prediction.id,
        prompt,
        seed: input.seed,
        model: modelConfig.name
      };
    } catch (error) {
      console.error('Video generation error:', error);
      throw error;
    }
  }

  /**
   * GET PROMPT SUGGESTIONS based on content type
   */
  getPromptSuggestions(contentType) {
    const suggestions = {
      'product': [
        { subject: 'luxury watch', action: 'rotating to show all angles', style: 'commercial' },
        { subject: 'skincare product', action: 'with water droplets falling', style: 'soft' },
        { subject: 'sneakers', action: 'hovering and spinning', style: 'modern' }
      ],
      'lifestyle': [
        { subject: 'young woman', action: 'walking through city streets', style: 'cinematic' },
        { subject: 'couple', action: 'enjoying coffee at cafe', style: 'soft' },
        { subject: 'athlete', action: 'training at gym', style: 'dramatic' }
      ],
      'nature': [
        { subject: 'mountain landscape', action: 'with clouds moving', style: 'cinematic' },
        { subject: 'ocean waves', action: 'crashing on beach', style: 'dramatic' },
        { subject: 'forest', action: 'with sunlight filtering through trees', style: 'soft' }
      ],
      'food': [
        { subject: 'gourmet dish', action: 'with steam rising', style: 'commercial' },
        { subject: 'coffee being poured', action: 'into elegant cup', style: 'modern' },
        { subject: 'fresh ingredients', action: 'falling in slow motion', style: 'cinematic' }
      ],
      'tech': [
        { subject: 'smartphone', action: 'floating with app interface', style: 'modern' },
        { subject: 'laptop', action: 'opening in dark room', style: 'dramatic' },
        { subject: 'gadget', action: 'assembling itself', style: 'cinematic' }
      ]
    };

    return suggestions[contentType] || suggestions['lifestyle'];
  }

  /**
   * ENHANCE VIDEO (Upscale & Interpolate)
   */
  async enhanceVideo(videoUrl, options = {}) {
    return await videoEnhancer.enhanceVideo(videoUrl, options);
  }

  /**
   * CLEANUP old jobs
   */
  cleanupOldJobs(maxAge = 3600000) { // 1 hour
    const now = new Date();
    for (const [jobId, job] of this.activeJobs) {
      if (now - job.startedAt > maxAge) {
        this.activeJobs.delete(jobId);
      }
    }
  }
}

module.exports = new AdvancedVideoGenerator();
