const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const util = require('util');
const axios = require('axios');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

const execPromise = util.promisify(exec);

class VideoPipeline {
  constructor() {
    this.tempDir = path.join(__dirname, '../../uploads/temp');
    this.outputDir = path.join(__dirname, '../../uploads/processed');
    
    // Paths to external tools (assumes they are in server/bin folder)
    this.binDir = path.join(__dirname, '../../bin');
    this.rifePath = path.join(this.binDir, 'rife-ncnn-vulkan.exe');
    this.realesrganPath = path.join(this.binDir, 'realesrgan-ncnn-vulkan.exe');

    this.ensureDirs();
  }

  ensureDirs() {
    if (!fs.existsSync(this.tempDir)) fs.mkdirSync(this.tempDir, { recursive: true });
    if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir, { recursive: true });
    if (!fs.existsSync(this.binDir)) fs.mkdirSync(this.binDir, { recursive: true });
  }

  async downloadFile(url, filepath) {
    const writer = fs.createWriteStream(filepath);
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  // Convert time in seconds to SRT timestamp format (00:00:00,000)
  formatTime(seconds) {
    const date = new Date(0);
    date.setMilliseconds(seconds * 1000);
    const timeStr = date.toISOString().substr(11, 12).replace('.', ',');
    return timeStr;
  }

  generateSRT(overlays, srtPath) {
    let srtContent = '';
    overlays.forEach((overlay, index) => {
      const start = this.formatTime(overlay.start);
      const end = this.formatTime(overlay.end);
      srtContent += `${index + 1}\n${start} --> ${end}\n${overlay.text}\n\n`;
    });
    fs.writeFileSync(srtPath, srtContent);
    return srtPath;
  }

  /**
   * Main pipeline runner
   * @param {Object} options
   * @returns {Promise<string>} Output video path
   */
  async runPipeline(options) {
    let {
      inputVideo,
      stabilize = false,
      upscale = false,
      interpolate = false,
      voiceover,
      music,
      subtitles,
      overlays
    } = options;

    console.log('🚀 Starting Video Pipeline...');
    
    // Handle URL input
    if (inputVideo && inputVideo.startsWith('http')) {
        console.log('📥 Downloading input video...');
        const tempInput = path.join(this.tempDir, `input_${Date.now()}.mp4`);
        await this.downloadFile(inputVideo, tempInput);
        inputVideo = tempInput;
    }

    // Handle Voiceover URL
    if (voiceover && voiceover.startsWith('http')) {
        const tempVoice = path.join(this.tempDir, `voice_${Date.now()}.mp3`);
        await this.downloadFile(voiceover, tempVoice);
        voiceover = tempVoice;
    }

    // Handle Music URL
    if (music && music.startsWith('http')) {
        const tempMusic = path.join(this.tempDir, `music_${Date.now()}.mp3`);
        await this.downloadFile(music, tempMusic);
        music = tempMusic;
    }

    let currentPath = inputVideo;

    try {
      // 1. Stabilization
      if (stabilize) {
        console.log('⚖️ Stabilizing video...');
        currentPath = await this.stabilizeVideo(currentPath);
      }

      // 2. Upscaling (Real-ESRGAN)
      if (upscale) {
        console.log('🔍 Upscaling video...');
        currentPath = await this.upscaleVideo(currentPath);
      }

      // 3. Interpolation (RIFE)
      if (interpolate) {
        console.log('🌊 Interpolating frames (RIFE)...');
        currentPath = await this.interpolateFrames(currentPath);
      }

      // 4. Finalize (Audio & Subtitles)
      if (voiceover || music || subtitles || (overlays && overlays.length > 0)) {
        console.log('🎵 Finalizing (Audio/Subs)...');
        currentPath = await this.finalizeVideo(currentPath, {
          voiceover,
          music,
          subtitles,
          overlays
        });
      }

      console.log('✅ Pipeline completed:', currentPath);
      return currentPath;

    } catch (error) {
      console.error('❌ Pipeline failed:', error);
      throw error;
    }
  }

  /**
   * Stabilize video using vidstab
   */
  async stabilizeVideo(inputPath) {
    const outputPath = path.join(this.tempDir, `stabilized_${Date.now()}.mp4`);
    const transformPath = path.join(this.tempDir, `transform_${Date.now()}.trf`);

    // Pass 1: Detect
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters(`vidstabdetect=stepsize=32:shakiness=10:accuracy=15:result=${transformPath}`)
        .format('null')
        .output('-')
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Pass 2: Transform
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters(`vidstabtransform=input=${transformPath}:zoom=0:smoothing=10`)
        .outputOptions('-c:v libx264', '-preset medium', '-crf 23')
        .save(outputPath)
        .on('end', () => {
          if (fs.existsSync(transformPath)) fs.unlinkSync(transformPath);
          resolve(outputPath);
        })
        .on('error', reject);
    });
  }

  /**
   * Upscale using Real-ESRGAN (Frame extraction method)
   */
  async upscaleVideo(inputPath) {
    const framesDir = path.join(this.tempDir, `frames_in_${Date.now()}`);
    const outFramesDir = path.join(this.tempDir, `frames_out_${Date.now()}`);
    const outputPath = path.join(this.outputDir, `upscaled_${Date.now()}.mp4`);

    fs.mkdirSync(framesDir);
    fs.mkdirSync(outFramesDir);

    try {
      // 1. Extract frames
      await this.extractFrames(inputPath, framesDir);

      // 2. Run Real-ESRGAN
      // Use configured path or fallback to system path
      const toolCmd = fs.existsSync(this.realesrganPath) ? `"${this.realesrganPath}"` : 'realesrgan-ncnn-vulkan';
      const cmd = `${toolCmd} -i "${framesDir}" -o "${outFramesDir}" -n realesrgan-x4plus`;
      await execPromise(cmd);

      // 3. Reassemble
      await this.reassembleFrames(outFramesDir, outputPath, 30); // Default 30fps, should detect from input

      return outputPath;
    } finally {
      // Cleanup
      fs.rmSync(framesDir, { recursive: true, force: true });
      fs.rmSync(outFramesDir, { recursive: true, force: true });
    }
  }

  /**
   * Interpolate using RIFE (Frame extraction method)
   */
  async interpolateFrames(inputPath) {
    const framesDir = path.join(this.tempDir, `rife_in_${Date.now()}`);
    const outFramesDir = path.join(this.tempDir, `rife_out_${Date.now()}`);
    const outputPath = path.join(this.outputDir, `interpolated_${Date.now()}.mp4`);

    fs.mkdirSync(framesDir);
    fs.mkdirSync(outFramesDir);

    try {
      // 1. Extract frames
      await this.extractFrames(inputPath, framesDir);

      // 2. Run RIFE
      // Use configured path or fallback to system path
      const toolCmd = fs.existsSync(this.rifePath) ? `"${this.rifePath}"` : 'rife-ncnn-vulkan';
      const cmd = `${toolCmd} -i "${framesDir}" -o "${outFramesDir}"`;
      await execPromise(cmd);

      // 3. Reassemble (RIFE doubles FPS usually)
      await this.reassembleFrames(outFramesDir, outputPath, 60); 

      return outputPath;
    } finally {
      fs.rmSync(framesDir, { recursive: true, force: true });
      fs.rmSync(outFramesDir, { recursive: true, force: true });
    }
  }

  /**
   * Finalize: Mix audio, burn subtitles
   */
  async finalizeVideo(inputPath, options) {
    const { voiceover, music, subtitles, overlays } = options;
    const outputPath = path.join(this.outputDir, `final_${Date.now()}.mp4`);
    
    let command = ffmpeg(inputPath);
    const inputs = [];
    let complexFilter = [];
    let audioMix = [];

    // Add Voiceover
    if (voiceover) {
      command.input(voiceover);
      inputs.push('voice');
      // Volume adjustment could go here
    }

    // Add Music
    if (music) {
      command.input(music);
      inputs.push('music');
    }

    // Audio Mixing Logic
    if (inputs.length > 0) {
      // Simple mix: [0:a][1:a]amix=inputs=2[a]
      // Or more complex with volume: [1:a]volume=0.3[m];[0:a][m]amix...
      
      if (voiceover && music) {
        complexFilter.push(`[1:a]volume=1.0[v]`); // Voice
        complexFilter.push(`[2:a]volume=0.2[m]`); // Music (assuming video is 0)
        complexFilter.push(`[v][m]amix=inputs=2:duration=longest[a]`);
        command.outputOptions('-map 0:v', '-map [a]');
      } else if (voiceover) {
        command.outputOptions('-map 0:v', '-map 1:a');
      } else if (music) {
        command.outputOptions('-map 0:v', '-map 1:a');
      }
    } else {
      command.outputOptions('-c:a copy');
    }

    // Subtitles
    if (subtitles) {
      // Assuming subtitles is a path to .srt file
      // If it's text content, we need to write it to a file first
      let srtPath = subtitles;
      if (!fs.existsSync(subtitles) && typeof subtitles === 'string') {
         // Logic to create SRT file from text/array would go here
         // For now assume it's a path
      }
      
      // Windows path escaping for FFmpeg filter
      const escapedPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
      complexFilter.push(`subtitles='${escapedPath}':force_style='FontName=Arial,FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=1,Shadow=0,MarginV=20'`);
    }

    if (complexFilter.length > 0) {
      command.complexFilter(complexFilter);
    }

    return new Promise((resolve, reject) => {
      command
        .outputOptions('-c:v libx264', '-preset fast', '-crf 23', '-c:a aac', '-b:a 192k')
        .save(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject);
    });
  }

  // Helpers
  extractFrames(videoPath, outDir) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(path.join(outDir, 'frame_%08d.png'))
        .outputOptions('-start_number 0')
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  reassembleFrames(framesDir, outPath, fps) {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(path.join(framesDir, 'frame_%08d.png'))
        .inputOptions(`-framerate ${fps}`)
        .output(outPath)
        .outputOptions('-c:v libx264', '-pix_fmt yuv420p', '-crf 23')
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }
}

module.exports = new VideoPipeline();
