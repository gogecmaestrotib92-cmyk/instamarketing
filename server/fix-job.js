const mongoose = require('mongoose');
require('dotenv').config();

async function fixJob() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Clear the expired pending prediction for the stuck job
  const result = await mongoose.connection.db.collection('premiumjobs').updateOne(
    { jobId: 'premium-1765073549674-ye5hep62f' },
    { 
      $set: { 
        pendingPrediction: null, 
        klingCheckCount: 0,
        currentSceneIndex: 3  // Skip scene 3 since output expired
      } 
    }
  );
  console.log('Updated:', result.modifiedCount);
  
  // Check the job now
  const job = await mongoose.connection.db.collection('premiumjobs').findOne({ jobId: 'premium-1765073549674-ye5hep62f' });
  console.log('Job status:', job.status, '| Step:', job.currentStep, '| SceneIndex:', job.currentSceneIndex);
  console.log('Animated scenes:', job.animatedScenes?.length || 0);
  
  process.exit(0);
}
fixJob();
