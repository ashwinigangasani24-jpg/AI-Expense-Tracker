import { analyzeReceiptImageBase64, getAiProvider } from './ai.service.js';
import { extractTextFromImage } from './ocr.service.js';
import { parseReceiptOcrText } from './receiptParser.service.js';

/**
 * Extracts receipt fields from the uploaded image only (no manual entry).
 * 1) OCR on image bytes (free, always from your file)
 * 2) Gemini/OpenAI vision if OCR could not find a total
 */
export async function extractFromReceiptImage({ buffer, base64, mimeType }) {
  let ocrText = '';
  try {
    ocrText = await extractTextFromImage(buffer);
  } catch (err) {
    console.warn('OCR pass failed:', err.message);
  }

  if (ocrText.replace(/\s/g, '').length > 3) {
    const parsed = parseReceiptOcrText(ocrText);
    if (parsed.totalAmount > 0) {
      return { ...parsed, extractionMethod: 'image-ocr' };
    }
  }

  const useVision = getAiProvider() && process.env.DISABLE_VISION_AI !== 'true';
  if (useVision) {
    try {
      const result = await analyzeReceiptImageBase64({ base64, mimeType });
      if (result?.totalAmount > 0) {
        return { ...result, extractionMethod: 'ai-vision' };
      }
    } catch (err) {
      console.warn('Vision AI failed:', err.message);
    }
  }

  if (!ocrText.replace(/\s/g, '').length) {
    throw new Error(
      'Could not read text from this image. Use a clear, full receipt photo with good lighting.'
    );
  }

  throw new Error(
    'Could not detect amounts on this receipt image. Re-upload a sharper photo showing the Grand Total line.'
  );
}
