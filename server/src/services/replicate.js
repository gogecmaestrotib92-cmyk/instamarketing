const Replicate = require('replicate');

/**
 * Replicate AI Video Generation Service
 * Uses Stable Video Diffusion and other models
 */
class ReplicateService {
  constructor() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN
    });
    this.maxRetries = 3;
    this.retryDelay = 10000; // 10 seconds
    this.pollInterval = 5000; // 5 seconds
    this.maxPollAttempts = 120; // 10 minutes max wait
  }

  /**
   * Wait for prediction to complete with polling
   */
  async waitForPrediction(predictionId) {
    for (let i = 0; i < this.maxPollAttempts; i++) {
      await this.sleep(this.pollInterval);
      const status = await this.replicate.predictions.get(predictionId);
      
      console.log(`📊 Prediction status: ${status.status} (attempt ${i + 1})`);
      
      if (status.status === 'succeeded') {
        return { success: true, output: status.output };
      }
      if (status.status === 'failed') {
        return { success: false, error: status.error };
      }
      if (status.status === 'canceled') {
        return { success: false, error: 'Prediction was canceled' };
      }
    }
    return { success: false, error: 'Timeout waiting for prediction' };
  }

  /**
   * Generate video from text prompt using Kling v1.6 Standard
   * Used as fallback when Pexels has no matching videos
   * @param {string} prompt - Text description of the video scene
   * @param {object} options - Generation options
   */
  async generateVideoWithKling(prompt, options = {}) {
    try {
      const { duration = 5, aspectRatio = '9:16' } = options;
      console.log('🎬 Starting Kling v1.6 video generation...');
      console.log('Prompt:', prompt);
      console.log('Duration:', duration, 'Aspect Ratio:', aspectRatio);

      // Kling v1.6 Standard - 720p at 30fps, supports 5s and 10s
      const klingDuration = parseInt(duration) >= 10 ? 10 : 5;
      
      const prediction = await this.replicate.predictions.create({
        model: 'kwaivgi/kling-v1.6-standard',
        input: {
          prompt: prompt,
          duration: klingDuration,
          aspect_ratio: aspectRatio,
          cfg_scale: 0.5  // Creativity vs prompt adherence
        }
      });

      console.log('📝 Kling prediction created:', prediction.id);
      
      // Wait for completion (Kling can take 1-3 minutes)
      const result = await this.waitForPrediction(prediction.id);
      
      if (result.success) {
        console.log('✅ Kling video generation complete!');
        return {
          success: true,
          videoUrl: result.output,
          predictionId: prediction.id
        };
      } else {
        throw new Error(result.error || 'Kling video generation failed');
      }

    } catch (error) {
      console.error('Kling video generation error:', error.message);
      return this.handleError(error);
    }
  }

  /**
   * Start async video generation with Kling - returns immediately with prediction ID
   * The result will be sent to the webhook when complete
   * @param {string} prompt - Text description of the video scene
   * @param {string} webhookUrl - URL to receive completion notification
   * @param {object} options - Generation options
   */
  async startAsyncKlingVideo(prompt, webhookUrl, options = {}) {
    try {
      const { duration = 5, aspectRatio = '9:16' } = options;
      console.log('🎬 Starting ASYNC Kling v1.6 video generation...');
      console.log('Prompt:', prompt);
      console.log('Webhook:', webhookUrl);

      const klingDuration = parseInt(duration) >= 10 ? 10 : 5;
      
      const prediction = await this.replicate.predictions.create({
        model: 'kwaivgi/kling-v1.6-standard',
        input: {
          prompt: prompt,
          duration: klingDuration,
          aspect_ratio: aspectRatio,
          cfg_scale: 0.5
        },
        webhook: webhookUrl,
        webhook_events_filter: ['completed'] // Only notify on completion
      });

      console.log('📝 Async Kling prediction created:', prediction.id);
      
      return {
        success: true,
        predictionId: prediction.id,
        status: 'starting'
      };

    } catch (error) {
      console.error('Async Kling start error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check the status of a Replicate prediction
   * @param {string} predictionId - The prediction ID to check
   */
  async checkPredictionStatus(predictionId) {
    try {
      const prediction = await this.replicate.predictions.get(predictionId);
      
      return {
        id: prediction.id,
        status: prediction.status,
        output: prediction.output,
        error: prediction.error
      };
    } catch (error) {
      console.error('Check prediction error:', error.message);
      return {
        id: predictionId,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Generate video from text prompt using Luma Ray Flash 2 (high quality, fast)
   * @param {string} prompt - Text description of the video
   * @param {object} options - Generation options
   */
  async textToVideo(prompt, options = {}) {
    try {
      const { duration = 5, aspectRatio = '9:16' } = options;
      console.log('🎬 Starting Luma Ray Flash 2 video generation...');
      console.log('Prompt:', prompt);
      console.log('Duration:', duration, 'Aspect Ratio:', aspectRatio);

      // Luma Ray Flash 2 - 720p, fast generation, high quality
      // Supports: 5 and 9 second durations (integer), various aspect ratios
      const lumaDuration = parseInt(duration) >= 9 ? 9 : 5;
      
      const prediction = await this.replicate.predictions.create({
        model: 'luma/ray-flash-2-720p',
        input: {
          prompt: prompt,
          duration: lumaDuration,
          aspect_ratio: aspectRatio,
          loop: false
        }
      });

      console.log('📝 Prediction created:', prediction.id);
      
      // Wait for completion
      const result = await this.waitForPrediction(prediction.id);
      
      if (result.success) {
        console.log('✅ Video generation complete!');
        return {
          success: true,
          videoUrl: result.output,
          predictionId: prediction.id
        };
      } else {
        throw new Error(result.error || 'Video generation failed');
      }

    } catch (error) {
      console.error('Replicate text-to-video error:', error.message);
      return this.handleError(error);
    }
  }

  /**
   * Start async video generation (returns immediately with prediction ID)
   * Uses Luma Ray Flash 2 - high quality, fast, supports 9:16
   */
  async startTextToVideo(prompt, options = {}) {
    try {
      const { duration = 5, aspectRatio = '9:16' } = options;
      console.log('🎬 Starting Luma Ray Flash 2 async generation...');
      console.log('Prompt:', prompt);
      console.log('Duration:', duration, 'Aspect Ratio:', aspectRatio);
      
      const lumaDuration = parseInt(duration) >= 9 ? 9 : 5;
      
      const prediction = await this.replicate.predictions.create({
        model: 'luma/ray-flash-2-720p',
        input: {
          prompt: prompt,
          duration: lumaDuration,
          aspect_ratio: aspectRatio,
          loop: false
        }
      });

      console.log('📝 Prediction created:', prediction.id, 'Status:', prediction.status);

      return {
        success: true,
        predictionId: prediction.id,
        status: prediction.status,
        message: 'Video generation started. Use /api/ai-video/status?id=<id> to check progress.'
      };

    } catch (error) {
      console.error('Start text-to-video error:', error.message);
      return this.handleError(error);
    }
  }

  /**
   * Start async image-to-video generation using Kling v2.1
   */
  async startImageToVideo(imageUrl, motionPrompt = '', options = {}) {
    try {
      const { duration = 10, aspectRatio = '9:16' } = options;
      console.log('🎬 Starting async image-to-video generation (Kling v2.1)...');
      console.log('Image URL:', imageUrl);
      console.log('Duration:', duration, 'Aspect Ratio:', aspectRatio);

      const prediction = await this.replicate.predictions.create({
        model: 'kwaivgi/kling-v2.1',
        input: {
          prompt: motionPrompt || 'Animate this image with natural motion',
          start_image: imageUrl,
          duration: duration,
          aspect_ratio: aspectRatio
        }
      });

      console.log('📝 Prediction created:', prediction.id, 'Status:', prediction.status);

      return {
        success: true,
        predictionId: prediction.id,
        status: prediction.status
      };

    } catch (error) {
      console.error('Start image-to-video error:', error.message);
      return this.handleError(error);
    }
  }

  /**
   * Check prediction status
   */
  async getPredictionStatus(predictionId) {
    try {
      const status = await this.replicate.predictions.get(predictionId);
      return {
        success: true,
        id: status.id,
        status: status.status,
        output: status.output,
        error: status.error,
        createdAt: status.created_at,
        completedAt: status.completed_at
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle common errors
   */
  handleError(error) {
    if (error.message?.includes('402') || error.message?.includes('Payment Required') || error.message?.includes('Insufficient credit')) {
      return {
        success: false,
        error: 'Payment required. Add a payment method at replicate.com/account/billing',
        requiresPayment: true
      };
    }
    
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      return {
        success: false,
        error: 'Rate limit reached. Please wait a moment and try again.'
      };
    }
    
    return { success: false, error: error.message };
  }

  /**
   * Run a model with retry logic
   */
  async runWithRetry(modelId, input) {
    let lastError;
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        console.log(`🚀 Attempt ${i + 1}/${this.maxRetries} for model ${modelId}`);
        
        // Handle both "owner/name" and "owner/name:version" formats
        let prediction;
        if (modelId.includes(':')) {
          const version = modelId.split(':')[1];
          prediction = await this.replicate.predictions.create({
            version: version,
            input: input
          });
        } else {
          // If no version hash, we might need to look it up or use a different method
          // For now, assume we always pass version hash or use .run() if we want latest
          // But .run() is blocking.
          // Let's try to use the model owner/name if the library supports it in create()
          // The official nodejs library expects 'version' in create().
          // So we should ensure we pass the version hash.
          throw new Error('Model version hash required');
        }

        const result = await this.waitForPrediction(prediction.id);
        if (result.success) {
          return result.output;
        }
        throw new Error(result.error);
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error.message);
        lastError = error;
        if (i < this.maxRetries - 1) await this.sleep(this.retryDelay);
      }
    }
    throw lastError;
  }

  /**
   * Generate video from image using Kling v2.1
   * @param {string} imageUrl - URL of the source image
   * @param {string} motionPrompt - Optional motion description
   * @param {object} options - Generation options
   */
  async imageToVideo(imageUrl, motionPrompt = '', options = {}) {
    try {
      const { duration = 10, aspectRatio = '9:16' } = options;

      console.log('🎬 Starting Replicate image-to-video generation (Kling v2.1)...');
      console.log('Image URL:', imageUrl);
      console.log('Duration:', duration, 'Aspect Ratio:', aspectRatio);

      // Using Kling v2.1 for image-to-video
      const prediction = await this.replicate.predictions.create({
        model: 'kwaivgi/kling-v2.1',
        input: {
          prompt: motionPrompt || 'Animate this image with natural motion',
          start_image: imageUrl,
          duration: duration,
          aspect_ratio: aspectRatio
        }
      });

      console.log('📝 Prediction created:', prediction.id);
      
      // Wait for completion
      const result = await this.waitForPrediction(prediction.id);

      if (result.success) {
        console.log('✅ Video generation complete!');
        const videoUrl = Array.isArray(result.output) ? result.output[0] : result.output;
        return {
          success: true,
          videoUrl: videoUrl,
          duration: duration
        };
      } else {
        throw new Error(result.error || 'Video generation failed');
      }

    } catch (error) {
      console.error('Replicate image-to-video error:', error.message);
      return this.handleError(error);
    }
  }

  /**
   * Generate high-quality video using Kling v1.6 Pro (Premium text-to-video)
   * Best quality with 1080p resolution
   */
  async textToVideoPremium(prompt, options = {}) {
    try {
      const { duration = 10, aspectRatio = '9:16' } = options;
      console.log('🎬 Starting premium video generation (Kling v1.6 Pro)...');
      console.log('Prompt:', prompt);
      console.log('Duration:', duration, 'Aspect Ratio:', aspectRatio);

      // Kling v1.6 Pro - Premium version with 1080p quality
      const prediction = await this.replicate.predictions.create({
        model: 'kwaivgi/kling-v1.6-pro',
        input: {
          prompt: prompt,
          duration: duration,
          aspect_ratio: aspectRatio
        }
      });

      console.log('📝 Prediction created:', prediction.id);
      
      const result = await this.waitForPrediction(prediction.id);

      if (result.success) {
        console.log('✅ Premium video generation complete!');
        const videoUrl = Array.isArray(result.output) ? result.output[0] : result.output;
        return {
          success: true,
          videoUrl: videoUrl
        };
      } else {
        throw new Error(result.error || 'Video generation failed');
      }

    } catch (error) {
      console.error('Premium video generation error:', error.message);
      return this.handleError(error);
    }
  }

  /**
   * Generate image from text prompt using Flux Schnell (fast, high quality)
   * Optionally uses reference image for style guidance via IP-Adapter
   * @param {string} prompt - Text description of the image
   * @param {object} options - Generation options
   */
  async textToImage(prompt, options = {}) {
    try {
      const { 
        aspectRatio = '1:1', 
        numOutputs = 1,
        outputFormat = 'webp',
        outputQuality = 90,
        referenceImage = null
      } = options;
      
      console.log('🖼️ Starting Flux image generation...');
      console.log('Prompt:', prompt);
      console.log('Aspect Ratio:', aspectRatio);
      
      let prediction;
      
      if (referenceImage) {
        console.log('📸 Using reference image for style guidance:', referenceImage);
        
        // Use Flux Pro with image prompt for style-guided generation
        prediction = await this.replicate.predictions.create({
          model: 'black-forest-labs/flux-1.1-pro',
          input: {
            prompt: prompt,
            image_prompt: referenceImage,
            image_prompt_strength: 0.30, // Balanced style influence for brand consistency
            aspect_ratio: aspectRatio,
            output_format: outputFormat,
            output_quality: outputQuality,
            safety_tolerance: 2,
            prompt_upsampling: true
          }
        });
        
        console.log('📝 Image prompt guided prediction created:', prediction.id);
      } else {
        // Standard Flux Schnell - Fast, high quality text-to-image
        prediction = await this.replicate.predictions.create({
          model: 'black-forest-labs/flux-schnell',
          input: {
            prompt: prompt,
            aspect_ratio: aspectRatio,
            num_outputs: numOutputs,
            output_format: outputFormat,
            output_quality: outputQuality,
            go_fast: true,
            megapixels: '1'
          }
        });
        
        console.log('📝 Image prediction created:', prediction.id);
      }
      
      // Wait for completion
      const result = await this.waitForPrediction(prediction.id);
      
      if (result.success) {
        console.log('✅ Image generation complete!');
        const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
        return {
          success: true,
          imageUrl: imageUrl,
          predictionId: prediction.id,
          allImages: result.output
        };
      } else {
        throw new Error(result.error || 'Image generation failed');
      }

    } catch (error) {
      console.error('Flux image generation error:', error.message);
      return this.handleError(error);
    }
  }

  /**
   * Start async image generation (returns immediately with prediction ID)
   * Uses Flux Schnell - fast, high quality text-to-image
   */
  async startTextToImage(prompt, options = {}) {
    try {
      const { 
        aspectRatio = '1:1', 
        numOutputs = 1,
        outputFormat = 'webp',
        outputQuality = 90 
      } = options;
      
      console.log('🖼️ Starting Flux Schnell async image generation...');
      console.log('Prompt:', prompt);
      console.log('Aspect Ratio:', aspectRatio);
      
      const prediction = await this.replicate.predictions.create({
        model: 'black-forest-labs/flux-schnell',
        input: {
          prompt: prompt,
          aspect_ratio: aspectRatio,
          num_outputs: numOutputs,
          output_format: outputFormat,
          output_quality: outputQuality,
          go_fast: true,
          megapixels: '1'
        }
      });

      console.log('📝 Image prediction created:', prediction.id, 'Status:', prediction.status);

      return {
        success: true,
        predictionId: prediction.id,
        status: prediction.status,
        message: 'Image generation started. Use /api/ai-video/status?id=<id> to check progress.'
      };

    } catch (error) {
      console.error('Start text-to-image error:', error.message);
      return this.handleError(error);
    }
  }

  /**
   * Get available models info
   */
  getModels() {
    return {
      models: [
        {
          id: 'flux-schnell',
          name: 'Flux Schnell',
          description: 'Fast, high quality text-to-image by Black Forest Labs',
          type: 'text-to-image',
          speed: 'very-fast',
          quality: 'excellent',
          aspectRatios: ['1:1', '16:9', '21:9', '3:2', '2:3', '4:5', '5:4', '3:4', '4:3', '9:16', '9:21']
        },
        {
          id: 'luma-ray-flash-2',
          name: 'Luma Ray Flash 2',
          description: 'High quality text-to-video, 720p, fast generation, supports 9:16',
          type: 'text-to-video',
          speed: 'fast',
          quality: 'excellent',
          aspectRatios: ['9:16', '16:9', '1:1', '4:3', '3:4']
        },
        {
          id: 'kling-v2.1',
          name: 'Kling v2.1',
          description: 'Image-to-video with excellent quality',
          type: 'image-to-video',
          speed: 'medium',
          quality: 'excellent',
          aspectRatios: ['9:16', '16:9', '1:1']
        }
      ]
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ReplicateService();
