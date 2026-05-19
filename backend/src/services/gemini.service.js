import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  NARRATIVE_PROMPT,
  RECEIPT_JSON_INSTRUCTION,
  parseAiJson,
  friendlyAiError,
  isQuotaOrRateLimit,
} from './aiPrompts.js';

/** Models to try if the configured one returns 404 (deprecated / renamed). */
const MODEL_FALLBACKS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-002',
];

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenerativeAI(apiKey);
}

function getModelCandidates() {
  const preferred = (process.env.GEMINI_MODEL || 'gemini-2.0-flash').trim();
  return [...new Set([preferred, ...MODEL_FALLBACKS])];
}

function getModel(modelName) {
  return client().getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: 'application/json' },
  });
}

async function generateContentWithFallback(parts) {
  const candidates = getModelCandidates();
  let lastError;

  for (const name of candidates) {
    try {
      const result = await getModel(name).generateContent(parts);
      if (name !== candidates[0]) {
        console.warn(`Gemini: using fallback model "${name}" (${candidates[0]} unavailable)`);
      }
      return result;
    } catch (err) {
      lastError = err;
      const msg = err?.message || '';
      if (/404|not found|not supported/i.test(msg)) {
        continue;
      }
      if (isQuotaOrRateLimit(err)) {
        continue;
      }
      throw friendlyAiError(err, 'gemini');
    }
  }

  if (lastError && isQuotaOrRateLimit(lastError)) {
    throw friendlyAiError(lastError, 'gemini');
  }

  throw friendlyAiError(
    lastError ||
      new Error(
        `No Gemini model available. Tried: ${candidates.join(', ')}. Set GEMINI_MODEL=gemini-2.0-flash in backend/.env`
      ),
    'gemini'
  );
}

export async function analyzeReceiptImageBase64({ base64, mimeType }) {
  const result = await generateContentWithFallback([
    { text: RECEIPT_JSON_INSTRUCTION },
    { inlineData: { data: base64, mimeType } },
  ]);
  return parseAiJson(result.response.text());
}

export async function generateExpenseNarrative(statsText) {
  const result = await generateContentWithFallback([{ text: NARRATIVE_PROMPT(statsText) }]);
  try {
    return parseAiJson(result.response.text());
  } catch {
    return { summary: result.response.text(), tips: [], patterns: [] };
  }
}
