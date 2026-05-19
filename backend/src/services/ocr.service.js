import Tesseract from 'tesseract.js';
import sharp from 'sharp';

/** Improve contrast/size so Tesseract reads receipt photos better. */
async function preprocessForOcr(buffer) {
  try {
    return await sharp(buffer)
      .rotate()
      .resize({ width: 2200, withoutEnlargement: false })
      .grayscale()
      .normalize()
      .sharpen()
      .png()
      .toBuffer();
  } catch {
    return buffer;
  }
}

/**
 * Reads text directly from receipt image bytes (no cloud API quota).
 */
export async function extractTextFromImage(buffer) {
  const prepped = await preprocessForOcr(buffer);
  const result = await Tesseract.recognize(prepped, 'eng', {
    logger: () => {},
  });
  return result.data?.text || '';
}
