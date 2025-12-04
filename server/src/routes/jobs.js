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
    const { topic, contentType, targetDuration, voiceId, voiceStyle, userId } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    // Check env vars
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Jobs API] OPENAI_API_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error: OpenAI API key missing' });
    }
    
    // Create job in database
    const job = new VideoJob({
      userId: userId || null,
      topic,
      contentType: contentType || 'tips',
      targetDuration: targetDuration || 15,
      voiceId: voiceId || 'pNInz6obpgDQGcFmaJgB',
      voiceStyle: voiceStyle || 'energetic',
      status: 'pending',
      progress: 0,
      statusMessage: 'Queued...'
    });
    
    await job.save();
    console.log(`[Jobs API] Created job ${job._id} for topic: "${topic}"`);
    console.log(`[Jobs API] ENV check - OpenAI: ${!!process.env.OPENAI_API_KEY}, ElevenLabs: ${!!process.env.ELEVENLABS_API_KEY}, Shotstack: ${!!process.env.SHOTSTACK_API_KEY}`);
    
    // On Vercel serverless, we need to process synchronously
    // The 120s Pro timeout should be enough for most videos
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

module.exports = router;
