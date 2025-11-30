/**
 * Parallel Processor Service
 * Handles concurrent execution of Replicate, Shotstack, and Google TTS operations
 * Implements Promise.allSettled for fault-tolerant parallel processing
 */

const googleTTSService = require('./googleTTS');
const replicateService = require('./replicate');
const openaiService = require('./openai');
const videoComposerService = require('./videoComposer');
const shotstackService = require('./shotstackClient');
const subtitleGenerator = require('./subtitleGenerator');

/**
 * Task result wrapper
 */
class TaskResult {
  constructor(taskName, success, data = null, error = null, duration = 0) {
    this.taskName = taskName;
    this.success = success;
    this.data = data;
    this.error = error;
    this.duration = duration;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Parallel Processor for AI services
 */
class ParallelProcessor {
  constructor() {
    this.maxConcurrent = 5; // Maximum concurrent tasks
    this.timeout = 300000; // 5 minutes default timeout
  }

  /**
   * Execute a single task with timeout and timing
   * @param {string} taskName - Name of the task
   * @param {Function} taskFn - Async function to execute
   * @param {number} timeout - Timeout in ms
   */
  async executeTask(taskName, taskFn, timeout = this.timeout) {
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        taskFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Task ${taskName} timed out after ${timeout}ms`)), timeout)
        )
      ]);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Task "${taskName}" completed in ${duration}ms`);
      
      return new TaskResult(taskName, true, result, null, duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Task "${taskName}" failed after ${duration}ms:`, error.message);
      
      return new TaskResult(taskName, false, null, error.message, duration);
    }
  }

  /**
   * Execute multiple tasks in parallel
   * Uses Promise.allSettled for fault-tolerant execution
   * @param {Array} tasks - Array of { name, fn, timeout? }
   */
  async executeParallel(tasks) {
    console.log(`🚀 Starting ${tasks.length} tasks in parallel...`);
    const startTime = Date.now();

    const taskPromises = tasks.map(task => 
      this.executeTask(task.name, task.fn, task.timeout || this.timeout)
    );

    const results = await Promise.allSettled(taskPromises);
    
    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return new TaskResult(tasks[index].name, false, null, result.reason?.message || 'Unknown error');
      }
    });

    const totalDuration = Date.now() - startTime;
    const successCount = processedResults.filter(r => r.success).length;
    const failCount = processedResults.filter(r => !r.success).length;

    console.log(`📊 Parallel execution completed in ${totalDuration}ms`);
    console.log(`   ✅ Successful: ${successCount} | ❌ Failed: ${failCount}`);

    return {
      results: processedResults,
      summary: {
        total: tasks.length,
        successful: successCount,
        failed: failCount,
        totalDuration
      }
    };
  }

  /**
   * Execute tasks in batches with controlled concurrency
   * @param {Array} tasks - Array of { name, fn, timeout? }
   * @param {number} batchSize - Number of concurrent tasks
   */
  async executeBatched(tasks, batchSize = this.maxConcurrent) {
    const results = [];
    
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tasks.length / batchSize)}`);
      
      const batchResults = await this.executeParallel(batch);
      results.push(...batchResults.results);
    }

    return {
      results,
      summary: {
        total: tasks.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };
  }

  // ==================== REEL CREATION WORKFLOWS ====================

  /**
   * Create reel with parallel TTS, video generation, and subtitle generation
   * Script must be generated first (dependency), then TTS, video, and subtitles run in parallel
   */
  async createReelParallel(options) {
    const {
      topic,
      videoPrompt,
      voiceStyle = 'energetic',
      textOverlay,
      textPosition = 'bottom',
      skipScript = false,
      customScript = null,
      generateSubtitles = true, // NEW: Auto-generate subtitles
      subtitleFormat = 'sentence', // 'sentence', 'word', 'karaoke', 'highlighted'
      maxWordsPerCaption = 6
    } = options;

    const results = {
      script: null,
      voiceover: null,
      video: null,
      subtitles: null,
      errors: []
    };

    const startTime = Date.now();
    console.log('🎬 Starting parallel reel creation with subtitles...');

    // Step 1: Generate script (must complete first if needed)
    let script = customScript || '';
    if (!skipScript && topic && !customScript) {
      console.log('📝 Step 1: Generating script (sequential - required for TTS & subtitles)...');
      const scriptResult = await this.executeTask('script', async () => {
        return await openaiService.generateReelScript(topic, 15);
      });

      if (scriptResult.success && scriptResult.data.success) {
        script = scriptResult.data.script;
        results.script = {
          success: true,
          data: script,
          duration: scriptResult.duration
        };
      } else {
        results.errors.push({ step: 'script', error: scriptResult.error || scriptResult.data?.error });
      }
    }

    // Step 2: Run TTS, Video, and Subtitle generation in PARALLEL
    console.log('🚀 Step 2: Starting TTS, Video, and Subtitles in parallel...');
    
    const parallelTasks = [];

    // TTS task (only if we have a script)
    if (script) {
      parallelTasks.push({
        name: 'voiceover',
        fn: async () => {
          const result = await googleTTSService.generateVoiceover(script, voiceStyle);
          if (!result.success) throw new Error(result.error);
          return result;
        },
        timeout: 60000 // 1 minute for TTS
      });

      // Subtitle generation task (runs in parallel with TTS and video)
      if (generateSubtitles) {
        parallelTasks.push({
          name: 'subtitles',
          fn: async () => {
            const result = await subtitleGenerator.generateSubtitles(script, {
              style: voiceStyle,
              format: subtitleFormat,
              maxWordsPerCaption,
              outputFormats: ['json', 'srt', 'vtt']
            });
            return result;
          },
          timeout: 10000 // 10 seconds for subtitle generation
        });
      }
    }

    // Video generation task
    const videoPromptFinal = videoPrompt || `${topic}, cinematic, high quality, smooth motion`;
    parallelTasks.push({
      name: 'video',
      fn: async () => {
        const result = await replicateService.startTextToVideo(videoPromptFinal, {
          numFrames: 16,
          fps: 8,
          steps: 25
        });
        if (!result.success) throw new Error(result.error);
        return result;
      },
      timeout: 120000 // 2 minutes for video start
    });

    // Execute parallel tasks
    const parallelResults = await this.executeParallel(parallelTasks);

    // Process parallel results
    for (const result of parallelResults.results) {
      if (result.taskName === 'voiceover') {
        if (result.success) {
          results.voiceover = {
            success: true,
            audioUrl: result.data.audioUrl,
            isPublicUrl: result.data.isPublicUrl,
            filename: result.data.filename,
            duration: result.duration
          };
          console.log('🔊 Voiceover URL (public):', result.data.audioUrl);
        } else {
          results.errors.push({ step: 'voiceover', error: result.error });
        }
      } else if (result.taskName === 'video') {
        if (result.success) {
          results.video = {
            success: true,
            predictionId: result.data.predictionId,
            status: result.data.status,
            duration: result.duration
          };
        } else {
          results.errors.push({ step: 'video', error: result.error });
        }
      } else if (result.taskName === 'subtitles') {
        if (result.success) {
          results.subtitles = {
            success: true,
            captions: result.data.captions,
            totalDuration: result.data.totalDuration,
            captionCount: result.data.captionCount,
            files: result.data.files,
            duration: result.duration
          };
        } else {
          results.errors.push({ step: 'subtitles', error: result.error });
        }
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`✅ Parallel reel creation completed in ${totalDuration}ms`);

    return {
      success: results.errors.length === 0,
      script,
      audioUrl: results.voiceover?.audioUrl,
      isPublicAudioUrl: results.voiceover?.isPublicUrl, // true if Cloudinary URL
      videoPredictionId: results.video?.predictionId,
      textOverlay: textOverlay || script?.substring(0, 50) + '...',
      subtitles: results.subtitles ? {
        captions: results.subtitles.captions,
        totalDuration: results.subtitles.totalDuration,
        captionCount: results.subtitles.captionCount,
        srtUrl: results.subtitles.files?.srt?.url,
        vttUrl: results.subtitles.files?.vtt?.url,
        jsonUrl: results.subtitles.files?.json?.url
      } : null,
      timing: {
        total: totalDuration,
        script: results.script?.duration || 0,
        voiceover: results.voiceover?.duration || 0,
        video: results.video?.duration || 0,
        subtitles: results.subtitles?.duration || 0
      },
      errors: results.errors
    };
  }

  /**
   * Generate multiple videos in parallel
   * @param {Array} prompts - Array of video prompts
   * @param {Object} options - Generation options
   */
  async generateVideosParallel(prompts, options = {}) {
    const tasks = prompts.map((prompt, index) => ({
      name: `video_${index}`,
      fn: async () => {
        const result = await replicateService.startTextToVideo(prompt, options);
        if (!result.success) throw new Error(result.error);
        return result;
      },
      timeout: 120000
    }));

    return await this.executeParallel(tasks);
  }

  /**
   * Generate multiple voiceovers in parallel
   * @param {Array} scripts - Array of { text, style } objects
   */
  async generateVoiceoversParallel(scripts) {
    const tasks = scripts.map((script, index) => ({
      name: `tts_${index}`,
      fn: async () => {
        const result = await googleTTSService.generateVoiceover(script.text, script.style || 'energetic');
        if (!result.success) throw new Error(result.error);
        return result;
      },
      timeout: 60000
    }));

    return await this.executeParallel(tasks);
  }

  /**
   * Full parallel workflow: Multiple scripts -> TTS -> Videos
   * Great for batch content creation
   */
  async batchCreateContent(topics, options = {}) {
    const {
      voiceStyle = 'energetic',
      videoStyle = 'cinematic'
    } = options;

    console.log(`🎬 Starting batch creation for ${topics.length} topics...`);
    const startTime = Date.now();

    // Step 1: Generate all scripts in parallel
    console.log('📝 Generating scripts in parallel...');
    const scriptTasks = topics.map((topic, index) => ({
      name: `script_${index}`,
      fn: async () => {
        const result = await openaiService.generateReelScript(topic, 15);
        if (!result.success) throw new Error(result.error);
        return { topic, script: result.script };
      },
      timeout: 30000
    }));

    const scriptResults = await this.executeParallel(scriptTasks);
    const successfulScripts = scriptResults.results
      .filter(r => r.success)
      .map(r => r.data);

    // Step 2: Generate TTS and Videos in parallel for all scripts
    console.log('🔊🎥 Generating voiceovers and videos in parallel...');
    const mediaTask = [];

    successfulScripts.forEach((item, index) => {
      // TTS task
      mediaTask.push({
        name: `tts_${index}`,
        fn: async () => {
          const result = await googleTTSService.generateVoiceover(item.script, voiceStyle);
          if (!result.success) throw new Error(result.error);
          return { ...result, topicIndex: index };
        },
        timeout: 60000
      });

      // Video task
      mediaTask.push({
        name: `video_${index}`,
        fn: async () => {
          const prompt = `${item.topic}, ${videoStyle}, high quality, smooth motion`;
          const result = await replicateService.startTextToVideo(prompt);
          if (!result.success) throw new Error(result.error);
          return { ...result, topicIndex: index };
        },
        timeout: 120000
      });
    });

    const mediaResults = await this.executeBatched(mediaTask, 6); // 6 concurrent tasks

    // Organize results by topic
    const finalResults = successfulScripts.map((item, index) => {
      const ttsResult = mediaResults.results.find(r => r.taskName === `tts_${index}`);
      const videoResult = mediaResults.results.find(r => r.taskName === `video_${index}`);

      return {
        topic: item.topic,
        script: item.script,
        voiceover: ttsResult?.success ? {
          audioUrl: ttsResult.data.audioUrl,
          filename: ttsResult.data.filename
        } : { error: ttsResult?.error },
        video: videoResult?.success ? {
          predictionId: videoResult.data.predictionId,
          status: videoResult.data.status
        } : { error: videoResult?.error }
      };
    });

    const totalDuration = Date.now() - startTime;
    console.log(`✅ Batch creation completed in ${totalDuration}ms`);

    return {
      success: true,
      results: finalResults,
      timing: {
        total: totalDuration,
        averagePerTopic: Math.round(totalDuration / topics.length)
      },
      summary: {
        topics: topics.length,
        scriptsGenerated: successfulScripts.length,
        voiceoversGenerated: mediaResults.results.filter(r => r.taskName.startsWith('tts_') && r.success).length,
        videosStarted: mediaResults.results.filter(r => r.taskName.startsWith('video_') && r.success).length
      }
    };
  }

  /**
   * Wait for multiple video predictions to complete
   * Polls all in parallel with exponential backoff
   */
  async waitForVideosParallel(predictionIds, options = {}) {
    const {
      pollInterval = 5000,
      maxAttempts = 60,
      onProgress = null
    } = options;

    const startTime = Date.now();
    const statuses = new Map(predictionIds.map(id => [id, { status: 'processing', attempts: 0 }]));
    
    while (true) {
      const pendingIds = [...statuses.entries()]
        .filter(([_, s]) => s.status === 'processing' || s.status === 'starting')
        .map(([id]) => id);

      if (pendingIds.length === 0) break;

      // Check all pending predictions in parallel
      const checkTasks = pendingIds.map(id => ({
        name: `check_${id}`,
        fn: async () => {
          const result = await replicateService.getPredictionStatus(id);
          return { id, ...result };
        },
        timeout: 10000
      }));

      const checkResults = await this.executeParallel(checkTasks);

      // Update statuses
      for (const result of checkResults.results) {
        if (result.success) {
          const { id, status, output, error } = result.data;
          const current = statuses.get(id);
          current.status = status;
          current.attempts++;
          
          if (status === 'succeeded') {
            current.output = output;
          } else if (status === 'failed') {
            current.error = error;
          } else if (current.attempts >= maxAttempts) {
            current.status = 'timeout';
            current.error = 'Max polling attempts reached';
          }
        }
      }

      // Report progress
      if (onProgress) {
        const completed = [...statuses.values()].filter(s => s.status === 'succeeded').length;
        const failed = [...statuses.values()].filter(s => s.status === 'failed' || s.status === 'timeout').length;
        onProgress({ completed, failed, total: predictionIds.length });
      }

      // Check if all done
      const allDone = [...statuses.values()].every(s => 
        s.status === 'succeeded' || s.status === 'failed' || s.status === 'timeout'
      );
      
      if (allDone) break;

      await this.sleep(pollInterval);
    }

    const totalDuration = Date.now() - startTime;

    return {
      results: Object.fromEntries(statuses),
      timing: { total: totalDuration },
      summary: {
        succeeded: [...statuses.values()].filter(s => s.status === 'succeeded').length,
        failed: [...statuses.values()].filter(s => s.status === 'failed').length,
        timeout: [...statuses.values()].filter(s => s.status === 'timeout').length
      }
    };
  }

  // ==================== SHOTSTACK PARALLEL OPERATIONS ====================

  /**
   * Create reel using Shotstack for video composition (parallel TTS + Replicate + Shotstack)
   * This uses Replicate for AI video generation and Shotstack for composition
   */
  async createReelWithShotstack(options) {
    const {
      topic,
      videoPrompt,
      voiceStyle = 'energetic',
      textOverlay,
      textPosition = 'bottom',
      customScript = null,
      useShotstack = true
    } = options;

    if (!shotstackService.isConfigured() && useShotstack) {
      console.warn('⚠️ Shotstack not configured, falling back to local composition');
      return this.createReelParallel(options);
    }

    const results = {
      script: null,
      voiceover: null,
      video: null,
      composed: null,
      errors: []
    };

    const startTime = Date.now();
    console.log('🎬 Starting reel creation with Shotstack composition...');

    // Step 1: Generate script if needed
    let script = customScript || '';
    if (topic && !customScript) {
      console.log('📝 Step 1: Generating script...');
      const scriptResult = await this.executeTask('script', async () => {
        return await openaiService.generateReelScript(topic, 15);
      });

      if (scriptResult.success && scriptResult.data.success) {
        script = scriptResult.data.script;
        results.script = { success: true, data: script, duration: scriptResult.duration };
      } else {
        results.errors.push({ step: 'script', error: scriptResult.error || scriptResult.data?.error });
      }
    }

    // Step 2: Run TTS and Video generation in PARALLEL
    console.log('🚀 Step 2: Starting TTS and Video generation in parallel...');
    
    const parallelTasks = [];

    // TTS task
    if (script) {
      parallelTasks.push({
        name: 'voiceover',
        fn: async () => {
          const result = await googleTTSService.generateVoiceover(script, voiceStyle);
          if (!result.success) throw new Error(result.error);
          return result;
        },
        timeout: 60000
      });
    }

    // Video generation task
    const videoPromptFinal = videoPrompt || `${topic}, cinematic, high quality, smooth motion`;
    parallelTasks.push({
      name: 'video',
      fn: async () => {
        const result = await replicateService.textToVideo(videoPromptFinal); // Wait for completion
        if (!result.success) throw new Error(result.error);
        return result;
      },
      timeout: 300000 // 5 minutes for full video generation
    });

    const parallelResults = await this.executeParallel(parallelTasks);

    let audioUrl = null;
    let videoUrl = null;

    for (const result of parallelResults.results) {
      if (result.taskName === 'voiceover') {
        if (result.success) {
          // Use the Cloudinary URL if available (required for Shotstack)
          // The audioUrl returned is already the public URL from Cloudinary if configured
          audioUrl = result.data.audioUrl;
          console.log('🔊 Using audio URL for composition:', audioUrl);
          results.voiceover = { 
            success: true, 
            audioUrl, 
            isPublicUrl: result.data.isPublicUrl,
            duration: result.duration 
          };
        } else {
          results.errors.push({ step: 'voiceover', error: result.error });
        }
      } else if (result.taskName === 'video') {
        if (result.success) {
          videoUrl = result.data.videoUrl;
          results.video = { success: true, videoUrl, duration: result.duration };
        } else {
          results.errors.push({ step: 'video', error: result.error });
        }
      }
    }

    // Step 3: Compose with Shotstack
    if (videoUrl && useShotstack && shotstackService.isConfigured()) {
      console.log('🎬 Step 3: Composing with Shotstack...');
      
      const composeResult = await this.executeTask('compose', async () => {
        const result = await shotstackService.createReelWithVoiceover(
          videoUrl,
          audioUrl,
          { text: textOverlay || script?.substring(0, 50), textPosition }
        );
        
        if (!result.success) throw new Error(result.error);
        
        // Wait for Shotstack render
        const renderResult = await shotstackService.waitForRender(result.renderId);
        if (!renderResult.success) throw new Error(renderResult.error);
        
        return renderResult;
      }, 600000); // 10 minutes for Shotstack

      if (composeResult.success) {
        results.composed = { success: true, videoUrl: composeResult.data.videoUrl, duration: composeResult.duration };
      } else {
        results.errors.push({ step: 'compose', error: composeResult.error });
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`✅ Shotstack reel creation completed in ${totalDuration}ms`);

    return {
      success: results.errors.length === 0,
      script,
      audioUrl,
      rawVideoUrl: videoUrl,
      composedVideoUrl: results.composed?.videoUrl,
      timing: {
        total: totalDuration,
        script: results.script?.duration || 0,
        voiceover: results.voiceover?.duration || 0,
        video: results.video?.duration || 0,
        compose: results.composed?.duration || 0
      },
      errors: results.errors
    };
  }

  /**
   * Render multiple videos with Shotstack in parallel
   */
  async renderVideosWithShotstack(renderConfigs) {
    if (!shotstackService.isConfigured()) {
      throw new Error('Shotstack not configured');
    }

    const renderTasks = renderConfigs.map((config, index) => ({
      name: `shotstack_${index}`,
      fn: async () => {
        let result;
        
        if (config.type === 'merge') {
          result = await shotstackService.mergeVideos(config.videoUrls, config.options);
        } else if (config.type === 'caption') {
          result = await shotstackService.addCaptions(config.videoUrl, config.captions, config.options);
        } else if (config.type === 'reel') {
          result = await shotstackService.createReelWithVoiceover(config.videoUrl, config.audioUrl, config.options);
        } else {
          result = await shotstackService.createVideoWithText(config.videoUrl, config.textOverlays, config.options);
        }

        if (!result.success) throw new Error(result.error);
        return result;
      },
      timeout: 120000
    }));

    return await this.executeParallel(renderTasks);
  }

  /**
   * Wait for multiple Shotstack renders in parallel
   */
  async waitForShotstackRenders(renderIds, options = {}) {
    if (!shotstackService.isConfigured()) {
      throw new Error('Shotstack not configured');
    }

    const { pollInterval = 5000, maxAttempts = 120 } = options;
    const startTime = Date.now();
    const statuses = new Map(renderIds.map(id => [id, { status: 'queued', attempts: 0 }]));
    
    while (true) {
      const pendingIds = [...statuses.entries()]
        .filter(([_, s]) => !['done', 'failed', 'timeout'].includes(s.status))
        .map(([id]) => id);

      if (pendingIds.length === 0) break;

      const checkTasks = pendingIds.map(id => ({
        name: `check_${id}`,
        fn: async () => {
          const result = await shotstackService.getRenderStatus(id);
          return { id, ...result };
        },
        timeout: 10000
      }));

      const checkResults = await this.executeParallel(checkTasks);

      for (const result of checkResults.results) {
        if (result.success) {
          const { id, status, url, error } = result.data;
          const current = statuses.get(id);
          current.status = status;
          current.attempts++;
          
          if (status === 'done') {
            current.url = url;
          } else if (status === 'failed') {
            current.error = error;
          } else if (current.attempts >= maxAttempts) {
            current.status = 'timeout';
            current.error = 'Max polling attempts reached';
          }
        }
      }

      const allDone = [...statuses.values()].every(s => 
        ['done', 'failed', 'timeout'].includes(s.status)
      );
      
      if (allDone) break;
      await this.sleep(pollInterval);
    }

    return {
      results: Object.fromEntries(statuses),
      timing: { total: Date.now() - startTime },
      summary: {
        done: [...statuses.values()].filter(s => s.status === 'done').length,
        failed: [...statuses.values()].filter(s => s.status === 'failed').length,
        timeout: [...statuses.values()].filter(s => s.status === 'timeout').length
      }
    };
  }

  /**
   * Helper: Sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ParallelProcessor();
