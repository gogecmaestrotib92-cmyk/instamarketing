/**
 * REPLICATE WEBHOOK HANDLER
 * ==========================
 * Receives async prediction completions from Replicate.
 * Updates VideoJob scenes with the generated video URLs.
 */

const express = require('express');
const router = express.Router();
const VideoJob = require('../models/VideoJob');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;

// Import the continue processing function
let continueProcessingAfterAI;
try {
  const videoJobWorker = require('../services/videoJobWorker');
  continueProcessingAfterAI = videoJobWorker.continueProcessingAfterAI;
} catch (e) {
  console.log('[Webhooks] videoJobWorker not available:', e.message);
}

// Initialize Cloudinary
cloudinary.config({
  cloud_name: 'ddvtwoyxp',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * POST /api/webhooks/replicate
 * Called by Replicate when a prediction completes
 * 
 * Payload format:
 * {
 *   "id": "prediction_id",
 *   "status": "succeeded" | "failed",
 *   "output": "video_url" or ["video_url"],
 *   "error": "error message if failed"
 * }
 */
router.post('/replicate', async (req, res) => {
  try {
    const { id: predictionId, status, output, error } = req.body;
    
    console.log(`[Webhook] Replicate prediction ${predictionId}: ${status}`);
    
    // Find the job that has this prediction
    const job = await VideoJob.findOne({
      'scenes.replicatePredictionId': predictionId
    });
    
    if (!job) {
      console.log(`[Webhook] No job found for prediction ${predictionId}`);
      return res.status(200).json({ message: 'No matching job found' });
    }
    
    // Find the scene with this prediction ID
    const sceneIndex = job.scenes.findIndex(s => s.replicatePredictionId === predictionId);
    if (sceneIndex === -1) {
      console.log(`[Webhook] Scene not found for prediction ${predictionId}`);
      return res.status(200).json({ message: 'Scene not found' });
    }
    
    console.log(`[Webhook] Found job ${job._id}, scene ${sceneIndex}`);
    
    if (status === 'succeeded') {
      // Get the video URL from output (can be string or array)
      const videoUrl = Array.isArray(output) ? output[0] : output;
      
      if (videoUrl) {
        try {
          // Download and upload to Cloudinary for consistent hosting
          console.log(`[Webhook] Downloading video from Replicate...`);
          const videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 60000
          });
          
          const videoBuffer = Buffer.from(videoResponse.data);
          console.log(`[Webhook] Uploading to Cloudinary... (${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
          
          const cloudinaryUrl = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                resource_type: 'video',
                folder: 'ai-generated-videos',
                public_id: `job_${job._id}_scene_${sceneIndex}_kling`
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
              }
            );
            uploadStream.end(videoBuffer);
          });
          
          // Update the scene
          job.scenes[sceneIndex].videoUrl = cloudinaryUrl;
          job.scenes[sceneIndex].source = 'kling-ai';
          job.scenes[sceneIndex].aiGenerated = true;
          job.scenes[sceneIndex].replicateStatus = 'succeeded';
          
          console.log(`[Webhook] Scene ${sceneIndex} updated with Kling video: ${cloudinaryUrl}`);
          
        } catch (uploadError) {
          console.error(`[Webhook] Failed to upload video:`, uploadError.message);
          job.scenes[sceneIndex].replicateStatus = 'upload_failed';
          job.scenes[sceneIndex].replicateError = uploadError.message;
        }
      }
    } else if (status === 'failed') {
      job.scenes[sceneIndex].replicateStatus = 'failed';
      job.scenes[sceneIndex].replicateError = error || 'Prediction failed';
      console.log(`[Webhook] Scene ${sceneIndex} failed: ${error}`);
    }
    
    // Check if all scenes are complete (succeeded, failed, or have fallback)
    const allScenesComplete = job.scenes.every(scene => 
      scene.videoUrl || scene.replicateStatus === 'failed'
    );
    
    if (allScenesComplete) {
      console.log(`[Webhook] All scenes complete for job ${job._id}`);
      const successCount = job.scenes.filter(s => s.videoUrl && s.replicateStatus === 'succeeded').length;
      job.statusMessage = `✅ ${successCount}/${job.scenes.length} AI videos ready. Processing...`;
      
      // Handle failed scenes with fallback videos
      for (let i = 0; i < job.scenes.length; i++) {
        if (!job.scenes[i].videoUrl && job.scenes[i].replicateStatus === 'failed') {
          console.log(`[Webhook] Scene ${i} failed, will use fallback video`);
          // Mark for fallback processing
          job.scenes[i].needsFallback = true;
        }
      }
      
      await job.save();
      
      // Continue processing (generate audio + render)
      if (continueProcessingAfterAI) {
        console.log(`[Webhook] Triggering continue processing for job ${job._id}`);
        // Don't await - let it process in background
        continueProcessingAfterAI(job._id).catch(err => {
          console.error(`[Webhook] Continue processing failed:`, err.message);
        });
      } else {
        console.log(`[Webhook] continueProcessingAfterAI not available`);
        job.statusMessage = 'AI videos ready. Please refresh to continue.';
        await job.save();
      }
    } else {
      await job.save();
    }
    
    res.status(200).json({ 
      message: 'Webhook processed',
      jobId: job._id,
      sceneIndex,
      status 
    });
    
  } catch (error) {
    console.error('[Webhook] Error processing Replicate webhook:', error);
    // Always return 200 to acknowledge receipt
    res.status(200).json({ error: error.message });
  }
});

/**
 * GET /api/webhooks/replicate/test
 * Test endpoint to verify webhook is accessible
 */
router.get('/replicate/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Replicate webhook endpoint is ready',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
