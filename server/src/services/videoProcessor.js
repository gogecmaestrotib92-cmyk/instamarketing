const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

class VideoProcessor {
  constructor() {
    this.tempDir = path.join(__dirname, '../../uploads/temp');
    this.outputDir = path.join(__dirname, '../../uploads/processed');
    
    // Ensure directories exist
    if (!fs.existsSync(this.tempDir)) fs.mkdirSync(this.tempDir, { recursive: true });
    if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir, { recursive: true });
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
  }

  async processVideo({ videoUrl, voiceoverUrl, musicUrl, overlays }) {
    const jobId = uuidv4();
    const videoPath = path.join(this.tempDir, `${jobId}_video.mp4`);
    const voicePath = path.join(this.tempDir, `${jobId}_voice.mp3`);
    const musicPath = musicUrl ? path.join(this.tempDir, `${jobId}_music.mp3`) : null;
    const srtPath = path.join(this.tempDir, `${jobId}.srt`);
    const outputPath = path.join(this.outputDir, `${jobId}_final.mp4`);

    try {
      // 1. Download assets
      console.log('Downloading assets...');
      await this.downloadFile(videoUrl, videoPath);
      if (voiceoverUrl) await this.downloadFile(voiceoverUrl, voicePath);
      if (musicUrl) await this.downloadFile(musicUrl, musicPath);

      // 2. Generate SRT if overlays exist
      if (overlays && overlays.length > 0) {
        this.generateSRT(overlays, srtPath);
      }

      // 3. Build FFmpeg command
      return new Promise((resolve, reject) => {
        let command = ffmpeg(videoPath);
        const inputOptions = [];
        const complexFilter = [];
        let audioInputs = 0;

        // Add voiceover
        if (voiceoverUrl) {
          command.input(voicePath);
          audioInputs++;
        }

        // Add music
        if (musicUrl) {
          command.input(musicPath);
          audioInputs++;
        }

        // Audio mixing logic
        if (audioInputs === 2) {
          // Mix voice (1.0) and music (0.3)
          complexFilter.push(`[1:a]volume=1.0[a1];[2:a]volume=0.3[a2];[a1][a2]amix=inputs=2:duration=first[aout]`);
          command.outputOptions(['-map 0:v', '-map [aout]']);
        } else if (audioInputs === 1) {
          // Just map the single audio track
          command.outputOptions(['-map 0:v', '-map 1:a']);
        } else {
          // No audio added, keep original or silent
          // If original video has no audio, this might need -c:a copy or similar
        }

        // Add subtitles
        if (overlays && overlays.length > 0) {
          // Escape path for FFmpeg (Windows needs special handling sometimes, but forward slashes usually work)
          // Using simple subtitles filter. Note: This requires a build of ffmpeg with libass, which ffmpeg-static usually has.
          // We need to ensure the path is absolute and properly formatted.
          const srtPathFixed = srtPath.replace(/\\/g, '/').replace(':', '\\:');
          // complexFilter.push(`subtitles='${srtPathFixed}'`); 
          // Alternatively use video filter option directly if not mixing with complex filter for audio
          // But since we might have complex filter for audio, we need to chain them or use -vf
          
          // If we have audio mixing, we used -filter_complex. We can add video filtering to it.
          // [0:v]subtitles=...[vout]
          
          if (complexFilter.length > 0) {
             // We already have an audio filter. Let's add video filter to the chain?
             // Actually, it's easier to separate -filter_complex for audio and -vf for video if they don't interact.
             // But fluent-ffmpeg handles .complexFilter() as one big thing.
             
             // Let's try using .videoFilters() for subtitles, it usually appends -vf
             command.videoFilters(`subtitles='${srtPathFixed}'`);
          } else {
             command.videoFilters(`subtitles='${srtPathFixed}'`);
          }
        }

        if (complexFilter.length > 0) {
          command.complexFilter(complexFilter);
        }

        command
          .outputOptions([
            '-c:v libx264', // Re-encode video to burn subtitles
            '-c:a aac',
            '-shortest' // Stop when the shortest input ends (usually video or voice)
          ])
          .save(outputPath)
          .on('start', (cmdLine) => {
            console.log('Spawned Ffmpeg with command: ' + cmdLine);
          })
          .on('error', (err) => {
            console.error('An error occurred: ' + err.message);
            reject(err);
          })
          .on('end', () => {
            console.log('Processing finished successfully');
            // Cleanup temp files
            try {
              if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
              if (fs.existsSync(voicePath)) fs.unlinkSync(voicePath);
              if (musicPath && fs.existsSync(musicPath)) fs.unlinkSync(musicPath);
              if (fs.existsSync(srtPath)) fs.unlinkSync(srtPath);
            } catch (e) {
              console.error('Error cleaning up temp files:', e);
            }
            
            // Return relative path for serving
            const relativePath = `/uploads/processed/${path.basename(outputPath)}`;
            resolve(relativePath);
          });
      });

    } catch (error) {
      console.error('Video processing failed:', error);
      throw error;
    }
  }
}

module.exports = new VideoProcessor();
