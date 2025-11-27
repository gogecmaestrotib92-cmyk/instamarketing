const axios = require('axios');

const RUNWAY_API_URL = 'https://api.runwayml.com/v1';

/**
 * Runway ML Gen-3 Video Generation Service
 */
class RunwayService {
  constructor() {
    this.apiKey = process.env.RUNWAY_API_KEY;
    this.client = axios.create({
      baseURL: RUNWAY_API_URL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06'
      }
    });
  }

  /**
   * Generate video from text prompt
   * @param {string} prompt - Text description of the video
   * @param {object} options - Generation options
   */
  async textToVideo(prompt, options = {}) {
    try {
      const {
        duration = 5,        // 5 or 10 seconds
        aspectRatio = '16:9', // 16:9, 9:16, 1:1
        watermark = false,
        seed = null
      } = options;

      console.log('🎬 Starting Runway text-to-video generation...');
      console.log('Prompt:', prompt);

      const response = await this.client.post('/text-to-video', {
        model: 'gen3a_turbo',  // Gen-3 Alpha Turbo (fastest)
        prompt: prompt,
        duration: duration,
        ratio: aspectRatio,
        watermark: watermark,
        ...(seed && { seed })
      });

      const taskId = response.data.id;
      console.log('Task created:', taskId);

      // Poll for completion
      const result = await this.pollForCompletion(taskId);
      return result;

    } catch (error) {
      console.error('Runway text-to-video error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to generate video');
    }
  }

  /**
   * Generate video from image (animate image)
   * @param {string} imageUrl - URL of the source image
   * @param {string} prompt - Motion/animation description
   * @param {object} options - Generation options
   */
  async imageToVideo(imageUrl, prompt = '', options = {}) {
    try {
      const {
        duration = 5,
        aspectRatio = '16:9',
        watermark = false,
        seed = null
      } = options;

      console.log('🎬 Starting Runway image-to-video generation...');
      console.log('Image URL:', imageUrl);
      console.log('Motion prompt:', prompt);

      const response = await this.client.post('/image-to-video', {
        model: 'gen3a_turbo',
        promptImage: imageUrl,
        promptText: prompt || 'Subtle natural movement, cinematic',
        duration: duration,
        ratio: aspectRatio,
        watermark: watermark,
        ...(seed && { seed })
      });

      const taskId = response.data.id;
      console.log('Task created:', taskId);

      // Poll for completion
      const result = await this.pollForCompletion(taskId);
      return result;

    } catch (error) {
      console.error('Runway image-to-video error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to generate video from image');
    }
  }

  /**
   * Poll task status until completion
   * @param {string} taskId - Task ID to poll
   */
  async pollForCompletion(taskId, maxAttempts = 120, intervalMs = 5000) {
    console.log('⏳ Waiting for video generation...');
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.client.get(`/tasks/${taskId}`);
        const { status, output, failure, progress } = response.data;

        console.log(`Status: ${status} ${progress ? `(${Math.round(progress * 100)}%)` : ''}`);

        if (status === 'SUCCEEDED') {
          console.log('✅ Video generation complete!');
          return {
            success: true,
            videoUrl: output[0],
            taskId: taskId
          };
        }

        if (status === 'FAILED') {
          console.error('❌ Video generation failed:', failure);
          return {
            success: false,
            error: failure || 'Video generation failed'
          };
        }

        // Still processing, wait and retry
        await this.sleep(intervalMs);

      } catch (error) {
        console.error('Polling error:', error.message);
        await this.sleep(intervalMs);
      }
    }

    return {
      success: false,
      error: 'Video generation timed out'
    };
  }

  /**
   * Get available models and their capabilities
   */
  async getModels() {
    try {
      // Runway Gen-3 models
      return {
        models: [
          {
            id: 'gen3a_turbo',
            name: 'Gen-3 Alpha Turbo',
            description: 'Fastest generation, good quality',
            maxDuration: 10,
            aspectRatios: ['16:9', '9:16', '1:1'],
            costPerSecond: 0.05
          },
          {
            id: 'gen3a',
            name: 'Gen-3 Alpha',
            description: 'Best quality, slower generation',
            maxDuration: 10,
            aspectRatios: ['16:9', '9:16', '1:1'],
            costPerSecond: 0.10
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching models:', error.message);
      throw error;
    }
  }

  /**
   * Check account credits/balance
   */
  async getCredits() {
    try {
      const response = await this.client.get('/account');
      return response.data;
    } catch (error) {
      console.error('Error fetching credits:', error.message);
      return null;
    }
  }

  /**
   * Cancel a running task
   */
  async cancelTask(taskId) {
    try {
      await this.client.delete(`/tasks/${taskId}`);
      return { success: true };
    } catch (error) {
      console.error('Error cancelling task:', error.message);
      return { success: false, error: error.message };
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new RunwayService();
