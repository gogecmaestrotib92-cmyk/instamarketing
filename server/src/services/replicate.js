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
   * Generate video from text prompt using Minimax (High Quality)
   * @param {string} prompt - Text description of the video
   * @param {object} options - Generation options
   */
  async textToVideo(prompt, options = {}) {
    try {
      console.log('🎬 Starting Replicate text-to-video generation (Minimax)...');
      console.log('Prompt:', prompt);

      // Create prediction using Minimax Video-01 model
      const prediction = await this.replicate.predictions.create({
        version: '5aa835260ff7f40f4069c41185f72036accf99e29957bb4a3b3a911f3b6c1912',
        input: {
          prompt: prompt,
          prompt_optimizer: true
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
   */
  async startTextToVideo(prompt, options = {}) {
    try {
      console.log('🎬 Starting async text-to-video generation (Minimax)...');
      
      const prediction = await this.replicate.predictions.create({
        version: '5aa835260ff7f40f4069c41185f72036accf99e29957bb4a3b3a911f3b6c1912',
        input: {
          prompt: prompt,
          prompt_optimizer: true
        }
      });

      return {
        success: true,
        predictionId: prediction.id,
        status: prediction.status,
        message: 'Video generation started. Use /api/video/status/:id to check progress.'
      };

    } catch (error) {
      console.error('Start text-to-video error:', error.message);
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
   * Generate video from image using Stable Video Diffusion
   * @param {string} imageUrl - URL of the source image
   * @param {string} motionPrompt - Optional motion description
   * @param {object} options - Generation options
   */
  async imageToVideo(imageUrl, motionPrompt = '', options = {}) {
    try {
      const {
        duration = 4,
        fps = 8,
        motionBucketId = 127  // Controls motion amount (1-255)
      } = options;

      console.log('🎬 Starting Replicate image-to-video generation...');
      console.log('Image URL:', imageUrl);
      console.log('⚠️ Note: Free tier has rate limits. Add payment method for faster generation.');

      // Using Stable Video Diffusion XT for image-to-video
      const output = await this.runWithRetry(
        "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
        {
          input_image: imageUrl,
          video_length: "14_frames_with_svd",
          sizing_strategy: "maintain_aspect_ratio",
          frames_per_second: fps,
          motion_bucket_id: motionBucketId,
          cond_aug: 0.02,
          decoding_t: 7,
          seed: Math.floor(Math.random() * 1000000)
        }
      );

      console.log('✅ Video generation complete!');
      console.log('Output:', output);

      const videoUrl = Array.isArray(output) ? output[0] : output;

      return {
        success: true,
        videoUrl: videoUrl,
        duration: duration
      };

    } catch (error) {
      console.error('Replicate image-to-video error:', error.message);
      
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        return {
          success: false,
          error: 'Rate limit reached. Please wait 1 minute or add payment method at replicate.com/account/billing for faster access.'
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate high-quality video using Minimax (Hailuo)
   * Much better quality and longer duration (6s) than DAMO
   */
  async textToVideoPremium(prompt, options = {}) {
    try {
      console.log('🎬 Starting premium video generation (Minimax)...');
      console.log('Prompt:', prompt);

      // Minimax Video-01
      // Produces 6s video at 25fps (150 frames)
      const output = await this.runWithRetry(
        "minimax/video-01:5aa835260ff7f40f4069c41185f72036accf99e29957bb4a3b3a911f3b6c1912",
        {
          prompt: prompt,
          prompt_optimizer: true
        }
      );

      console.log('✅ Premium video generation complete!');
      
      const videoUrl = Array.isArray(output) ? output[0] : output;

      return {
        success: true,
        videoUrl: videoUrl
      };

    } catch (error) {
      console.error('Premium video generation error:', error.message);
      
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        return {
          success: false,
          error: 'Rate limit reached. Please wait 1 minute or add payment method at replicate.com/account/billing for faster access.'
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get available models info
   */
  getModels() {
    return {
      models: [
        {
          id: 'animate-diff',
          name: 'AnimateDiff Lightning',
          description: 'Fast text-to-video, good for quick previews',
          type: 'text-to-video',
          speed: 'fast',
          quality: 'good'
        },
        {
          id: 'stable-video-diffusion',
          name: 'Stable Video Diffusion',
          description: 'Image animation, smooth motion',
          type: 'image-to-video',
          speed: 'medium',
          quality: 'excellent'
        },
        {
          id: 'minimax',
          name: 'Minimax Video-01 (Hailuo)',
          description: 'Highest quality text-to-video',
          type: 'text-to-video',
          speed: 'slow',
          quality: 'premium'
        }
      ]
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ReplicateService();
