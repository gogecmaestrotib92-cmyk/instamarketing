/**
 * VIDEO JOBS API ROUTES
 * ======================
 * POST /api/jobs - Create a new video generation job
 * GET /api/jobs/:id - Get job status (for polling)
 * GET /api/jobs - List user's jobs
 * POST /api/jobs/:id/process - Trigger processing (for Vercel serverless)
 */

const express = require('express');
const router = express.Router();
const VideoJob = require('../models/VideoJob');
const { processJob } = require('../services/videoJobWorker');

/**
 * POST /api/jobs
 * Create a new video generation job
 */
router.post('/', async (req, res) => {
  try {
    const { 
      topic, 
      contentType, 
      targetDuration, 
      voiceId, 
      voiceStyle, 
      userId,
      businessInfo,
      forceStockVideo,
      style,
      aspectRatio,
      includeCharacters
    } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    // Check env vars
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Jobs API] OPENAI_API_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error: OpenAI API key missing' });
    }
    
    // Determine if this is a product/brand video (should use AI-first)
    // UNLESS forceStockVideo is true (user explicitly chose stock videos)
    const isProductVideo = !forceStockVideo && !!(businessInfo && (
      businessInfo.brandImages?.length > 0 || 
      businessInfo.productName ||
      businessInfo.businessName ||
      businessInfo.industry
    ));
    console.log(`[Jobs API] forceStockVideo: ${!!forceStockVideo}, calculated isProductVideo: ${isProductVideo}`);
    console.log(`[Jobs API] forceStockVideo: ${!!forceStockVideo}, calculated isProductVideo: ${isProductVideo}`);
    
    // Normalize businessInfo - extract just URLs from brandImages if they are objects
    let normalizedBusinessInfo = null;
    if (businessInfo) {
      let brandImageUrls = [];
      if (businessInfo.brandImages && Array.isArray(businessInfo.brandImages)) {
        brandImageUrls = businessInfo.brandImages.map(img => {
          // If it's an object with url property, extract the url
          if (typeof img === 'object' && img.url) {
            return img.url;
          }
          // If it's already a string, use it as is
          return typeof img === 'string' ? img : null;
        }).filter(Boolean);
      }
      
      normalizedBusinessInfo = {
        businessName: businessInfo.businessName || null,
        industry: businessInfo.industry || null,
        brandImages: brandImageUrls,
        productName: businessInfo.productName || null,
        description: businessInfo.description || null,
        brandVoice: businessInfo.brandVoice || null,
        targetAudience: businessInfo.targetAudience || null,
        brandColors: businessInfo.brandColors || [],
        // NEW: Scene image assignments for specific scenes
        sceneImageAssignments: businessInfo.sceneImageAssignments || null,
        // NEW: Logo placement settings
        logoSettings: businessInfo.logoSettings || { placement: 'corner', position: 'bottom-right' },
        // NEW: Brand color overlay settings
        colorOverlay: businessInfo.colorOverlay || { enabled: false, applyTo: [], intensity: 'medium' }
      };
      
      console.log(`[Jobs API] Normalized business info: ${normalizedBusinessInfo.businessName}, ${normalizedBusinessInfo.industry}`);
      if (normalizedBusinessInfo.sceneImageAssignments) {
        console.log(`[Jobs API] Scene assignments:`, JSON.stringify(normalizedBusinessInfo.sceneImageAssignments));
      }
    }
    
    // Create job in database
    const job = new VideoJob({
      userId: userId || null,
      topic,
      contentType: contentType || 'tips',
      targetDuration: targetDuration || 15,
      voiceId: voiceId || 'pNInz6obpgDQGcFmaJgB',
      voiceStyle: voiceStyle || 'energetic',
      isProductVideo,
      businessInfo: normalizedBusinessInfo,
      videoStyle: style || 'dynamic',
      aspectRatio: aspectRatio || '9:16',
      status: 'pending',
      progress: 0,
      statusMessage: 'Queued...'
    });
    
    await job.save();
    console.log(`[Jobs API] Created job ${job._id} for topic: "${topic}"`);
    console.log(`[Jobs API] ENV check - OpenAI: ${!!process.env.OPENAI_API_KEY}, ElevenLabs: ${!!process.env.ELEVENLABS_API_KEY}, Shotstack: ${!!process.env.SHOTSTACK_API_KEY}`);
    
    // For product videos with AI generation, just save the job and return
    // Client will trigger processing with a separate request
    if (isProductVideo) {
      console.log(`[Jobs API] Product video - returning job for async processing`);
      
      // Return immediately with job ID - client will call /process endpoint
      return res.status(202).json({
        success: true,
        jobId: job._id,
        status: 'pending',
        progress: 0,
        isProductVideo: true,
        message: 'Video job created. Starting processing...',
        pollUrl: `/api/jobs/${job._id}`
      });
    }
    
    // For regular stock video jobs, process synchronously (faster)
    // The 120s Pro timeout should be enough for stock videos
    try {
      await processJob(job._id);
      
      // Reload job to get final status
      const finalJob = await VideoJob.findById(job._id);
      
      res.status(201).json({
        success: true,
        jobId: finalJob._id,
        status: finalJob.status,
        progress: finalJob.progress,
        videoUrl: finalJob.finalVideoUrl,
        audioUrl: finalJob.audioUrl,
        message: finalJob.status === 'done' ? 'Video generated!' : finalJob.statusMessage
      });
    } catch (processError) {
      console.error(`[Jobs API] Processing failed:`, processError.message);
      
      // Update job with error
      job.status = 'failed';
      job.error = processError.message;
      await job.save();
      
      res.status(500).json({
        success: false,
        jobId: job._id,
        status: 'failed',
        error: processError.message
      });
    }
    
  } catch (error) {
    console.error('[Jobs API] Create error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/jobs/:id
 * Get job status for polling
 */
router.get('/:id', async (req, res) => {
  try {
    const job = await VideoJob.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Return status info for polling
    res.json({
      jobId: job._id,
      status: job.status,
      progress: job.progress,
      statusMessage: job.statusMessage,
      
      // Only include these when done
      videoUrl: job.status === 'done' ? job.finalVideoUrl : null,
      audioUrl: job.status === 'done' ? job.audioUrl : null,
      duration: job.totalDuration,
      
      // Include error if failed
      error: job.status === 'failed' ? job.error : null,
      
      // Timestamps
      createdAt: job.createdAt,
      completedAt: job.completedAt
    });
    
  } catch (error) {
    console.error('[Jobs API] Get error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/jobs/:id/process
 * Trigger processing for a job (used for async product videos)
 * This endpoint processes one step at a time to stay within timeout
 */
router.post('/:id/process', async (req, res) => {
  try {
    const job = await VideoJob.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // If already done or failed, just return status
    if (job.status === 'done' || job.status === 'failed') {
      return res.json({
        jobId: job._id,
        status: job.status,
        videoUrl: job.finalVideoUrl,
        error: job.error
      });
    }
    
    console.log(`[Jobs API] Processing job ${job._id}, current status: ${job.status}`);
    
    // Process the job
    try {
      await processJob(job._id);
      
      // Reload to get final status
      const finalJob = await VideoJob.findById(job._id);
      
      res.json({
        jobId: finalJob._id,
        status: finalJob.status,
        progress: finalJob.progress,
        statusMessage: finalJob.statusMessage,
        videoUrl: finalJob.finalVideoUrl,
        error: finalJob.error
      });
    } catch (processError) {
      console.error(`[Jobs API] Process error:`, processError.message);
      
      job.status = 'failed';
      job.error = processError.message;
      await job.save();
      
      res.status(500).json({
        jobId: job._id,
        status: 'failed',
        error: processError.message
      });
    }
    
  } catch (error) {
    console.error('[Jobs API] Process endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/jobs
 * List jobs for a user
 */
router.get('/', async (req, res) => {
  try {
    const { userId, limit = 10 } = req.query;
    
    const query = userId ? { userId } : {};
    const jobs = await VideoJob.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('topic status progress statusMessage finalVideoUrl createdAt completedAt');
    
    res.json({ jobs });
    
  } catch (error) {
    console.error('[Jobs API] List error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/jobs/:id/check-ai
 * Poll Replicate predictions directly when webhooks fail
 */
router.post('/:id/check-ai', async (req, res) => {
  try {
    const job = await VideoJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (job.status !== 'waiting_for_ai') {
      return res.json({ status: job.status, message: 'Not waiting for AI' });
    }
    
    console.log(`[Jobs API] Checking AI status for job ${job._id}`);
    
    // Find scenes with pending predictions
    const pendingScenes = job.scenes.filter(s => 
      s.replicateStatus === 'pending' && s.replicatePredictionId
    );
    
    if (pendingScenes.length === 0) {
      console.log(`[Jobs API] No pending predictions found`);
      return res.json({ status: job.status, pendingCount: 0 });
    }
    
    const Replicate = require('replicate');
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    
    let updated = false;
    
    for (const scene of pendingScenes) {
      try {
        const prediction = await replicate.predictions.get(scene.replicatePredictionId);
        console.log(`[Jobs API] Prediction ${scene.replicatePredictionId}: ${prediction.status}`);
        
        if (prediction.status === 'succeeded' && prediction.output) {
          // Update scene with result
          const sceneIndex = job.scenes.findIndex(s => s.replicatePredictionId === scene.replicatePredictionId);
          if (sceneIndex >= 0) {
            // Upload to Cloudinary
            const cloudinary = require('cloudinary').v2;
            const videoUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
            
            try {
              const uploadResult = await cloudinary.uploader.upload(videoUrl, {
                resource_type: 'video',
                folder: 'ai-videos',
                public_id: `job_${job._id}_scene_${sceneIndex}`
              });
              
              job.scenes[sceneIndex].videoUrl = uploadResult.secure_url;
              job.scenes[sceneIndex].replicateStatus = 'completed';
              job.scenes[sceneIndex].source = 'kling-ai';
              updated = true;
              console.log(`[Jobs API] Scene ${sceneIndex} AI video uploaded`);
            } catch (uploadErr) {
              console.error(`[Jobs API] Upload failed:`, uploadErr.message);
              job.scenes[sceneIndex].replicateStatus = 'failed';
            }
          }
        } else if (prediction.status === 'failed') {
          const sceneIndex = job.scenes.findIndex(s => s.replicatePredictionId === scene.replicatePredictionId);
          if (sceneIndex >= 0) {
            job.scenes[sceneIndex].replicateStatus = 'failed';
            updated = true;
          }
        }
      } catch (predErr) {
        console.error(`[Jobs API] Prediction check error:`, predErr.message);
      }
    }
    
    // Check if all scenes are done
    const stillPending = job.scenes.filter(s => s.replicateStatus === 'pending');
    
    if (stillPending.length === 0 || updated) {
      await job.save();
      
      if (stillPending.length === 0) {
        // Continue processing
        const { continueProcessingAfterAI } = require('../services/videoJobWorker');
        console.log(`[Jobs API] All AI scenes done, continuing processing`);
        
        // Don't await - let it process in background
        continueProcessingAfterAI(job._id).catch(err => {
          console.error(`[Jobs API] Continue processing error:`, err.message);
        });
      }
    }
    
    res.json({
      status: job.status,
      pendingCount: stillPending.length,
      updated
    });
    
  } catch (error) {
    console.error('[Jobs API] Check-AI error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
