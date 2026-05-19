export const RECEIPT_JSON_INSTRUCTION = `You are a receipt OCR and understanding assistant.
Analyze the receipt image and return ONLY valid JSON with this shape:
{
  "shopName": string,
  "receiptDate": string (ISO 8601 date if possible, else best guess YYYY-MM-DD),
  "totalAmount": number,
  "gstOrTax": number,
  "paymentMethod": string,
  "categoryGuess": string (one of: Food, Transport, Shopping, Bills, Entertainment, Health, Travel, Education, Other),
  "items": [{ "name": string, "quantity": number, "unitPrice": number, "lineTotal": number }],
  "explanation": string (2-5 sentences describing the receipt for the user),
  "insights": string[] (2-4 short spending insights),
  "savingsTips": string[] (2-3 actionable savings tips),
  "unusualFlags": string[] (empty if nothing unusual; otherwise note anomalies like very high single item, luxury category, etc.)
}
If a field is unknown, use reasonable defaults: empty string, 0, empty arrays.
totalAmount must be a number (no currency symbols in JSON).
For Indian receipts (INR, Rs, ₹, GST/CGST/SGST), use numeric amounts as printed and set categoryGuess appropriately (e.g. Travel for bus/train/flight invoices).
Reply with JSON only, no markdown fences.`;

export const NARRATIVE_PROMPT = (statsText) => `Given this user's expense statistics (JSON or text), respond with JSON only:
{
  "summary": string (natural language paragraph),
  "tips": string[] (3-5 savings tips),
  "patterns": string[] (unusual patterns or observations)
}
Data:
${statsText}`;

export function parseAiJson(text) {
  if (!text) throw new Error('Empty AI response');
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Failed to parse AI JSON');
  }
}

export function isQuotaOrRateLimit(err) {
  const msg = err?.message || String(err);
  const status = err?.status || err?.statusCode;
  return status === 429 || /429|RESOURCE_EXHAUSTED|rate limit|quota exceeded|exceeded your current quota/i.test(msg);
}

export function isGeminiError(err) {
  const msg = err?.message || String(err);
  return (
    /GoogleGenerativeAI|generativelanguage\.googleapis|gemini/i.test(msg) ||
    (process.env.AI_PROVIDER || '').toLowerCase().trim() === 'gemini'
  );
}

/**
 * @param {unknown} err
 * @param {'gemini'|'openai'|null} [activeProvider] — which provider was actually called
 */
export function friendlyAiError(err, activeProvider = null) {
  const msg = err?.message || String(err);
  const status = err?.status || err?.statusCode;
  const provider =
    activeProvider || ((process.env.AI_PROVIDER || '').toLowerCase().trim() === 'gemini' ? 'gemini' : 'openai');
  const isGemini = provider === 'gemini' || isGeminiError(err);

  if (isQuotaOrRateLimit(err)) {
    if (isGemini) {
      return new Error(
        'Gemini API daily/minute limit reached (429). Wait a few minutes, create a new free key at https://aistudio.google.com/apikey and update GEMINI_API_KEY in backend/.env, then restart the server. You can still enter amounts manually from your receipt image below.'
      );
    }
    return new Error(
      'OpenAI quota exceeded (429). Add billing at https://platform.openai.com/account/billing or set AI_PROVIDER=gemini with GEMINI_API_KEY in backend/.env.'
    );
  }

  if (status === 403 || /403|PERMISSION_DENIED|access denied/i.test(msg)) {
    return new Error(
      'Gemini rejected this model for your API key (403). Set GEMINI_MODEL=gemini-2.0-flash in backend/.env or create a new key at https://aistudio.google.com/apikey'
    );
  }

  if (/OPENAI_API_KEY|GEMINI_API_KEY|not configured/i.test(msg)) {
    return new Error(msg);
  }
  return new Error(msg);
}
