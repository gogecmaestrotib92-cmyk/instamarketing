require('dotenv').config();
const Replicate = require('replicate');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function testReplicate() {
  try {
    console.log('Testing Replicate API Token...');
    // Try to get the model info to verify token and model existence
    const model = await replicate.models.get('minimax', 'video-01');
    console.log('Model found:', model.owner, model.name);
    
    console.log('Token seems valid.');
    
    // Optional: Try a very simple prediction if needed, but just checking access first.
    // const prediction = await replicate.predictions.create({
    //     version: "5aa835260ff7f40f4069c41185f72036accf99e29957bb4a3b3a911f3b6c1912",
    //     input: { prompt: "test" }
    // });
    // console.log('Prediction created:', prediction.id);

  } catch (error) {
    console.error('Error testing Replicate:', error.message);
    if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Body:', await error.response.text());
    }
  }
}

testReplicate();
