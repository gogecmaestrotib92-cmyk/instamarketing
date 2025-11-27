const Replicate = require('replicate');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

/**
 * Video Enhancer Service
 * Handles Upscaling, Interpolation, and Restoration
 */
class VideoEnhancerService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Upscale video using Real-ESRGAN
   * @param {string} videoUrl - The URL of the video to upscale
   * @param {number} scale - Upscale factor (default 2)
   */
  async upscaleVideo(videoUrl, scale = 2) {
    try {
      console.log('🚀 Starting video upscale...');
      
      // Using Real-ESRGAN for video
      const output = await replicate.run(
        "lucataco/real-esrgan-video:8f88c9033275b872f13469c0953a34f25132f886696b553396d27db0d513c9f6",
        {
          input: {
            input_path: videoUrl,
            upscale: scale
          }
        }
      );

      console.log('✅ Upscale complete:', output);
      return { success: true, videoUrl: output };
    } catch (error) {
      console.error('Upscale error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Interpolate frames for smoother motion (RIFE)
   * @param {string} videoUrl - The URL of the video to interpolate
   * @param {number} multiplier - Frame rate multiplier (default 2)
   */
  async interpolateFrames(videoUrl, multiplier = 2) {
    try {
      console.log('🚀 Starting frame interpolation...');
      
      // Using RIFE for frame interpolation
      const output = await replicate.run(
        "google-research/frame-interpolation:4f88a16a13673a8b589c18866e540556170a5aec2f3122745079d0174b39a751",
        {
          input: {
            video: videoUrl,
            times_to_interpolate: multiplier
          }
        }
      );

      console.log('✅ Interpolation complete:', output);
      return { success: true, videoUrl: output };
    } catch (error) {
      console.error('Interpolation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply full enhancement pipeline (Upscale + Interpolate)
   */
  async enhanceVideo(videoUrl, options = {}) {
    const { upscale = true, interpolate = false } = options;
    let currentUrl = videoUrl;

    if (upscale) {
      const upscaleResult = await this.upscaleVideo(currentUrl);
      if (upscaleResult.success) {
        currentUrl = upscaleResult.videoUrl;
      }
    }

    if (interpolate) {
      const interpolateResult = await this.interpolateFrames(currentUrl);
      if (interpolateResult.success) {
        currentUrl = interpolateResult.videoUrl;
      }
    }

    return { success: true, videoUrl: currentUrl };
  }
}

module.exports = new VideoEnhancerService();
