/**
 * Test script to debug HTML text rendering with Shotstack
 * Run with: node test-html-render.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY;
const SHOTSTACK_HOST = 'https://api.shotstack.io/stage';

// Simple test video URL (a public test video)
const TEST_VIDEO_URL = 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/beach-overhead.mp4';

async function testRender() {
  console.log('🧪 Testing HTML text overlay rendering...\n');

  // Minimal timeline with just video and HTML text
  const payload = {
    timeline: {
      background: '#000000',
      tracks: [
        // Track 1 (TOP - text layer)
        {
          clips: [
            {
              asset: {
                type: 'html',
                html: '<p style="font-family: Arial, sans-serif; font-size: 60px; font-weight: bold; color: #ffffff; text-shadow: 3px 3px 6px #000000; text-align: center; padding: 30px; background: rgba(0,0,0,0.7); border-radius: 15px;">TEST TEXT OVERLAY</p>',
                width: 800,
                height: 150,
                background: 'transparent'
              },
              start: 0,
              length: 5,
              position: 'center',
              offset: { x: 0, y: 0 }
            }
          ]
        },
        // Track 2 (BOTTOM - video layer)
        {
          clips: [
            {
              asset: {
                type: 'video',
                src: TEST_VIDEO_URL,
                volume: 0
              },
              start: 0,
              length: 5,
              fit: 'cover',
              position: 'center'
            }
          ]
        }
      ]
    },
    output: {
      format: 'mp4',
      fps: 30,
      size: {
        width: 1080,
        height: 1920
      }
    }
  };

  console.log('📋 Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n');

  try {
    // Submit render
    console.log('📤 Submitting render...');
    const renderResponse = await fetch(`${SHOTSTACK_HOST}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SHOTSTACK_API_KEY
      },
      body: JSON.stringify(payload)
    });

    const renderData = await renderResponse.json();
    
    if (!renderResponse.ok) {
      console.error('❌ Render failed:', JSON.stringify(renderData, null, 2));
      return;
    }

    const jobId = renderData.response?.id;
    console.log('✅ Render submitted! Job ID:', jobId);

    // Poll for status
    console.log('\n⏳ Waiting for render to complete...');
    let status = 'queued';
    let attempts = 0;
    const maxAttempts = 60;

    while (status !== 'done' && status !== 'failed' && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 3000));
      attempts++;

      const statusResponse = await fetch(`${SHOTSTACK_HOST}/render/${jobId}`, {
        headers: { 'x-api-key': SHOTSTACK_API_KEY }
      });
      const statusData = await statusResponse.json();
      status = statusData.response?.status;
      
      console.log(`   [${attempts}] Status: ${status}`);

      if (status === 'done') {
        console.log('\n🎉 RENDER COMPLETE!');
        console.log('📹 Video URL:', statusData.response?.url);
        console.log('\nOpen this URL to check if text is visible!');
      } else if (status === 'failed') {
        console.log('\n❌ RENDER FAILED!');
        console.log('Error:', statusData.response?.error);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRender();
