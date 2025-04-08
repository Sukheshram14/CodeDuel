require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try to list available models
    const result = await genAI.getModels();
    console.log('Available models:');
    result.models.forEach(model => {
      console.log(`- ${model.name} (${model.displayName})`);
      console.log(`  Supported generation methods: ${model.supportedGenerationMethods.join(', ')}`);
    });
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels(); 