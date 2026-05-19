import OpenAI from 'openai';
import { NARRATIVE_PROMPT, RECEIPT_JSON_INSTRUCTION, parseAiJson, friendlyAiError } from './aiPrompts.js';

function client() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
}

export async function analyzeReceiptImageBase64({ base64, mimeType }) {
  try {
    const response = await client().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: RECEIPT_JSON_INSTRUCTION },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });
    return parseAiJson(response.choices[0]?.message?.content);
  } catch (err) {
    throw friendlyAiError(err, 'openai');
  }
}

export async function generateExpenseNarrative(statsText) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      summary: 'Add OPENAI_API_KEY to enable AI summaries.',
      tips: [],
      patterns: [],
    };
  }
  try {
    const response = await client().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: NARRATIVE_PROMPT(statsText) }],
      response_format: { type: 'json_object' },
      max_tokens: 800,
    });
    return parseAiJson(response.choices[0]?.message?.content || '{}');
  } catch (err) {
    return {
      summary: friendlyAiError(err, 'openai').message,
      tips: [],
      patterns: [],
    };
  }
}
