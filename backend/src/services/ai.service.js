import * as gemini from './gemini.service.js';
import * as openai from './openai.service.js';
import { friendlyAiError } from './aiPrompts.js';

function hasKey(name) {
  return Boolean(process.env[name]?.trim());
}

/** openai | gemini — respects AI_PROVIDER when keys exist */
export function getAiProvider() {
  const explicit = (process.env.AI_PROVIDER || '').toLowerCase().trim();

  if (explicit === 'gemini') {
    return hasKey('GEMINI_API_KEY') ? 'gemini' : null;
  }
  if (explicit === 'openai') {
    return hasKey('OPENAI_API_KEY') ? 'openai' : null;
  }

  if (hasKey('GEMINI_API_KEY')) return 'gemini';
  if (hasKey('OPENAI_API_KEY')) return 'openai';
  return null;
}

export function getAiStatus() {
  const requested = (process.env.AI_PROVIDER || 'auto').toLowerCase();
  const provider = getAiProvider();
  return {
    requestedProvider: requested,
    activeProvider: provider,
    geminiConfigured: hasKey('GEMINI_API_KEY'),
    openaiConfigured: hasKey('OPENAI_API_KEY'),
    imageOcrFallback: true,
    model:
      provider === 'gemini'
        ? process.env.GEMINI_MODEL || 'gemini-2.0-flash'
        : process.env.OPENAI_MODEL || 'gpt-4o-mini',
  };
}

function pick() {
  const requested = (process.env.AI_PROVIDER || 'auto').toLowerCase().trim();
  const provider = getAiProvider();

  if (requested === 'gemini' && !hasKey('GEMINI_API_KEY')) {
    throw new Error(
      'GEMINI_API_KEY is empty. Open backend/.env, paste your key from https://aistudio.google.com/apikey , save the file, then restart: npm run dev'
    );
  }
  if (requested === 'openai' && !hasKey('OPENAI_API_KEY')) {
    throw new Error('OPENAI_API_KEY is empty. Add a key or switch AI_PROVIDER=gemini with GEMINI_API_KEY.');
  }
  if (!provider) {
    throw new Error(
      'No AI provider ready. Set GEMINI_API_KEY (recommended) or OPENAI_API_KEY in backend/.env and restart the server.'
    );
  }

  return provider === 'gemini' ? gemini : openai;
}

export async function analyzeReceiptImageBase64(payload) {
  const provider = getAiProvider();
  try {
    return await pick().analyzeReceiptImageBase64(payload);
  } catch (err) {
    throw friendlyAiError(err, provider);
  }
}

export async function generateExpenseNarrative(statsText) {
  const provider = getAiProvider();
  if (!provider) {
    return {
      summary: 'Set GEMINI_API_KEY in backend/.env (see https://aistudio.google.com/apikey) and restart the server.',
      tips: [],
      patterns: [],
    };
  }
  try {
    return await pick().generateExpenseNarrative(statsText);
  } catch (err) {
    return {
      summary: friendlyAiError(err).message,
      tips: [],
      patterns: [],
    };
  }
}
