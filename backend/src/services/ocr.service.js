import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import { withTimeout } from '../utils/withTimeout.js';

const OCR_TIMEOUT_MS = Number(process.env.OCR_TIMEOUT_MS || 120000);

/** Improve contrast/size so Tesseract reads receipt photos better. */
async function preprocessForOcr(buffer) {
  try {
    return await sharp(buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: false })
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
 * Uses a dedicated worker that is always terminated to avoid crashes on Windows.
 */
export async function extractTextFromImage(buffer) {
  const prepped = await preprocessForOcr(buffer);

  const run = async () => {
    const worker = await createWorker('eng', 1, {
      logger: () => {},
    });
    try {
      const {
        data: { text },
      } = await worker.recognize(prepped);
      return text || '';
    } finally {
      await worker.terminate();
    }
  };

  return withTimeout(
    run(),
    OCR_TIMEOUT_MS,
    'Reading text from the image took too long. Try a smaller or clearer photo.'
  );
}
