const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Video Composer Service
 * Combines video, audio (voiceover), and text overlays
 */
class VideoComposerService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    this.outputDir = path.join(__dirname, '../../public/videos');
    
    // Ensure directories exist
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Download file from URL to temp directory
   * Handles both remote URLs and local paths
   */
  async downloadFile(urlOrPath, filename) {
    const filePath = path.join(this.tempDir, filename);
    
    // Check if it's a remote URL
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      const response = await axios({
        method: 'GET',
        url: urlOrPath,
        responseType: 'stream'
      });
      
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
      });
    } else {
      // Handle local file path
      console.log(`📂 Processing local file: ${urlOrPath}`);
      
      // Remove leading slash if present
      const cleanPath = urlOrPath.startsWith('/') ? urlOrPath.substring(1) : urlOrPath;
      
      // Resolve absolute path (assuming relative to server root)
      const serverRoot = path.join(__dirname, '../../');
      const sourcePath = path.join(serverRoot, cleanPath);
      
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Local file not found: ${sourcePath}`);
      }
      
      // Copy to temp dir
      fs.copyFileSync(sourcePath, filePath);
      return filePath;
    }
  }

  /**
   * Add audio to video
   */
  async addAudioToVideo(videoPath, audioPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .outputOptions([
          '-c:v copy',           // Copy video codec
          '-c:a aac',            // AAC audio
          '-shortest',           // Match shortest stream
          '-map 0:v:0',          // Video from first input
          '-map 1:a:0'           // Audio from second input
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .run();
    });
  }

  /**
   * Add text overlay to video
   */
  async addTextOverlay(videoPath, text, options = {}) {
    const {
      position = 'center',      // top, center, bottom
      fontSize = 48,
      fontColor = 'white',
      backgroundColor = 'black@0.5',
      padding = 20
    } = options;

    const outputPath = path.join(this.outputDir, `text_${uuidv4()}.mp4`);
    
    // Calculate Y position
    let yPos = '(h-text_h)/2';  // center
    if (position === 'top') yPos = `${padding}`;
    if (position === 'bottom') yPos = `h-text_h-${padding}`;

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .videoFilters([
          {
            filter: 'drawtext',
            options: {
              text: text,
              fontsize: fontSize,
              fontcolor: fontColor,
              x: '(w-text_w)/2',
              y: yPos,
              box: 1,
              boxcolor: backgroundColor,
              boxborderw: 10
            }
          }
        ])
        .outputOptions(['-c:a copy'])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .run();
    });
  }

  /**
   * Full video composition: video + audio + text
   */
  async composeVideo(options) {
    const {
      videoUrl,
      audioUrl,
      text,
      textPosition = 'bottom',
      fontSize = 36
    } = options;

    try {
      const jobId = uuidv4();
      console.log(`🎬 Starting video composition job: ${jobId}`);

      // Step 1: Download video
      console.log('📥 Downloading video...');
      const videoPath = await this.downloadFile(videoUrl, `video_${jobId}.mp4`);

      let currentPath = videoPath;

      // Step 2: Add audio if provided
      if (audioUrl) {
        console.log('🎵 Adding audio...');
        const audioPath = await this.downloadFile(audioUrl, `audio_${jobId}.mp3`);
        const withAudioPath = path.join(this.tempDir, `with_audio_${jobId}.mp4`);
        currentPath = await this.addAudioToVideo(videoPath, audioPath, withAudioPath);
        
        // Clean up audio file
        fs.unlinkSync(audioPath);
      }

      // Step 3: Add text overlay if provided
      if (text) {
        console.log('📝 Adding text overlay...');
        const finalPath = await this.addTextOverlay(currentPath, text, {
          position: textPosition,
          fontSize: fontSize
        });
        
        // Clean up intermediate file
        if (currentPath !== videoPath) {
          fs.unlinkSync(currentPath);
        }
        currentPath = finalPath;
      }

      // Move final video to output
      const outputFilename = `composed_${jobId}.mp4`;
      const finalOutputPath = path.join(this.outputDir, outputFilename);
      
      if (currentPath !== finalOutputPath) {
        fs.renameSync(currentPath, finalOutputPath);
      }

      // Clean up original video
      if (fs.existsSync(videoPath) && videoPath !== finalOutputPath) {
        fs.unlinkSync(videoPath);
      }

      console.log('✅ Video composition complete!');

      return {
        success: true,
        videoPath: finalOutputPath,
        videoUrl: `/videos/${outputFilename}`,
        filename: outputFilename
      };

    } catch (error) {
      console.error('Video composition error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create video with multiple text segments (captions)
   */
  async addCaptions(videoPath, captions) {
    // captions = [{ text: 'Hello', start: 0, end: 2 }, ...]
    const outputPath = path.join(this.outputDir, `captioned_${uuidv4()}.mp4`);
    
    // Build drawtext filter for each caption
    const filters = captions.map((caption, i) => ({
      filter: 'drawtext',
      options: {
        text: caption.text,
        fontsize: 32,
        fontcolor: 'white',
        x: '(w-text_w)/2',
        y: 'h-text_h-50',
        box: 1,
        boxcolor: 'black@0.6',
        boxborderw: 8,
        enable: `between(t,${caption.start},${caption.end})`
      }
    }));

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .videoFilters(filters)
        .outputOptions(['-c:a copy'])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .run();
    });
  }

  /**
   * Loop video to match audio duration
   */
  async loopVideoToAudioLength(videoPath, audioPath, outputPath) {
    return new Promise((resolve, reject) => {
      // First get audio duration
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) return reject(err);
        
        const audioDuration = metadata.format.duration;
        
        ffmpeg()
          .input(videoPath)
          .inputOptions(['-stream_loop -1'])  // Loop video infinitely
          .input(audioPath)
          .outputOptions([
            `-t ${audioDuration}`,  // Limit to audio duration
            '-c:v libx264',
            '-c:a aac',
            '-shortest'
          ])
          .output(outputPath)
          .on('end', () => resolve(outputPath))
          .on('error', (err) => reject(err))
          .run();
      });
    });
  }

  /**
   * Clean up temp files
   */
  cleanupTempFiles() {
    const files = fs.readdirSync(this.tempDir);
    files.forEach(file => {
      const filePath = path.join(this.tempDir, file);
      const stats = fs.statSync(filePath);
      // Delete files older than 1 hour
      if (Date.now() - stats.mtime.getTime() > 3600000) {
        fs.unlinkSync(filePath);
      }
    });
  }
}

module.exports = new VideoComposerService();
