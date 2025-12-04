/**
 * UPLOAD CURATED VIDEOS TO CLOUDINARY
 * ====================================
 * This script uses Pexels API to get video files and uploads them to Cloudinary
 * so they can be accessed by Shotstack (which can't access Pexels directly).
 * 
 * Run: node scripts/upload-curated-videos.js
 */

require('dotenv').config();
const fetch = require('node-fetch');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '9kV0qJ9k1b1Ou9BTGXFDPyFrqjU4oqGsuJ0tbzor5r2O942zz6WMyIyl';

// Pexels video IDs from curatedVideos.js
const PEXELS_VIDEO_IDS = [
  '4761523',
  '4761433',
  '5319340',
  '4761440',
  '4761486',
  '4761578',
  '4761570',
  '4761793',
  '4761718',
  '4761753',
  '4761735',
  '4761617',
  '4761609',
  '4761637',
  '4761626',
  '5319493',
  '4156933',
];

async function getVideoFromPexelsAPI(videoId) {
  console.log(`\n📹 Fetching video ${videoId} from Pexels API...`);
  
  try {
    const response = await fetch(`https://api.pexels.com/videos/videos/${videoId}`, {
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    });
    
    if (!response.ok) {
      console.log(`   ❌ API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Find HD vertical video file
    const videoFile = data.video_files.find(f => 
      f.quality === 'hd' && f.height > f.width
    ) || data.video_files.find(f => 
      f.quality === 'hd'
    ) || data.video_files[0];
    
    if (!videoFile) {
      console.log(`   ❌ No suitable video file found`);
      return null;
    }
    
    console.log(`   ✅ Found: ${videoFile.width}x${videoFile.height} ${videoFile.quality}`);
    return {
      id: videoId,
      downloadUrl: videoFile.link,
      width: videoFile.width,
      height: videoFile.height,
      quality: videoFile.quality
    };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function downloadAndUpload(videoInfo) {
  console.log(`   📥 Downloading from API link...`);
  
  try {
    // Download using the API-provided link (should work without extra headers)
    const response = await fetch(videoInfo.downloadUrl);
    
    if (!response.ok) {
      console.log(`   ❌ Download failed: ${response.status}`);
      return null;
    }
    
    const buffer = await response.buffer();
    console.log(`   📦 Downloaded: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    // Upload to Cloudinary
    console.log(`   📤 Uploading to Cloudinary...`);
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'instamarketing/curated-videos',
          resource_type: 'video',
          public_id: `pexels-${videoInfo.id}`,
          overwrite: true
        },
        (error, result) => {
          if (error) {
            console.log(`   ❌ Upload failed: ${error.message}`);
            resolve(null);
          } else {
            console.log(`   ✅ Uploaded: ${result.secure_url}`);
            resolve({
              pexelsId: videoInfo.id,
              cloudinaryUrl: result.secure_url,
              originalUrl: videoInfo.downloadUrl
            });
          }
        }
      );
      
      uploadStream.end(buffer);
    });
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🎬 CURATED VIDEO UPLOADER (via Pexels API)');
  console.log('==========================================\n');
  console.log(`Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`Pexels API Key: ${PEXELS_API_KEY ? 'Present' : 'Missing'}`);
  console.log(`Videos to upload: ${PEXELS_VIDEO_IDS.length}\n`);
  
  const results = [];
  
  for (const videoId of PEXELS_VIDEO_IDS) {
    // Get video info from Pexels API
    const videoInfo = await getVideoFromPexelsAPI(videoId);
    
    if (videoInfo) {
      // Download and upload
      const result = await downloadAndUpload(videoInfo);
      if (result) {
        results.push(result);
      }
    }
    
    // Small delay between API calls
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n\n📊 RESULTS');
  console.log('==========');
  console.log(`Uploaded: ${results.length}/${PEXELS_VIDEO_IDS.length}`);
  
  console.log('\n\n📝 URL MAPPING (copy this to update curatedVideos.js):');
  console.log('const CLOUDINARY_URLS = {');
  results.forEach(r => {
    console.log(`  '${r.pexelsId}': '${r.cloudinaryUrl}',`);
  });
  console.log('};');
}

main().catch(console.error);
