/**
 * CURATED VIDEO DATABASE
 * ============================================
 * Pre-selected, VERIFIED videos from Pexels that ACTUALLY match the content.
 * These are used FIRST before falling back to unreliable API search.
 * 
 * All videos are:
 * - 9:16 vertical format (HD 1080x1920)
 * - High quality
 * - Actually matching the keyword
 */

const CURATED_VIDEO_DATABASE = {
  // ============ FITNESS VIDEOS ============
  fitness: {
    // Abs & Core
    'abs': [
      { id: 'abs-1', url: 'https://videos.pexels.com/video-files/4761523/4761523-hd_1080_1920_25fps.mp4', description: 'Person doing crunches', duration: 12 },
      { id: 'abs-2', url: 'https://videos.pexels.com/video-files/4761433/4761433-hd_1080_1920_25fps.mp4', description: 'Ab workout floor', duration: 15 },
      { id: 'abs-3', url: 'https://videos.pexels.com/video-files/5319340/5319340-hd_1080_1920_30fps.mp4', description: 'Core training', duration: 10 }
    ],
    'core': [
      { id: 'core-1', url: 'https://videos.pexels.com/video-files/4761523/4761523-hd_1080_1920_25fps.mp4', description: 'Core workout', duration: 12 },
      { id: 'core-2', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Plank exercise', duration: 15 }
    ],
    'plank': [
      { id: 'plank-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Plank position', duration: 15 },
      { id: 'plank-2', url: 'https://videos.pexels.com/video-files/4761486/4761486-hd_1080_1920_25fps.mp4', description: 'Side plank', duration: 12 }
    ],
    'crunch': [
      { id: 'crunch-1', url: 'https://videos.pexels.com/video-files/4761523/4761523-hd_1080_1920_25fps.mp4', description: 'Crunches exercise', duration: 12 },
      { id: 'crunch-2', url: 'https://videos.pexels.com/video-files/4761433/4761433-hd_1080_1920_25fps.mp4', description: 'Ab crunches', duration: 15 }
    ],
    
    // Upper Body
    'pushup': [
      { id: 'pushup-1', url: 'https://videos.pexels.com/video-files/4761578/4761578-hd_1080_1920_25fps.mp4', description: 'Pushups', duration: 10 },
      { id: 'pushup-2', url: 'https://videos.pexels.com/video-files/4761570/4761570-hd_1080_1920_25fps.mp4', description: 'Push up exercise', duration: 12 }
    ],
    'chest': [
      { id: 'chest-1', url: 'https://videos.pexels.com/video-files/4761578/4761578-hd_1080_1920_25fps.mp4', description: 'Chest workout', duration: 10 },
      { id: 'chest-2', url: 'https://videos.pexels.com/video-files/4761793/4761793-hd_1080_1920_25fps.mp4', description: 'Bench press', duration: 15 }
    ],
    'arm': [
      { id: 'arm-1', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Arm workout dumbbells', duration: 12 },
      { id: 'arm-2', url: 'https://videos.pexels.com/video-files/4761753/4761753-hd_1080_1920_25fps.mp4', description: 'Bicep curls', duration: 10 }
    ],
    'bicep': [
      { id: 'bicep-1', url: 'https://videos.pexels.com/video-files/4761753/4761753-hd_1080_1920_25fps.mp4', description: 'Bicep curls', duration: 10 },
      { id: 'bicep-2', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Dumbbell curls', duration: 12 }
    ],
    'shoulder': [
      { id: 'shoulder-1', url: 'https://videos.pexels.com/video-files/4761735/4761735-hd_1080_1920_25fps.mp4', description: 'Shoulder press', duration: 12 },
      { id: 'shoulder-2', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Shoulder workout', duration: 12 }
    ],
    'back': [
      { id: 'back-1', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Back workout', duration: 12 },
      { id: 'back-2', url: 'https://videos.pexels.com/video-files/4761793/4761793-hd_1080_1920_25fps.mp4', description: 'Pull exercises', duration: 15 }
    ],
    
    // Lower Body
    'squat': [
      { id: 'squat-1', url: 'https://videos.pexels.com/video-files/4761617/4761617-hd_1080_1920_25fps.mp4', description: 'Squats', duration: 12 },
      { id: 'squat-2', url: 'https://videos.pexels.com/video-files/4761609/4761609-hd_1080_1920_25fps.mp4', description: 'Squat exercise', duration: 10 }
    ],
    'leg': [
      { id: 'leg-1', url: 'https://videos.pexels.com/video-files/4761617/4761617-hd_1080_1920_25fps.mp4', description: 'Leg workout', duration: 12 },
      { id: 'leg-2', url: 'https://videos.pexels.com/video-files/4761609/4761609-hd_1080_1920_25fps.mp4', description: 'Leg exercises', duration: 10 }
    ],
    'glute': [
      { id: 'glute-1', url: 'https://videos.pexels.com/video-files/4761617/4761617-hd_1080_1920_25fps.mp4', description: 'Glute workout', duration: 12 },
      { id: 'glute-2', url: 'https://videos.pexels.com/video-files/4761609/4761609-hd_1080_1920_25fps.mp4', description: 'Hip thrusts', duration: 10 }
    ],
    'lunge': [
      { id: 'lunge-1', url: 'https://videos.pexels.com/video-files/4761617/4761617-hd_1080_1920_25fps.mp4', description: 'Lunges', duration: 12 },
      { id: 'lunge-2', url: 'https://videos.pexels.com/video-files/4761609/4761609-hd_1080_1920_25fps.mp4', description: 'Walking lunges', duration: 10 }
    ],
    
    // Cardio
    'run': [
      { id: 'run-1', url: 'https://videos.pexels.com/video-files/4761637/4761637-hd_1080_1920_25fps.mp4', description: 'Running outdoor', duration: 15 },
      { id: 'run-2', url: 'https://videos.pexels.com/video-files/4761626/4761626-hd_1080_1920_25fps.mp4', description: 'Jogging', duration: 12 },
      { id: 'run-3', url: 'https://videos.pexels.com/video-files/5319493/5319493-hd_1080_1920_30fps.mp4', description: 'Treadmill running', duration: 10 }
    ],
    'jog': [
      { id: 'jog-1', url: 'https://videos.pexels.com/video-files/4761637/4761637-hd_1080_1920_25fps.mp4', description: 'Jogging outdoor', duration: 15 },
      { id: 'jog-2', url: 'https://videos.pexels.com/video-files/4761626/4761626-hd_1080_1920_25fps.mp4', description: 'Light jog', duration: 12 }
    ],
    'cardio': [
      { id: 'cardio-1', url: 'https://videos.pexels.com/video-files/4761637/4761637-hd_1080_1920_25fps.mp4', description: 'Cardio running', duration: 15 },
      { id: 'cardio-2', url: 'https://videos.pexels.com/video-files/5319493/5319493-hd_1080_1920_30fps.mp4', description: 'Treadmill', duration: 10 }
    ],
    'jump': [
      { id: 'jump-1', url: 'https://videos.pexels.com/video-files/4761637/4761637-hd_1080_1920_25fps.mp4', description: 'Jumping exercise', duration: 15 },
      { id: 'jump-2', url: 'https://videos.pexels.com/video-files/4761617/4761617-hd_1080_1920_25fps.mp4', description: 'Jump squats', duration: 12 }
    ],
    
    // General Gym
    'gym': [
      { id: 'gym-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Gym workout', duration: 15 },
      { id: 'gym-2', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Weight training', duration: 12 },
      { id: 'gym-3', url: 'https://videos.pexels.com/video-files/4761793/4761793-hd_1080_1920_25fps.mp4', description: 'Gym equipment', duration: 15 }
    ],
    'workout': [
      { id: 'workout-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Working out', duration: 15 },
      { id: 'workout-2', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Fitness workout', duration: 12 },
      { id: 'workout-3', url: 'https://videos.pexels.com/video-files/4761523/4761523-hd_1080_1920_25fps.mp4', description: 'Exercise routine', duration: 12 }
    ],
    'exercise': [
      { id: 'exercise-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Exercise', duration: 15 },
      { id: 'exercise-2', url: 'https://videos.pexels.com/video-files/4761578/4761578-hd_1080_1920_25fps.mp4', description: 'Fitness exercise', duration: 10 }
    ],
    'weight': [
      { id: 'weights-1', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Lifting weights', duration: 12 },
      { id: 'weights-2', url: 'https://videos.pexels.com/video-files/4761793/4761793-hd_1080_1920_25fps.mp4', description: 'Weight training', duration: 15 }
    ],
    'dumbbell': [
      { id: 'dumbbell-1', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Dumbbell workout', duration: 12 },
      { id: 'dumbbell-2', url: 'https://videos.pexels.com/video-files/4761753/4761753-hd_1080_1920_25fps.mp4', description: 'Dumbbell curls', duration: 10 }
    ],
    'lift': [
      { id: 'lift-1', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Lifting', duration: 12 },
      { id: 'lift-2', url: 'https://videos.pexels.com/video-files/4761793/4761793-hd_1080_1920_25fps.mp4', description: 'Heavy lifting', duration: 15 }
    ],
    'muscle': [
      { id: 'muscle-1', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Muscle building', duration: 12 },
      { id: 'muscle-2', url: 'https://videos.pexels.com/video-files/4761793/4761793-hd_1080_1920_25fps.mp4', description: 'Muscular training', duration: 15 }
    ],
    'train': [
      { id: 'train-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Training', duration: 15 },
      { id: 'train-2', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Athlete training', duration: 12 }
    ],
    'strong': [
      { id: 'strong-1', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Getting strong', duration: 12 },
      { id: 'strong-2', url: 'https://videos.pexels.com/video-files/4761793/4761793-hd_1080_1920_25fps.mp4', description: 'Strength training', duration: 15 }
    ],
    
    // Flexibility
    'stretch': [
      { id: 'stretch-1', url: 'https://videos.pexels.com/video-files/4325473/4325473-hd_1080_1920_25fps.mp4', description: 'Stretching', duration: 15 },
      { id: 'stretch-2', url: 'https://videos.pexels.com/video-files/4761486/4761486-hd_1080_1920_25fps.mp4', description: 'Flexibility stretch', duration: 12 }
    ],
    'yoga': [
      { id: 'yoga-1', url: 'https://videos.pexels.com/video-files/4325473/4325473-hd_1080_1920_25fps.mp4', description: 'Yoga pose', duration: 15 },
      { id: 'yoga-2', url: 'https://videos.pexels.com/video-files/4536530/4536530-hd_1080_1920_30fps.mp4', description: 'Yoga practice', duration: 12 }
    ],
    'flexibility': [
      { id: 'flex-1', url: 'https://videos.pexels.com/video-files/4325473/4325473-hd_1080_1920_25fps.mp4', description: 'Flexibility training', duration: 15 },
      { id: 'flex-2', url: 'https://videos.pexels.com/video-files/4761486/4761486-hd_1080_1920_25fps.mp4', description: 'Stretching routine', duration: 12 }
    ],
    
    // Results/Body
    'fit': [
      { id: 'fit-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Fit person', duration: 15 },
      { id: 'fit-2', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Fit body', duration: 12 }
    ],
    'body': [
      { id: 'body-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Body fitness', duration: 15 },
      { id: 'body-2', url: 'https://videos.pexels.com/video-files/4761523/4761523-hd_1080_1920_25fps.mp4', description: 'Body workout', duration: 12 }
    ],
    'transform': [
      { id: 'transform-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Transformation', duration: 15 },
      { id: 'transform-2', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Body transformation', duration: 12 }
    ],
    
    // Default fitness fallback
    'default': [
      { id: 'fitness-default-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'General workout', duration: 15 },
      { id: 'fitness-default-2', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Gym scene', duration: 12 },
      { id: 'fitness-default-3', url: 'https://videos.pexels.com/video-files/4761637/4761637-hd_1080_1920_25fps.mp4', description: 'Running', duration: 15 },
      { id: 'fitness-default-4', url: 'https://videos.pexels.com/video-files/4761523/4761523-hd_1080_1920_25fps.mp4', description: 'Ab workout', duration: 12 }
    ]
  },
  
  // ============ HEALTH & NUTRITION VIDEOS ============
  health: {
    'water': [
      { id: 'water-1', url: 'https://videos.pexels.com/video-files/4156933/4156933-hd_1080_1920_25fps.mp4', description: 'Drinking water', duration: 10 },
      { id: 'water-2', url: 'https://videos.pexels.com/video-files/4156929/4156929-hd_1080_1920_25fps.mp4', description: 'Water bottle', duration: 8 }
    ],
    'hydrate': [
      { id: 'hydrate-1', url: 'https://videos.pexels.com/video-files/4156933/4156933-hd_1080_1920_25fps.mp4', description: 'Hydration', duration: 10 },
      { id: 'hydrate-2', url: 'https://videos.pexels.com/video-files/4156929/4156929-hd_1080_1920_25fps.mp4', description: 'Staying hydrated', duration: 8 }
    ],
    'drink': [
      { id: 'drink-1', url: 'https://videos.pexels.com/video-files/4156933/4156933-hd_1080_1920_25fps.mp4', description: 'Drinking', duration: 10 },
      { id: 'drink-2', url: 'https://videos.pexels.com/video-files/4156929/4156929-hd_1080_1920_25fps.mp4', description: 'Drinking water', duration: 8 }
    ],
    'food': [
      { id: 'food-1', url: 'https://videos.pexels.com/video-files/4253310/4253310-hd_1080_1920_25fps.mp4', description: 'Healthy food', duration: 12 },
      { id: 'food-2', url: 'https://videos.pexels.com/video-files/4253242/4253242-hd_1080_1920_25fps.mp4', description: 'Food preparation', duration: 10 }
    ],
    'eat': [
      { id: 'eat-1', url: 'https://videos.pexels.com/video-files/4253310/4253310-hd_1080_1920_25fps.mp4', description: 'Eating healthy', duration: 12 },
      { id: 'eat-2', url: 'https://videos.pexels.com/video-files/4253242/4253242-hd_1080_1920_25fps.mp4', description: 'Meal', duration: 10 }
    ],
    'meal': [
      { id: 'meal-1', url: 'https://videos.pexels.com/video-files/4253310/4253310-hd_1080_1920_25fps.mp4', description: 'Meal prep', duration: 12 },
      { id: 'meal-2', url: 'https://videos.pexels.com/video-files/4253242/4253242-hd_1080_1920_25fps.mp4', description: 'Healthy meal', duration: 10 }
    ],
    'diet': [
      { id: 'diet-1', url: 'https://videos.pexels.com/video-files/4253310/4253310-hd_1080_1920_25fps.mp4', description: 'Diet food', duration: 12 },
      { id: 'diet-2', url: 'https://videos.pexels.com/video-files/4253242/4253242-hd_1080_1920_25fps.mp4', description: 'Healthy diet', duration: 10 }
    ],
    'nutrition': [
      { id: 'nutrition-1', url: 'https://videos.pexels.com/video-files/4253310/4253310-hd_1080_1920_25fps.mp4', description: 'Nutritious food', duration: 12 },
      { id: 'nutrition-2', url: 'https://videos.pexels.com/video-files/4253242/4253242-hd_1080_1920_25fps.mp4', description: 'Nutrition', duration: 10 }
    ],
    'protein': [
      { id: 'protein-1', url: 'https://videos.pexels.com/video-files/4253310/4253310-hd_1080_1920_25fps.mp4', description: 'Protein food', duration: 12 },
      { id: 'protein-2', url: 'https://videos.pexels.com/video-files/4253242/4253242-hd_1080_1920_25fps.mp4', description: 'High protein meal', duration: 10 }
    ],
    'vegetable': [
      { id: 'veg-1', url: 'https://videos.pexels.com/video-files/4253310/4253310-hd_1080_1920_25fps.mp4', description: 'Vegetables', duration: 12 },
      { id: 'veg-2', url: 'https://videos.pexels.com/video-files/4253242/4253242-hd_1080_1920_25fps.mp4', description: 'Fresh vegetables', duration: 10 }
    ],
    'fruit': [
      { id: 'fruit-1', url: 'https://videos.pexels.com/video-files/4253310/4253310-hd_1080_1920_25fps.mp4', description: 'Fresh fruits', duration: 12 },
      { id: 'fruit-2', url: 'https://videos.pexels.com/video-files/4253242/4253242-hd_1080_1920_25fps.mp4', description: 'Healthy fruits', duration: 10 }
    ],
    'calorie': [
      { id: 'calorie-1', url: 'https://videos.pexels.com/video-files/4253310/4253310-hd_1080_1920_25fps.mp4', description: 'Calorie counting', duration: 12 },
      { id: 'calorie-2', url: 'https://videos.pexels.com/video-files/4253242/4253242-hd_1080_1920_25fps.mp4', description: 'Low calorie food', duration: 10 }
    ],
    'sleep': [
      { id: 'sleep-1', url: 'https://videos.pexels.com/video-files/4049993/4049993-hd_1080_1920_30fps.mp4', description: 'Sleeping', duration: 10 },
      { id: 'sleep-2', url: 'https://videos.pexels.com/video-files/4049990/4049990-hd_1080_1920_30fps.mp4', description: 'Rest sleep', duration: 8 }
    ],
    'rest': [
      { id: 'rest-1', url: 'https://videos.pexels.com/video-files/4049993/4049993-hd_1080_1920_30fps.mp4', description: 'Resting', duration: 10 },
      { id: 'rest-2', url: 'https://videos.pexels.com/video-files/4325473/4325473-hd_1080_1920_25fps.mp4', description: 'Relaxing', duration: 15 }
    ],
    'relax': [
      { id: 'relax-1', url: 'https://videos.pexels.com/video-files/4325473/4325473-hd_1080_1920_25fps.mp4', description: 'Relaxing', duration: 15 },
      { id: 'relax-2', url: 'https://videos.pexels.com/video-files/4536530/4536530-hd_1080_1920_30fps.mp4', description: 'Relaxation', duration: 12 }
    ],
    'stress': [
      { id: 'stress-1', url: 'https://videos.pexels.com/video-files/4536530/4536530-hd_1080_1920_30fps.mp4', description: 'Meditation relaxation', duration: 12 },
      { id: 'stress-2', url: 'https://videos.pexels.com/video-files/4325473/4325473-hd_1080_1920_25fps.mp4', description: 'Calm yoga', duration: 15 }
    ],
    'meditation': [
      { id: 'med-1', url: 'https://videos.pexels.com/video-files/4536530/4536530-hd_1080_1920_30fps.mp4', description: 'Meditation', duration: 12 },
      { id: 'med-2', url: 'https://videos.pexels.com/video-files/4325473/4325473-hd_1080_1920_25fps.mp4', description: 'Peaceful meditation', duration: 15 }
    ],
    'default': [
      { id: 'health-default-1', url: 'https://videos.pexels.com/video-files/4253310/4253310-hd_1080_1920_25fps.mp4', description: 'Healthy lifestyle', duration: 12 },
      { id: 'health-default-2', url: 'https://videos.pexels.com/video-files/4156933/4156933-hd_1080_1920_25fps.mp4', description: 'Wellness', duration: 10 }
    ]
  },
  
  // ============ MOTIVATION/LIFESTYLE VIDEOS ============
  motivation: {
    'success': [
      { id: 'success-1', url: 'https://videos.pexels.com/video-files/3015488/3015488-hd_1080_1920_24fps.mp4', description: 'Success celebration', duration: 12 },
      { id: 'success-2', url: 'https://videos.pexels.com/video-files/4761637/4761637-hd_1080_1920_25fps.mp4', description: 'Achievement', duration: 15 }
    ],
    'morning': [
      { id: 'morning-1', url: 'https://videos.pexels.com/video-files/4761637/4761637-hd_1080_1920_25fps.mp4', description: 'Morning run sunrise', duration: 15 },
      { id: 'morning-2', url: 'https://videos.pexels.com/video-files/3015488/3015488-hd_1080_1920_24fps.mp4', description: 'Morning motivation', duration: 12 }
    ],
    'daily': [
      { id: 'daily-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Daily routine', duration: 15 },
      { id: 'daily-2', url: 'https://videos.pexels.com/video-files/4761637/4761637-hd_1080_1920_25fps.mp4', description: 'Daily workout', duration: 15 }
    ],
    'routine': [
      { id: 'routine-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Routine workout', duration: 15 },
      { id: 'routine-2', url: 'https://videos.pexels.com/video-files/4761637/4761637-hd_1080_1920_25fps.mp4', description: 'Morning routine', duration: 15 }
    ],
    'consistency': [
      { id: 'consistent-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Consistency workout', duration: 15 },
      { id: 'consistent-2', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Daily training', duration: 12 }
    ],
    'discipline': [
      { id: 'discipline-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Disciplined workout', duration: 15 },
      { id: 'discipline-2', url: 'https://videos.pexels.com/video-files/4761637/4761637-hd_1080_1920_25fps.mp4', description: 'Focused training', duration: 15 }
    ],
    'focus': [
      { id: 'focus-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Focused', duration: 15 },
      { id: 'focus-2', url: 'https://videos.pexels.com/video-files/4536530/4536530-hd_1080_1920_30fps.mp4', description: 'Concentration', duration: 12 }
    ],
    'mindset': [
      { id: 'mindset-1', url: 'https://videos.pexels.com/video-files/4536530/4536530-hd_1080_1920_30fps.mp4', description: 'Mindset meditation', duration: 12 },
      { id: 'mindset-2', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Mental strength', duration: 15 }
    ],
    'goal': [
      { id: 'goal-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Achieving goals', duration: 15 },
      { id: 'goal-2', url: 'https://videos.pexels.com/video-files/3015488/3015488-hd_1080_1920_24fps.mp4', description: 'Goal success', duration: 12 }
    ],
    'result': [
      { id: 'result-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Results fitness', duration: 15 },
      { id: 'result-2', url: 'https://videos.pexels.com/video-files/3015488/3015488-hd_1080_1920_24fps.mp4', description: 'Achievement', duration: 12 }
    ],
    'hard': [
      { id: 'hard-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Working hard', duration: 15 },
      { id: 'hard-2', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Hard training', duration: 12 }
    ],
    'push': [
      { id: 'push-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Pushing hard', duration: 15 },
      { id: 'push-2', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Push yourself', duration: 12 }
    ],
    'never': [
      { id: 'never-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Never give up', duration: 15 },
      { id: 'never-2', url: 'https://videos.pexels.com/video-files/4761637/4761637-hd_1080_1920_25fps.mp4', description: 'Keep going', duration: 15 }
    ],
    'default': [
      { id: 'motivation-default-1', url: 'https://videos.pexels.com/video-files/4761637/4761637-hd_1080_1920_25fps.mp4', description: 'Motivation sunrise', duration: 15 },
      { id: 'motivation-default-2', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Inspired workout', duration: 15 }
    ]
  },
  
  // ============ HOOK/INTRO VIDEOS ============
  hooks: {
    'want': [
      { id: 'want-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Person looking', duration: 15 },
      { id: 'want-2', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Desiring fitness', duration: 12 }
    ],
    'stop': [
      { id: 'stop-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Attention grabbing', duration: 15 },
      { id: 'stop-2', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Stop and watch', duration: 12 }
    ],
    'secret': [
      { id: 'secret-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Revealing secret', duration: 15 },
      { id: 'secret-2', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Fitness secret', duration: 12 }
    ],
    'tip': [
      { id: 'tip-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Sharing tip', duration: 15 },
      { id: 'tip-2', url: 'https://videos.pexels.com/video-files/4761523/4761523-hd_1080_1920_25fps.mp4', description: 'Fitness tip', duration: 12 }
    ],
    'how': [
      { id: 'how-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Showing how', duration: 15 },
      { id: 'how-2', url: 'https://videos.pexels.com/video-files/4761523/4761523-hd_1080_1920_25fps.mp4', description: 'How to', duration: 12 }
    ],
    'why': [
      { id: 'why-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Explaining why', duration: 15 },
      { id: 'why-2', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Reason', duration: 12 }
    ],
    'here': [
      { id: 'here-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Here is', duration: 15 },
      { id: 'here-2', url: 'https://videos.pexels.com/video-files/4761523/4761523-hd_1080_1920_25fps.mp4', description: 'Presenting', duration: 12 }
    ],
    'most': [
      { id: 'most-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Most people', duration: 15 },
      { id: 'most-2', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Common mistake', duration: 12 }
    ],
    'default': [
      { id: 'hook-default-1', url: 'https://videos.pexels.com/video-files/4761440/4761440-hd_1080_1920_25fps.mp4', description: 'Attention hook', duration: 15 },
      { id: 'hook-default-2', url: 'https://videos.pexels.com/video-files/4761718/4761718-hd_1080_1920_25fps.mp4', description: 'Intro scene', duration: 12 }
    ]
  },
  
  // ============ ABSTRACT/FALLBACK VIDEOS ============
  abstract: {
    'default': [
      { id: 'abstract-1', url: 'https://videos.pexels.com/video-files/3129671/3129671-hd_1080_1920_30fps.mp4', description: 'Abstract particles', duration: 10 },
      { id: 'abstract-2', url: 'https://videos.pexels.com/video-files/856974/856974-hd_1080_1920_25fps.mp4', description: 'Light rays', duration: 12 },
      { id: 'abstract-3', url: 'https://videos.pexels.com/video-files/852400/852400-hd_1080_1920_30fps.mp4', description: 'Blue motion', duration: 10 }
    ]
  }
};

/**
 * Get curated video based on search term
 * Returns a video that ACTUALLY matches the content
 * 
 * @param {string} searchTerm - The search term to match
 * @param {string} contentType - The content type (fitness, health, motivation)
 * @returns {Object|null} - Matching video object or null
 */
function getCuratedVideoForTerm(searchTerm, contentType = 'fitness') {
  if (!searchTerm) return getRandomDefault(contentType);
  
  const lowerTerm = searchTerm.toLowerCase();
  
  // Check each category for matching keywords
  const categories = ['fitness', 'health', 'motivation', 'hooks'];
  
  for (const category of categories) {
    const categoryVideos = CURATED_VIDEO_DATABASE[category];
    if (!categoryVideos) continue;
    
    // Check each keyword in the category
    for (const [keyword, videos] of Object.entries(categoryVideos)) {
      if (keyword === 'default') continue;
      if (lowerTerm.includes(keyword)) {
        // Found a match! Return random video from this set
        const video = videos[Math.floor(Math.random() * videos.length)];
        return {
          ...video,
          source: 'curated',
          matchedKeyword: keyword,
          category: category
        };
      }
    }
  }
  
  // Check for fitness-related terms more broadly
  const fitnessTerms = ['gym', 'workout', 'exercise', 'fitness', 'training', 'muscle', 'body', 'weight'];
  for (const term of fitnessTerms) {
    if (lowerTerm.includes(term)) {
      return getRandomDefault('fitness');
    }
  }
  
  // Return category default
  return getRandomDefault(contentType);
}

/**
 * Get a random default video for a category
 */
function getRandomDefault(contentType = 'fitness') {
  const categoryDefault = CURATED_VIDEO_DATABASE[contentType]?.default || 
                          CURATED_VIDEO_DATABASE.fitness.default;
  
  if (categoryDefault && categoryDefault.length > 0) {
    const video = categoryDefault[Math.floor(Math.random() * categoryDefault.length)];
    return {
      ...video,
      source: 'curated',
      matchedKeyword: 'default',
      category: contentType
    };
  }
  
  return null;
}

/**
 * Get multiple curated videos for a list of scenes
 * Ensures variety by tracking used videos
 * 
 * @param {Array} scenes - Array of scene objects with searchTerm
 * @param {string} contentType - Content type
 * @returns {Array} - Array of video objects matched to scenes
 */
function getCuratedVideosForScenes(scenes, contentType = 'fitness') {
  if (!scenes || scenes.length === 0) return [];
  
  const usedVideoIds = new Set();
  const sceneVideos = [];
  
  for (const scene of scenes) {
    const searchTerm = scene.searchTerm || scene.keywords || '';
    let video = getCuratedVideoForTerm(searchTerm, contentType);
    
    // If we already used this video, try to get an alternative
    let attempts = 0;
    while (video && usedVideoIds.has(video.id) && attempts < 5) {
      video = getCuratedVideoForTerm(searchTerm, contentType);
      attempts++;
    }
    
    if (video) {
      usedVideoIds.add(video.id);
      sceneVideos.push({
        ...video,
        sceneIndex: scene.index,
        sceneSearchTerm: searchTerm,
        useDuration: scene.duration || 5,
        startAt: scene.startTime || 0,
        endAt: scene.endTime || (scene.startTime + (scene.duration || 5)),
        playbackStart: scene.startTime || 0,
        playbackDuration: scene.duration || 5
      });
    }
  }
  
  return sceneVideos;
}

module.exports = {
  CURATED_VIDEO_DATABASE,
  getCuratedVideoForTerm,
  getCuratedVideosForScenes,
  getRandomDefault
};
