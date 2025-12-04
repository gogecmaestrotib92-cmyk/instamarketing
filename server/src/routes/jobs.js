/**
 * VIDEO JOBS API ROUTES
 * ======================
 * POST /api/jobs - Create a new video generation job
 * GET /api/jobs/:id - Get job status (for polling)
 * GET /api/jobs - List user's jobs
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
    
    // Start processing in background (don't await)
    // This allows the request to return immediately
    processJob(job._id).catch(err => {
      console.error(`[Jobs API] Job ${job._id} failed:`, err.message);
    });
    
    // Return job ID immediately
    res.status(201).json({
      success: true,
      jobId: job._id,
      status: job.status,
      message: 'Job created, processing started'
    });
    
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
