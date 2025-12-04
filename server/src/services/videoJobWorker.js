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
    { id: '4761433', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1749687697/pexels-4761433_m6gdne.mp4', keywords: ['abs', 'floor', 'core', 'workout', 'exercise'], duration: 15 },
    { id: '5319340', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1749687702/pexels-5319340_m93sj9.mp4', keywords: ['training', 'core', 'gym', 'fitness'], duration: 10 },
    { id: '4761486', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1749687706/pexels-4761486_w10bam.mp4', keywords: ['plank', 'side', 'stability', 'balance'], duration: 12 },
    { id: '4761718', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1749687715/pexels-4761718_vj2g1b.mp4', keywords: ['dumbbell', 'weights', 'strength', 'arms'], duration: 12 },
    { id: '4761735', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1749687722/pexels-4761735_qghyrj.mp4', keywords: ['shoulder', 'press', 'overhead', 'strength'], duration: 10 }
  ],
  // TODO: Add more categories
  business: [],
  lifestyle: [],
  technology: [],
  food: [],
  travel: []
};

/**
 * Find the best matching video for a scene
 */
function findVideoForScene(sceneVisual, category = 'fitness') {
  const videos = CURATED_VIDEOS[category] || CURATED_VIDEOS.fitness;
  if (videos.length === 0) {
    return CURATED_VIDEOS.fitness[0]; // Fallback
  }
  
  const visualLower = sceneVisual.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;
  
  for (const video of videos) {
    let score = 0;
    for (const keyword of video.keywords) {
      if (visualLower.includes(keyword)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = video;
    }
  }
  
  // If no match, return random
  return bestMatch || videos[Math.floor(Math.random() * videos.length)];
}

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
        "visual": "Brief description of what video to show",
        "duration": 5
      }
    ],
    "cta": "Call to action (2-3 seconds)"
  }
  
  Rules:
  - Keep total duration close to ${job.targetDuration} seconds
  - Each scene should be 3-7 seconds
  - Make it punchy and engaging for social media
  - Visual descriptions should be simple: "person working out", "typing on laptop", etc.`;
  
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
    
    // Add hook as first scene
    scenes.push({
      order: order++,
      text: content.hook,
      duration: 3,
      visual: 'attention grabbing intro'
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
      visual: 'call to action'
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
 * STEP 2: Find videos for each scene
 */
async function findVideosForScenes(job) {
  await updateJobStatus(job, 'finding_videos', 30, 'Finding matching video clips...');
  
  // Determine category from topic
  const topicLower = job.topic.toLowerCase();
  let category = 'fitness';
  if (topicLower.includes('business') || topicLower.includes('money') || topicLower.includes('entrepreneur')) {
    category = 'business';
  } else if (topicLower.includes('food') || topicLower.includes('cooking') || topicLower.includes('recipe')) {
    category = 'food';
  } else if (topicLower.includes('tech') || topicLower.includes('ai') || topicLower.includes('code')) {
    category = 'technology';
  }
  
  // Assign videos to scenes
  for (let i = 0; i < job.scenes.length; i++) {
    const scene = job.scenes[i];
    const video = findVideoForScene(scene.visual, category);
    job.scenes[i].videoUrl = video.url;
    console.log(`[Job ${job._id}] Scene ${i}: "${scene.visual}" -> ${video.url}`);
  }
  
  await job.save();
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
  
  // Create subtitle clips
  for (const phrase of phrases) {
    subtitleClips.push({
      asset: {
        type: 'html',
        html: `<div style="font-family: 'Montserrat', sans-serif; font-size: 48px; font-weight: 800; color: white; text-shadow: 3px 3px 6px rgba(0,0,0,0.8); text-align: center; padding: 20px;">${phrase.text}</div>`,
        width: 1080,
        height: 200
      },
      start: phrase.start,
      length: phrase.end - phrase.start + 0.1,
      position: 'bottom',
      offset: { y: 0.15 }
    });
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
