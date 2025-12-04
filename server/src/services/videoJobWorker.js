/**
 * VIDEO JOB WORKER
 * =================
 * Processes video generation jobs step by step.
 * Each step updates job status for frontend polling.
 */

const VideoJob = require('../models/VideoJob');
const OpenAI = require('openai');
const axios = require('axios');
const FormData = require('form-data');
const cloudinary = require('cloudinary').v2;
const replicateService = require('./replicate');

// replicateService is already an instance, no need to instantiate

// Initialize OpenAI lazily (to ensure env vars are loaded)
let openaiClient = null;
function getOpenAI() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// Initialize Cloudinary
cloudinary.config({
  cloud_name: 'ddvtwoyxp',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Curated videos database (Cloudinary-hosted)
const CURATED_VIDEOS = {
  fitness: [
    { id: '4761433', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1764852474/instamarketing/curated-videos/pexels-4761433.mp4', keywords: ['abs', 'floor', 'core', 'workout', 'exercise'], duration: 15 },
    { id: '5319340', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1764852477/instamarketing/curated-videos/pexels-5319340.mp4', keywords: ['training', 'core', 'gym', 'fitness'], duration: 10 },
    { id: '4761486', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1764852488/instamarketing/curated-videos/pexels-4761486.mp4', keywords: ['plank', 'side', 'stability', 'balance'], duration: 12 },
    { id: '4761718', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1764852495/instamarketing/curated-videos/pexels-4761718.mp4', keywords: ['dumbbell', 'weights', 'strength', 'arms'], duration: 12 },
    { id: '4761735', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1764852502/instamarketing/curated-videos/pexels-4761735.mp4', keywords: ['shoulder', 'press', 'overhead', 'strength'], duration: 10 }
  ],
  // TODO: Add more categories
  business: [],
  lifestyle: [],
  technology: [],
  food: [],
  travel: []
};

/**
 * STEP 1: Generate script and scenes
 */
async function generateScript(job) {
  await updateJobStatus(job, 'generating_script', 10, 'Generating script...');
  
  try {
    const openai = getOpenAI();
    
    const prompt = `Create a ${job.targetDuration}-second video script about: "${job.topic}"
  
  Return ONLY valid JSON in this exact format:
  {
    "hook": "Opening hook line (2-3 seconds)",
    "scenes": [
      {
        "text": "What the voiceover says for this scene",
        "visual": "2-3 word VIDEO SEARCH TERM for stock footage",
        "duration": 5
      }
    ],
    "cta": "Call to action (2-3 seconds)"
  }
  
  CRITICAL RULES FOR "visual" field:
  - Use ONLY 2-3 simple words that work as stock video search terms
  - Examples: "woman running", "coffee pouring", "laptop typing", "sunset beach", "gym workout", "cooking kitchen", "money cash", "happy family"
  - DO NOT use abstract concepts like "success" or "motivation" - use concrete visuals
  - DO NOT use full sentences - just 2-3 searchable words
  - Think: what would I type into a stock video site to find this clip?
  
  Other rules:
  - Keep total duration close to ${job.targetDuration} seconds
  - Each scene should be 3-7 seconds
  - Make it punchy and engaging for social media`;
  
    console.log(`[Job ${job._id}] Calling OpenAI for script generation...`);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });
    
    const content = JSON.parse(response.choices[0].message.content);
    console.log(`[Job ${job._id}] Script generated:`, content.hook);
    
    // Build scenes array
    const scenes = [];
    let order = 0;
    
    // Generate better search terms for hook and CTA based on topic
    const topicWords = job.topic.toLowerCase().split(' ').slice(0, 2).join(' ');
    
    // Add hook as first scene
    scenes.push({
      order: order++,
      text: content.hook,
      duration: 3,
      visual: topicWords || 'attention grabbing'
    });
    
    // Add main scenes
    for (const scene of content.scenes) {
      scenes.push({
        order: order++,
        text: scene.text,
        duration: scene.duration || 5,
        visual: scene.visual
      });
    }
    
    // Add CTA as last scene
    scenes.push({
      order: order++,
      text: content.cta,
      duration: 3,
      visual: topicWords || 'thumbs up'
    });
    
    job.script = JSON.stringify(content);
    job.scenes = scenes;
    await job.save();
    
    console.log(`[Job ${job._id}] Generated ${scenes.length} scenes`);
    return job;
    
  } catch (error) {
    console.error(`[Job ${job._id}] Script generation error:`, error.message);
    throw new Error(`Script generation failed: ${error.message}`);
  }
}

/**
 * STEP 2: Find videos for each scene by searching Pexels
 * For product/brand videos, use AI generation first
 */
async function findVideosForScenes(job) {
  await updateJobStatus(job, 'finding_videos', 30, 'Searching for matching videos...');
  
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
  console.log(`[Job ${job._id}] Pexels API key configured: ${!!PEXELS_API_KEY}`);
  console.log(`[Job ${job._id}] isProductVideo: ${job.isProductVideo}`);
  
  // For product/brand videos, use AI-first approach
  if (job.isProductVideo) {
    console.log(`[Job ${job._id}] 🎨 Product video detected - using AI-first approach`);
    return findVideosForProductScenes(job);
  }
  
  if (!PEXELS_API_KEY) {
    console.log(`[Job ${job._id}] ⚠️ No Pexels API key! Add PEXELS_API_KEY to Vercel env vars`);
    console.log(`[Job ${job._id}] Using fallback curated videos instead`);
    return useFallbackVideos(job);
  }
  
  // Search Pexels for each scene and upload to Cloudinary
  for (let i = 0; i < job.scenes.length; i++) {
    const scene = job.scenes[i];
    let searchQuery = scene.visual || job.topic;
    
    // Clean up search query - extract key words
    searchQuery = searchQuery
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .split(' ')
      .filter(w => w.length > 2) // Remove short words
      .slice(0, 3) // Max 3 words
      .join(' ');
    
    try {
      console.log(`[Job ${job._id}] Scene ${i}: Searching Pexels for "${searchQuery}"`);
      
      let videos = [];
      
      // Try multiple search strategies
      const searchStrategies = [
        searchQuery,                                    // Original query
        searchQuery.split(' ')[0],                      // First word only
        job.topic.split(' ').slice(0, 2).join(' ')     // Topic first 2 words
      ];
      
      for (const query of searchStrategies) {
        if (videos.length >= 3) break;
        
        try {
          const searchResponse = await axios.get(
            `https://api.pexels.com/videos/search`,
            {
              params: {
                query: query,
                orientation: 'portrait',
                size: 'medium',
                per_page: 5
              },
              headers: {
                'Authorization': PEXELS_API_KEY
              },
              timeout: 10000
            }
          );
          
          if (searchResponse.data.videos && searchResponse.data.videos.length > 0) {
            videos = searchResponse.data.videos;
            console.log(`[Job ${job._id}] Scene ${i}: Found ${videos.length} videos for "${query}"`);
            break;
          }
        } catch (searchErr) {
          console.log(`[Job ${job._id}] Scene ${i}: Search failed for "${query}"`);
        }
      }
      
      if (videos.length === 0) {
        throw new Error('No Pexels videos found');
      }
      
      // Pick a random video from top results (for variety)
      const randomIndex = Math.floor(Math.random() * Math.min(videos.length, 3));
      const selectedVideo = videos[randomIndex];
      
      // Find HD video file (prefer portrait)
      const videoFile = selectedVideo.video_files.find(f => 
        f.quality === 'hd' && f.height > f.width
      ) || selectedVideo.video_files.find(f => 
        f.quality === 'hd'
      ) || selectedVideo.video_files[0];
      
      console.log(`[Job ${job._id}] Scene ${i}: Downloading Pexels ${videoFile.width}x${videoFile.height}`);
      
      // Download video
      const videoResponse = await axios.get(videoFile.link, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      const videoBuffer = Buffer.from(videoResponse.data);
      console.log(`[Job ${job._id}] Scene ${i}: Downloaded ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      
      // Upload to Cloudinary
      const cloudinaryUrl = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'video',
            folder: 'job-videos',
            public_id: `job_${job._id}_scene_${i}`
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        uploadStream.end(videoBuffer);
      });
      
      job.scenes[i].videoUrl = cloudinaryUrl;
      job.scenes[i].source = 'pexels';
      console.log(`[Job ${job._id}] Scene ${i}: Uploaded Pexels video to ${cloudinaryUrl}`);
      
    } catch (error) {
      console.error(`[Job ${job._id}] Scene ${i} Pexels failed: ${error.message}`);
      
      // FALLBACK 1: Try Pixabay
      console.log(`[Job ${job._id}] Scene ${i}: Trying Pixabay...`);
      const pixabayResult = await searchPixabayVideo(scene, job, i);
      
      if (pixabayResult.success) {
        job.scenes[i].videoUrl = pixabayResult.videoUrl;
        job.scenes[i].source = 'pixabay';
        console.log(`[Job ${job._id}] Scene ${i}: Pixabay video found and uploaded`);
      } else {
        // FALLBACK 2: Try Kling AI
        console.log(`[Job ${job._id}] Scene ${i}: Pixabay failed, trying Kling AI...`);
        await updateJobStatus(job, 'finding_videos', 30 + Math.floor((i / job.scenes.length) * 15), 
          `Generating AI video for scene ${i + 1}...`);
        
        try {
          const klingResult = await generateVideoWithKling(scene, job._id, i);
          if (klingResult.success) {
            job.scenes[i].videoUrl = klingResult.videoUrl;
            job.scenes[i].source = 'kling-ai';
            job.scenes[i].aiGenerated = true;
            console.log(`[Job ${job._id}] Scene ${i}: Kling AI video generated successfully`);
          } else {
            throw new Error(klingResult.error || 'Kling generation failed');
          }
        } catch (klingError) {
          console.error(`[Job ${job._id}] Scene ${i} Kling failed: ${klingError.message}, using curated fallback`);
          // Final fallback: Use curated videos
          const fallbackVideos = CURATED_VIDEOS.fitness;
          const fallback = fallbackVideos[i % fallbackVideos.length];
          job.scenes[i].videoUrl = fallback.url;
          job.scenes[i].source = 'curated';
        }
      }
    }
    
    // Update progress
    const progress = 30 + Math.floor((i / job.scenes.length) * 15);
    await updateJobStatus(job, 'finding_videos', progress, `Finding videos... ${i + 1}/${job.scenes.length}`);
  }
  
  await job.save();
  return job;
}

/**
 * STEP 2 (PRODUCT): Find videos for product/brand video
 * Uses stock videos with enhanced search based on business context
 * (Kling AI is too slow for Vercel's timeout - would need a queue system)
 * Order: Pexels → Pixabay → Curated
 */
async function findVideosForProductScenes(job) {
  console.log(`[Job ${job._id}] 🎬 Starting video search for product video`);
  
  const businessName = job.businessInfo?.businessName || '';
  const industry = job.businessInfo?.industry || '';
  const productName = job.businessInfo?.productName || '';
  
  console.log(`[Job ${job._id}] Business: ${businessName}, Industry: ${industry}, Product: ${productName}`);
  
  for (let i = 0; i < job.scenes.length; i++) {
    const scene = job.scenes[i];
    await updateJobStatus(job, 'finding_videos', 30 + Math.floor((i / job.scenes.length) * 15), 
      `Finding video for scene ${i + 1}/${job.scenes.length}...`);
    
    try {
      // Build enhanced search query with industry context
      let searchQuery = scene.visual || '';
      
      // Add industry-specific keywords to improve search results
      if (industry) {
        const industryKeywords = {
          'fitness': 'workout gym exercise fitness training',
          'food': 'cooking food restaurant kitchen chef',
          'technology': 'tech computer digital modern office',
          'fashion': 'fashion style clothing boutique model',
          'beauty': 'beauty skincare makeup cosmetics spa',
          'health': 'health wellness medical care doctor',
          'education': 'learning education school study books',
          'travel': 'travel vacation destination adventure journey',
          'real estate': 'house property home interior architecture',
          'finance': 'business money finance office professional'
        };
        const keywords = industryKeywords[industry.toLowerCase()] || industry;
        // Combine visual with industry context
        searchQuery = `${searchQuery} ${keywords.split(' ')[0]}`;
      }
      
      console.log(`[Job ${job._id}] Scene ${i}: Enhanced search: "${searchQuery}"`);
      
      // Use stock video fallback (already handles Pexels → Pixabay → Curated)
      const stockResult = await findStockVideoFallback(scene, job, i);
      job.scenes[i].videoUrl = stockResult.videoUrl;
      job.scenes[i].source = stockResult.source;
      console.log(`[Job ${job._id}] Scene ${i}: ✅ Found ${stockResult.source} video`);
      
    } catch (error) {
      console.error(`[Job ${job._id}] Scene ${i} error:`, error.message);
      // Final fallback
      const fallbackVideos = CURATED_VIDEOS.fitness;
      const fallback = fallbackVideos[i % fallbackVideos.length];
      job.scenes[i].videoUrl = fallback.url;
      job.scenes[i].source = 'curated';
    }
    
    // Update progress
    const progress = 30 + Math.floor((i / job.scenes.length) * 15);
    await updateJobStatus(job, 'finding_videos', progress, `Finding videos... ${i + 1}/${job.scenes.length}`);
  }
  
  await job.save();
  return job;
}

/**
 * Fallback to stock videos (Pexels → Pixabay → Curated)
 */
async function findStockVideoFallback(scene, job, sceneIndex) {
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
  
  // Try Pexels
  if (PEXELS_API_KEY) {
    try {
      let searchQuery = scene.visual || job.topic;
      searchQuery = searchQuery
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(' ')
        .filter(w => w.length > 2)
        .slice(0, 3)
        .join(' ');
      
      const response = await axios.get('https://api.pexels.com/videos/search', {
        params: { query: searchQuery, orientation: 'portrait', size: 'medium', per_page: 5 },
        headers: { 'Authorization': PEXELS_API_KEY },
        timeout: 10000
      });
      
      if (response.data.videos?.length > 0) {
        const video = response.data.videos[0];
        const videoFile = video.video_files.find(f => f.quality === 'hd' || f.quality === 'sd') || video.video_files[0];
        
        // Download and upload to Cloudinary
        const videoResponse = await axios.get(videoFile.link, { responseType: 'arraybuffer', timeout: 30000 });
        const videoBuffer = Buffer.from(videoResponse.data);
        
        const cloudinaryUrl = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'video', folder: 'job-videos', public_id: `job_${job._id}_scene_${sceneIndex}` },
            (error, result) => error ? reject(error) : resolve(result.secure_url)
          );
          uploadStream.end(videoBuffer);
        });
        
        return { videoUrl: cloudinaryUrl, source: 'pexels' };
      }
    } catch (e) {
      console.log(`[Job ${job._id}] Pexels fallback failed: ${e.message}`);
    }
  }
  
  // Try Pixabay
  const pixabayResult = await searchPixabayVideo(scene, job, sceneIndex);
  if (pixabayResult.success) {
    return { videoUrl: pixabayResult.videoUrl, source: 'pixabay' };
  }
  
  // Final fallback: curated
  const fallbackVideos = CURATED_VIDEOS.fitness;
  const fallback = fallbackVideos[sceneIndex % fallbackVideos.length];
  return { videoUrl: fallback.url, source: 'curated' };
}

/**
 * Generate video using Kling AI when Pexels has no matching videos
 * @param {object} scene - Scene object with text and visual description
 * @param {string} jobId - Job ID for logging
 * @param {number} sceneIndex - Scene index
 */
async function generateVideoWithKling(scene, jobId, sceneIndex) {
  try {
    // Build a detailed prompt for Kling
    const prompt = `${scene.visual}. ${scene.text}. Cinematic, high quality, professional lighting, smooth motion.`;
    
    console.log(`[Job ${jobId}] Scene ${sceneIndex}: Kling prompt: "${prompt}"`);
    
    const result = await replicateService.generateVideoWithKling(prompt, {
      duration: Math.min(scene.duration || 5, 5), // Kling supports 5 or 10 seconds
      aspectRatio: '9:16' // Portrait for social media
    });
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    // Upload the Kling video to Cloudinary for consistent hosting
    console.log(`[Job ${jobId}] Scene ${sceneIndex}: Downloading Kling video...`);
    const videoResponse = await axios.get(result.videoUrl, {
      responseType: 'arraybuffer',
      timeout: 60000
    });
    
    const videoBuffer = Buffer.from(videoResponse.data);
    console.log(`[Job ${jobId}] Scene ${sceneIndex}: Uploading to Cloudinary...`);
    
    const cloudinaryUrl = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'ai-generated-videos',
          public_id: `job_${jobId}_scene_${sceneIndex}_kling`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      uploadStream.end(videoBuffer);
    });
    
    return { success: true, videoUrl: cloudinaryUrl };
    
  } catch (error) {
    console.error(`[Job ${jobId}] Scene ${sceneIndex} Kling error:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Search Pixabay for video when Pexels has no results
 * @param {object} scene - Scene object with visual description
 * @param {object} job - Job object
 * @param {number} sceneIndex - Scene index
 */
async function searchPixabayVideo(scene, job, sceneIndex) {
  const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || 'u_f8wk1z5c1x';
  
  try {
    let searchQuery = scene.visual || job.topic;
    
    // Clean up search query
    searchQuery = searchQuery
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(' ')
      .filter(w => w.length > 2)
      .slice(0, 3)
      .join('+'); // Pixabay uses + for spaces
    
    console.log(`[Job ${job._id}] Scene ${sceneIndex}: Searching Pixabay for "${searchQuery}"`);
    
    // Try multiple search strategies
    const searchStrategies = [
      searchQuery,
      searchQuery.split('+')[0],
      job.topic.split(' ').slice(0, 2).join('+')
    ];
    
    let videos = [];
    
    for (const query of searchStrategies) {
      if (videos.length > 0) break;
      
      try {
        const response = await axios.get('https://pixabay.com/api/videos/', {
          params: {
            key: PIXABAY_API_KEY,
            q: query,
            video_type: 'all',
            per_page: 5,
            safesearch: true
          },
          timeout: 10000
        });
        
        if (response.data.hits && response.data.hits.length > 0) {
          videos = response.data.hits;
          console.log(`[Job ${job._id}] Scene ${sceneIndex}: Pixabay found ${videos.length} videos for "${query}"`);
          break;
        }
      } catch (searchErr) {
        console.log(`[Job ${job._id}] Scene ${sceneIndex}: Pixabay search failed for "${query}"`);
      }
    }
    
    if (videos.length === 0) {
      return { success: false, error: 'No Pixabay videos found' };
    }
    
    // Pick a random video from results
    const randomIndex = Math.floor(Math.random() * Math.min(videos.length, 3));
    const selectedVideo = videos[randomIndex];
    
    // Pixabay provides videos in different sizes: large, medium, small, tiny
    // Prefer medium for balance of quality and size
    const videoUrl = selectedVideo.videos.medium?.url || 
                     selectedVideo.videos.large?.url || 
                     selectedVideo.videos.small?.url;
    
    if (!videoUrl) {
      return { success: false, error: 'No valid video URL from Pixabay' };
    }
    
    console.log(`[Job ${job._id}] Scene ${sceneIndex}: Downloading Pixabay video...`);
    
    // Download video
    const videoResponse = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    const videoBuffer = Buffer.from(videoResponse.data);
    console.log(`[Job ${job._id}] Scene ${sceneIndex}: Downloaded ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB from Pixabay`);
    
    // Upload to Cloudinary
    const cloudinaryUrl = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'job-videos',
          public_id: `job_${job._id}_scene_${sceneIndex}_pixabay`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      uploadStream.end(videoBuffer);
    });
    
    return { success: true, videoUrl: cloudinaryUrl };
    
  } catch (error) {
    console.error(`[Job ${job._id}] Scene ${sceneIndex} Pixabay error:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Fallback to curated videos when Pexels search fails
 */
function useFallbackVideos(job) {
  const fallbackVideos = CURATED_VIDEOS.fitness;
  for (let i = 0; i < job.scenes.length; i++) {
    const video = fallbackVideos[i % fallbackVideos.length];
    job.scenes[i].videoUrl = video.url;
  }
  return job;
}

/**
 * STEP 3: Generate voiceover for all scenes using ElevenLabs with timestamps
 */
async function generateVoiceover(job) {
  await updateJobStatus(job, 'generating_audio', 50, 'Generating voiceover...');
  
  // Combine all scene text
  const fullScript = job.scenes.map(s => s.text).join(' ');
  
  const voiceId = job.voiceId || 'pNInz6obpgDQGcFmaJgB'; // Default to Adam
  
  // Call ElevenLabs with timestamps
  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
    {
      text: fullScript,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5
      }
    },
    {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    }
  );
  
  const { audio_base64, alignment } = response.data;
  const audioBuffer = Buffer.from(audio_base64, 'base64');
  
  console.log(`[Job ${job._id}] Audio buffer size: ${audioBuffer.length} bytes`);
  
  // Verify Cloudinary is configured
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials not configured');
  }
  
  // Upload to Cloudinary
  const audioUrl = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'voiceovers',
        public_id: `job_${job._id}_audio`
      },
      (error, result) => {
        if (error) {
          console.error(`[Job ${job._id}] Cloudinary upload error:`, error);
          reject(error);
        } else {
          console.log(`[Job ${job._id}] Audio uploaded to: ${result.secure_url}`);
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(audioBuffer);
  });
  
  job.audioUrl = audioUrl;
  
  // Build subtitles from alignment
  const subtitles = [];
  if (alignment && alignment.characters) {
    const chars = alignment.characters;
    const startTimes = alignment.character_start_times_seconds;
    const endTimes = alignment.character_end_times_seconds;
    
    // Group into words
    let currentWord = '';
    let wordStart = 0;
    let wordEnd = 0;
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      if (char === ' ' || i === chars.length - 1) {
        if (i === chars.length - 1 && char !== ' ') {
          currentWord += char;
          wordEnd = endTimes[i];
        }
        if (currentWord.trim()) {
          subtitles.push({
            text: currentWord.trim(),
            start: wordStart,
            end: wordEnd
          });
        }
        currentWord = '';
        if (i < chars.length - 1) {
          wordStart = startTimes[i + 1];
        }
      } else {
        if (currentWord === '') {
          wordStart = startTimes[i];
        }
        currentWord += char;
        wordEnd = endTimes[i];
      }
    }
  }
  
  job.subtitles = subtitles;
  job.totalDuration = subtitles.length > 0 ? subtitles[subtitles.length - 1].end : 15;
  
  console.log(`[Job ${job._id}] Voiceover: ${job.totalDuration}s, ${subtitles.length} subtitle words`);
  await job.save();
  return job;
}

/**
 * STEP 4: Render video with Shotstack
 */
async function renderVideo(job) {
  await updateJobStatus(job, 'rendering', 70, 'Rendering final video...');
  
  const audioDuration = job.totalDuration || 15;
  
  // Build video clips timeline
  const videoClips = [];
  let currentTime = 0;
  const clipDuration = audioDuration / job.scenes.length;
  
  for (let i = 0; i < job.scenes.length; i++) {
    const scene = job.scenes[i];
    videoClips.push({
      asset: {
        type: 'video',
        src: scene.videoUrl,
        trim: 0,
        volume: 0 // Mute original audio
      },
      start: currentTime,
      length: clipDuration,
      fit: 'cover',
      effect: 'zoomIn'
    });
    currentTime += clipDuration;
  }
  
  // Build subtitle clips (Shotstack HTML titles)
  const subtitleClips = [];
  
  // Group words into phrases (3-4 words each)
  const phrases = [];
  let currentPhrase = { words: [], start: 0, end: 0 };
  
  for (const sub of job.subtitles) {
    if (currentPhrase.words.length === 0) {
      currentPhrase.start = sub.start;
    }
    currentPhrase.words.push(sub.text);
    currentPhrase.end = sub.end;
    
    if (currentPhrase.words.length >= 4) {
      phrases.push({
        text: currentPhrase.words.join(' '),
        start: currentPhrase.start,
        end: currentPhrase.end
      });
      currentPhrase = { words: [], start: 0, end: 0 };
    }
  }
  
  // Don't forget last phrase
  if (currentPhrase.words.length > 0) {
    phrases.push({
      text: currentPhrase.words.join(' '),
      start: currentPhrase.start,
      end: currentPhrase.end
    });
  }
  
  // KARAOKE STYLE: Show 4 words, highlight current word in yellow
  // Reduced blinking by extending each word's display time
  const wordTimings = job.subtitles;
  const WORDS_PER_GROUP = 4;
  
  // Group words into display groups
  const wordGroups = [];
  for (let i = 0; i < wordTimings.length; i += WORDS_PER_GROUP) {
    const groupWords = wordTimings.slice(i, i + WORDS_PER_GROUP);
    if (groupWords.length > 0) {
      wordGroups.push({
        words: groupWords,
        start: groupWords[0].start,
        end: groupWords[groupWords.length - 1].end
      });
    }
  }
  
  // For each group, create clips that highlight each word in sequence
  for (const group of wordGroups) {
    for (let wordIdx = 0; wordIdx < group.words.length; wordIdx++) {
      const currentWord = group.words[wordIdx];
      const nextWord = group.words[wordIdx + 1];
      
      // Build HTML with current word highlighted in yellow
      const htmlWords = group.words.map((w, idx) => {
        if (idx === wordIdx) {
          // Current word - YELLOW with glow
          return `<span style="color: #FFD700; text-shadow: 0 0 15px #FFD700;">${w.text}</span>`;
        } else if (idx < wordIdx) {
          // Already spoken - white
          return `<span style="color: white;">${w.text}</span>`;
        } else {
          // Not yet spoken - slightly dimmed
          return `<span style="color: rgba(255,255,255,0.8);">${w.text}</span>`;
        }
      }).join(' ');
      
      const html = `<div style="font-family: 'Montserrat', sans-serif; font-size: 48px; font-weight: 800; text-align: center; padding: 20px; text-shadow: 2px 2px 6px rgba(0,0,0,0.9);">${htmlWords}</div>`;
      
      // Duration: from this word's start to next word's start (or end of this word)
      const wordStart = currentWord.start;
      const wordEnd = nextWord ? nextWord.start : currentWord.end + 0.2;
      const duration = Math.max(wordEnd - wordStart, 0.15);
      
      subtitleClips.push({
        asset: {
          type: 'html',
          html: html,
          width: 1080,
          height: 180
        },
        start: wordStart,
        length: duration,
        position: 'bottom',
        offset: { y: 0.08 }
      });
    }
  }
  
  // Shotstack timeline
  const timeline = {
    background: '#000000',
    tracks: [
      { clips: subtitleClips }, // Top layer: subtitles
      { clips: videoClips }     // Bottom layer: video
    ]
  };
  
  // Add audio track
  timeline.tracks.push({
    clips: [{
      asset: {
        type: 'audio',
        src: job.audioUrl,
        volume: 1
      },
      start: 0,
      length: audioDuration
    }]
  });
  
  const renderPayload = {
    timeline,
    output: {
      format: 'mp4',
      resolution: 'hd',
      aspectRatio: '9:16',
      fps: 30
    }
  };
  
  // Submit to Shotstack
  const shotstackKey = process.env.SHOTSTACK_API_KEY;
  if (!shotstackKey) {
    throw new Error('SHOTSTACK_API_KEY not configured');
  }
  
  const shotstackEnv = process.env.SHOTSTACK_ENV || 'v1';
  const baseUrl = shotstackEnv === 'stage' 
    ? 'https://api.shotstack.io/stage'
    : 'https://api.shotstack.io/v1';
  
  console.log(`[Job ${job._id}] Submitting to Shotstack...`);
  console.log(`[Job ${job._id}] Video clips: ${videoClips.length}, Subtitle clips: ${subtitleClips.length}`);
  console.log(`[Job ${job._id}] Audio URL: ${job.audioUrl}`);
  console.log(`[Job ${job._id}] First video URL: ${videoClips[0]?.asset?.src}`);
  
  try {
    const renderResponse = await axios.post(
      `${baseUrl}/render`,
      renderPayload,
      {
        headers: {
          'x-api-key': shotstackKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    job.shotstackJobId = renderResponse.data.response.id;
    job.shotstackStatus = 'queued';
    await job.save();
    
    console.log(`[Job ${job._id}] Shotstack render queued: ${job.shotstackJobId}`);
  } catch (submitError) {
    console.error(`[Job ${job._id}] Shotstack submit error:`, submitError.response?.data || submitError.message);
    throw new Error(`Shotstack submit failed: ${submitError.response?.data?.message || submitError.message}`);
  }
  
  // Poll for completion
  await pollShotstackRender(job, baseUrl, shotstackKey);
  
  return job;
}

/**
 * Poll Shotstack until render is done
 */
async function pollShotstackRender(job, baseUrl, shotstackKey) {
  const maxAttempts = 60;
  const pollInterval = 3000;
  
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, pollInterval));
    
    const statusResponse = await axios.get(
      `${baseUrl}/render/${job.shotstackJobId}`,
      {
        headers: { 'x-api-key': shotstackKey }
      }
    );
    
    const responseData = statusResponse.data.response;
    const status = responseData.status;
    job.shotstackStatus = status;
    
    const progress = 70 + Math.min(25, i * 2); // 70% -> 95%
    await updateJobStatus(job, 'rendering', progress, `Rendering... ${status}`);
    
    console.log(`[Job ${job._id}] Shotstack poll ${i}: ${status}`);
    
    if (status === 'done') {
      job.finalVideoUrl = responseData.url;
      job.status = 'done';
      job.progress = 100;
      job.statusMessage = 'Complete!';
      job.completedAt = new Date();
      await job.save();
      console.log(`[Job ${job._id}] DONE: ${job.finalVideoUrl}`);
      return job;
    }
    
    if (status === 'failed') {
      // Get error details from Shotstack
      const errorMsg = responseData.error || 'Unknown render error';
      console.error(`[Job ${job._id}] Shotstack FAILED:`, JSON.stringify(responseData, null, 2));
      throw new Error(`Shotstack render failed: ${errorMsg}`);
    }
  }
  
  throw new Error('Shotstack render timeout');
}

/**
 * Update job status in database
 */
async function updateJobStatus(job, status, progress, message) {
  job.status = status;
  job.progress = progress;
  job.statusMessage = message;
  await job.save();
  console.log(`[Job ${job._id}] ${status}: ${message} (${progress}%)`);
}

/**
 * MAIN: Process a job through all steps
 */
async function processJob(jobId) {
  let job = await VideoJob.findById(jobId);
  if (!job) {
    console.error(`Job ${jobId} not found`);
    return;
  }
  
  try {
    console.log(`\n========== PROCESSING JOB ${jobId} ==========`);
    console.log(`Topic: ${job.topic}`);
    
    // Step 1: Generate script
    job = await generateScript(job);
    
    // Step 2: Find videos
    job = await findVideosForScenes(job);
    
    // Step 3: Generate voiceover
    job = await generateVoiceover(job);
    
    // Step 4: Render
    job = await renderVideo(job);
    
    console.log(`========== JOB ${jobId} COMPLETE ==========\n`);
    return job;
    
  } catch (error) {
    console.error(`[Job ${jobId}] FAILED:`, error.message);
    job.status = 'failed';
    job.error = error.message;
    await job.save();
    throw error;
  }
}

module.exports = {
  processJob,
  generateScript,
  findVideosForScenes,
  generateVoiceover,
  renderVideo
};
