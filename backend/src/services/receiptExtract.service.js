import { analyzeReceiptImageBase64, getAiProvider } from './ai.service.js';

/**
 * Extracts receipt fields directly using Gemini/OpenAI vision for maximum speed on Vercel.
 */
export async function extractFromReceiptImage({ buffer, base64, mimeType }) {
  const useVision = getAiProvider() && process.env.DISABLE_VISION_AI !== 'true';
  
  if (useVision) {
    try {
      const result = await analyzeReceiptImageBase64({ base64, mimeType });
      if (result) {
        return { ...result, extractionMethod: 'ai-vision' };
      }
    } catch (err) {
      console.warn('Vision AI failed:', err.message);
      throw new Error(err.message);
    }
  }

  throw new Error(
    'No AI provider ready. Please make sure GEMINI_API_KEY is set in your Vercel Environment Variables!'
  );
}
