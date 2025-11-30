/**
 * Test script to check Shotstack render status
 * 
 * Usage: node test-shotstack-render.js <job-id>
 * Example: node test-shotstack-render.js 722a5bee-e5dc-4968-bfd0-6516250a1707
 */

require('dotenv').config();

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY || 'dJmabLRWzY6RK4RnAAXQoIec84p8Uv9i1Cyo0qDE';
const SHOTSTACK_HOST = process.env.SHOTSTACK_HOST || 'https://api.shotstack.io/stage';

async function checkRenderStatus(jobId) {
  console.log(`\n🔍 Checking render status for: ${jobId}\n`);
  
  try {
    const response = await fetch(`${SHOTSTACK_HOST}/render/${jobId}?data=true`, {
      method: 'GET',
      headers: {
        'x-api-key': SHOTSTACK_API_KEY
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', data);
      return;
    }

    const r = data.response;
    
    console.log('='.repeat(60));
    console.log('📊 RENDER STATUS REPORT');
    console.log('='.repeat(60));
    console.log(`ID:          ${r.id}`);
    console.log(`Status:      ${r.status}`);
    console.log(`Duration:    ${r.duration}s`);
    console.log(`Render Time: ${r.renderTime}ms`);
    console.log(`Created:     ${r.created}`);
    console.log(`Updated:     ${r.updated}`);
    
    if (r.status === 'done') {
      console.log(`\n✅ OUTPUT URL: ${r.url}\n`);
    }
    
    if (r.error) {
      console.log(`\n❌ ERROR: ${r.error}\n`);
    }
    
    // Show timeline details
    if (r.data?.timeline) {
      const timeline = r.data.timeline;
      console.log('\n📹 TIMELINE DETAILS:');
      console.log('-'.repeat(40));
      console.log(`Background: ${timeline.background}`);
      console.log(`Tracks: ${timeline.tracks?.length || 0}`);
      
      if (timeline.tracks) {
        timeline.tracks.forEach((track, i) => {
          console.log(`\n  Track ${i + 1}:`);
          track.clips?.forEach((clip, j) => {
            console.log(`    Clip ${j + 1}:`);
            console.log(`      Type: ${clip.asset?.type}`);
            console.log(`      Start: ${clip.start}s`);
            console.log(`      Length: ${clip.length}s`);
            
            if (clip.asset?.type === 'text') {
              console.log(`      Text: "${clip.asset.text}"`);
              console.log(`      Font: ${clip.asset.font?.family} ${clip.asset.font?.size}px`);
              console.log(`      Width: ${clip.asset.width}, Height: ${clip.asset.height}`);
              console.log(`      Position: ${clip.position}`);
              console.log(`      Offset: x=${clip.offset?.x}, y=${clip.offset?.y}`);
            }
            
            if (clip.asset?.type === 'video') {
              console.log(`      Source: ${clip.asset.src?.substring(0, 50)}...`);
              console.log(`      Fit: ${clip.fit}`);
            }
          });
        });
      }
      
      if (timeline.soundtrack) {
        console.log('\n  🎵 Soundtrack:');
        console.log(`    Source: ${timeline.soundtrack.src?.substring(0, 50) || 'none'}...`);
        console.log(`    Volume: ${timeline.soundtrack.volume}`);
      }
    }
    
    // Full raw response for debugging
    console.log('\n📄 FULL RAW RESPONSE:');
    console.log('-'.repeat(40));
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Get job ID from command line
const jobId = process.argv[2];

if (!jobId) {
  console.log('Usage: node test-shotstack-render.js <job-id>');
  console.log('Example: node test-shotstack-render.js 722a5bee-e5dc-4968-bfd0-6516250a1707');
  process.exit(1);
}

checkRenderStatus(jobId);
