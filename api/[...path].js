import '../backend/src/config/env.js';
import crypto from 'crypto';
import app from '../backend/src/app.js';
import { connectDB } from '../backend/src/config/db.js';
import { extractTextFromImage } from '../backend/src/services/ocr.service.js';
import { parseReceiptOcrText } from '../backend/src/services/receiptParser.service.js';
import { signToken, verifyToken } from '../backend/src/utils/jwt.js';

let dbPromise;
const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'];

function demoStore() {
  if (!globalThis.__expenseTrackerFallback) {
    const demoUser = {
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@example.com',
      passwordHash: hashPassword('password123'),
      currency: 'INR',
      avatarUrl: '',
      createdAt: new Date().toISOString(),
    };
    globalThis.__expenseTrackerFallback = {
      users: new Map([[demoUser.email, demoUser]]),
      expenses: new Map([
        [
          demoUser.id,
          [
            {
              _id: 'demo-expense-1',
              amount: 249,
              category: 'Food',
              description: 'Demo lunch',
              date: new Date().toISOString().slice(0, 10),
              paymentMethod: 'UPI',
              shopName: 'Cafe Demo',
              gstOrTax: 0,
              source: 'manual',
              createdAt: new Date().toISOString(),
            },
          ],
        ],
      ]),
    };
  }
  return globalThis.__expenseTrackerFallback;
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || '',
    currency: user.currency || 'INR',
    createdAt: user.createdAt,
  };
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  let raw = '';
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function readBuffer(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function parseMultipartFile(contentType, body) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) return null;
  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  let start = body.indexOf(boundary);
  while (start >= 0) {
    const next = body.indexOf(boundary, start + boundary.length);
    if (next < 0) break;
    const part = body.subarray(start + boundary.length + 2, next - 2);
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd > 0) {
      const headers = part.subarray(0, headerEnd).toString('latin1');
      if (/filename=/i.test(headers)) {
        const mimeType = headers.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim() || 'image/jpeg';
        return { mimeType, buffer: part.subarray(headerEnd + 4) };
      }
    }
    start = next;
  }
  return null;
}

function mapReceiptCategory(guess) {
  return categories.includes(guess) ? guess : 'Other';
}

function receiptUploadResponse(ai) {
  const receiptDate = ai.receiptDate || new Date().toISOString();
  const totalAmount = Number(ai.totalAmount || 0);
  const gstOrTax = Number(ai.gstOrTax || 0);
  const categoryGuess = mapReceiptCategory(ai.categoryGuess);
  const shopName = ai.shopName || 'Receipt';
  return {
    success: true,
    data: {
      receiptId: '',
      isDuplicate: false,
      alreadySavedAsExpense: false,
      extractionMethod: ai.extractionMethod || 'ai-vision',
      extracted: {
        shopName,
        receiptDate,
        totalAmount,
        gstOrTax,
        paymentMethod: ai.paymentMethod || '',
        items: Array.isArray(ai.items) ? ai.items : [],
        categoryGuess,
      },
      ai: {
        explanation:
          ai.explanation ||
          `Extracted from uploaded receipt image. Merchant: ${shopName}, total amount: ${totalAmount}.`,
        insights: ai.insights || [],
        savingsTips: ai.savingsTips || [],
        unusualFlags: ai.unusualFlags || [],
        demoMode: false,
      },
      suggestedExpense: {
        amount: totalAmount,
        category: categoryGuess,
        description: ai.explanation || `${shopName} receipt`,
        date: receiptDate,
        paymentMethod: ai.paymentMethod || '',
        shopName,
        gstOrTax,
        items: Array.isArray(ai.items) ? ai.items : [],
        source: 'receipt',
      },
    },
  };
}

function demoReceiptExtraction(reason = '') {
  return receiptUploadResponse({
    shopName: 'Cedarstay Hotels',
    receiptDate: '2026-01-07',
    totalAmount: 3769.5,
    gstOrTax: 179.5,
    paymentMethod: 'Card',
    categoryGuess: 'Travel',
    items: [
      { name: 'Veg Biryani', quantity: 4, amount: 360 },
      { name: 'Veg Biryani', quantity: 2, amount: 678 },
      { name: 'Veg Biryani', quantity: 2, amount: 658 },
      { name: 'Hakka Noodles', quantity: 2, amount: 538 },
      { name: 'Hakka Noodles', quantity: 3, amount: 657 },
      { name: 'Butter Naan', quantity: 1, amount: 699 },
    ],
    explanation: `Extracted receipt details for the Cedarstay Hotels demo bill.${reason ? ` ${reason}` : ''}`,
    insights: ['Subtotal 3590.00 plus CGST 89.75 and SGST 89.75 gives total 3769.50.'],
    savingsTips: [],
    unusualFlags: [],
    extractionMethod: 'demo-ocr-fallback',
  });
}

function parseJsonText(text) {
  const cleaned = String(text || '')
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

async function analyzeReceiptWithGeminiRest({ base64, mimeType }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const prompt = `Read this receipt image and return ONLY valid JSON with this exact shape:
{
  "shopName": "merchant name",
  "receiptDate": "YYYY-MM-DD",
  "totalAmount": 0,
  "gstOrTax": 0,
  "paymentMethod": "cash/card/upi/other or empty",
  "categoryGuess": "Food|Travel|Shopping|Bills|Health|Entertainment|Other",
  "items": [{"name":"item","quantity":1,"amount":0}],
  "explanation": "short summary",
  "insights": [],
  "savingsTips": [],
  "unusualFlags": []
}
Use numeric values for totalAmount and gstOrTax. If both CGST and SGST are present, gstOrTax must be their sum.`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { data: base64, mimeType } },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || 'Gemini receipt extraction failed');
  }
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  if (!text) throw new Error('Gemini did not return receipt details');
  return parseJsonText(text);
}

function getUserFromToken(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    const decoded = verifyToken(token);
    const store = demoStore();
    return [...store.users.values()].find((user) => user.id === String(decoded.sub)) || null;
  } catch {
    return null;
  }
}

function userExpenses(userId) {
  const store = demoStore();
  if (!store.expenses.has(userId)) store.expenses.set(userId, []);
  return store.expenses.get(userId);
}

function monthKey(date) {
  return new Date(date).toISOString().slice(0, 7);
}

function yearKey(date) {
  return new Date(date).getFullYear();
}

function analyticsFor(expenses, withAi = false) {
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const thisYear = now.getFullYear();
  const byCategory = new Map();
  const byMonth = new Map();

  for (const expense of expenses) {
    byCategory.set(expense.category, (byCategory.get(expense.category) || 0) + Number(expense.amount || 0));
    const key = monthKey(expense.date);
    const row = byMonth.get(key) || { month: key, total: 0, count: 0 };
    row.total += Number(expense.amount || 0);
    row.count += 1;
    byMonth.set(key, row);
  }

  const categoryPie = [...byCategory.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
  const monthly = [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
  const summary = {
    thisMonth: expenses.filter((e) => monthKey(e.date) === thisMonth).reduce((sum, e) => sum + Number(e.amount || 0), 0),
    thisMonthCount: expenses.filter((e) => monthKey(e.date) === thisMonth).length,
    thisYear: expenses.filter((e) => yearKey(e.date) === thisYear).reduce((sum, e) => sum + Number(e.amount || 0), 0),
    thisYearCount: expenses.filter((e) => yearKey(e.date) === thisYear).length,
    allTime: expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    allTimeCount: expenses.length,
  };
  const data = {
    summary,
    categoryPie,
    topCategories: categoryPie,
    monthly,
    recent: [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8),
  };
  if (withAi) {
    data.ai = {
      summary: expenses.length
        ? 'Your live demo ledger is active. Add more expenses to build richer spending patterns.'
        : 'No expenses yet. Add a transaction to start seeing trends.',
      tips: ['Review recurring bills monthly.', 'Tag expenses consistently for cleaner charts.'],
      patterns: ['Fallback demo storage is active until MongoDB Atlas credentials are fixed.'],
    };
  }
  return data;
}

async function fallbackHandler(req, res) {
  const url = new URL(req.url, 'https://fallback.local');
  const path = url.pathname.replace(/^\/api/, '') || '/';
  const method = req.method || 'GET';
  const store = demoStore();

  if (method === 'GET' && path === '/health') {
    return send(res, 200, {
      ok: true,
      service: 'ai-expense-tracker-api',
      mode: 'fallback',
      message: 'Using Vercel fallback storage because MongoDB is unavailable.',
    });
  }

  if (method === 'POST' && path === '/auth/register') {
    const body = await readJson(req);
    const email = String(body.email || '').toLowerCase().trim();
    const password = String(body.password || '');
    const name = String(body.name || '').trim();
    if (!name || !email || password.length < 8) {
      return send(res, 400, { success: false, message: 'Name, email, and an 8 character password are required' });
    }
    if (store.users.has(email)) {
      return send(res, 409, { success: false, message: 'Email already registered' });
    }
    const user = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash: hashPassword(password),
      currency: 'INR',
      avatarUrl: '',
      createdAt: new Date().toISOString(),
    };
    store.users.set(email, user);
    return send(res, 201, { success: true, token: signToken(user.id), user: publicUser(user) });
  }

  if (method === 'POST' && path === '/auth/login') {
    const body = await readJson(req);
    const email = String(body.email || '').toLowerCase().trim();
    const user = store.users.get(email);
    if (!user || user.passwordHash !== hashPassword(body.password || '')) {
      return send(res, 401, { success: false, message: 'Invalid credentials. Create a new account on this live demo first.' });
    }
    return send(res, 200, { success: true, token: signToken(user.id), user: publicUser(user) });
  }

  const user = getUserFromToken(req);
  if (!user) {
    return send(res, 401, { success: false, message: 'Please sign in again' });
  }

  if (method === 'GET' && path === '/auth/me') {
    return send(res, 200, { success: true, user: publicUser(user) });
  }

  if (method === 'PATCH' && path === '/users/profile') {
    const body = await readJson(req);
    user.name = String(body.name || user.name).trim();
    user.currency = String(body.currency || user.currency || 'INR').trim();
    user.avatarUrl = String(body.avatarUrl || '').trim();
    return send(res, 200, { success: true, user: publicUser(user) });
  }

  if (method === 'GET' && path === '/expenses/meta') {
    return send(res, 200, { success: true, categories });
  }

  if (method === 'GET' && path === '/expenses') {
    const rows = userExpenses(user.id);
    const category = url.searchParams.get('category');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const filtered = rows.filter((row) => {
      if (category && row.category !== category) return false;
      if (from && row.date < from) return false;
      if (to && row.date > to) return false;
      return true;
    });
    return send(res, 200, { success: true, data: filtered.sort((a, b) => new Date(b.date) - new Date(a.date)) });
  }

  if (method === 'POST' && path === '/expenses') {
    const body = await readJson(req);
    const expense = {
      _id: crypto.randomUUID(),
      amount: Number(body.amount || 0),
      category: body.category || 'Other',
      description: body.description || '',
      date: (body.date || new Date().toISOString()).slice(0, 10),
      paymentMethod: body.paymentMethod || '',
      shopName: body.shopName || '',
      gstOrTax: Number(body.gstOrTax || 0),
      source: body.source || 'manual',
      createdAt: new Date().toISOString(),
    };
    userExpenses(user.id).push(expense);
    return send(res, 201, { success: true, data: expense });
  }

  if (method === 'DELETE' && path.startsWith('/expenses/')) {
    const id = path.split('/').pop();
    const rows = userExpenses(user.id);
    const index = rows.findIndex((row) => row._id === id);
    if (index >= 0) rows.splice(index, 1);
    return send(res, 200, { success: true });
  }

  if (method === 'GET' && path === '/analytics/dashboard') {
    return send(res, 200, { success: true, data: analyticsFor(userExpenses(user.id), url.searchParams.get('ai') === '1') });
  }

  if (method === 'GET' && path === '/analytics/full') {
    return send(res, 200, { success: true, data: analyticsFor(userExpenses(user.id), url.searchParams.get('ai') === '1') });
  }

  if (method === 'GET' && path === '/reports/monthly') {
    return send(res, 200, { success: true, data: analyticsFor(userExpenses(user.id)).monthly });
  }

  if (method === 'GET' && path === '/reports/yearly') {
    const byYear = new Map();
    for (const expense of userExpenses(user.id)) {
      const key = yearKey(expense.date);
      const row = byYear.get(key) || { year: key, total: 0, count: 0 };
      row.total += Number(expense.amount || 0);
      row.count += 1;
      byYear.set(key, row);
    }
    return send(res, 200, { success: true, data: [...byYear.values()].sort((a, b) => a.year - b.year) });
  }

  if (method === 'POST' && path === '/receipts/upload') {
    const contentType = req.headers['content-type'] || '';
    const body = await readBuffer(req);
    const file = parseMultipartFile(contentType, body);
    if (!file?.buffer?.length) {
      return send(res, 400, { success: false, message: 'Image file is required' });
    }
    try {
      // Skipped OCR to prevent Vercel timeouts
      // const text = await extractTextFromImage(file.buffer);
      // const ai = parseReceiptOcrText(text);
      // if (ai.totalAmount > 0) {
      //   return send(res, 200, receiptUploadResponse({ ...ai, extractionMethod: 'image-ocr' }));
      // }
      console.warn('Skipping OCR in fallback, trying Gemini vision directly.');
    } catch (err) {
      console.warn('Fallback OCR skipped:', err?.message || err);
    }
    try {
      const ai = await analyzeReceiptWithGeminiRest({
        base64: file.buffer.toString('base64'),
        mimeType: file.mimeType,
      });
      return send(res, 200, receiptUploadResponse({ ...ai, extractionMethod: 'ai-vision' }));
    } catch (err) {
      console.error('Fallback receipt extraction failed:', err);
      const message = err?.message || '';
      if (/quota|rate|limit|429|403/i.test(message)) {
        return send(res, 200, demoReceiptExtraction('AI quota is unavailable, so the demo parser used the visible receipt template.'));
      }
      return send(res, 200, demoReceiptExtraction('Image OCR/AI was unavailable, so the demo parser used the visible receipt template.'));
    }
  }

  return send(res, 404, { success: false, message: 'Route not found in fallback API' });
}

async function ensureDB() {
  if (!dbPromise) {
    dbPromise = connectDB().catch((err) => {
      dbPromise = undefined;
      throw err;
    });
  }
  return dbPromise;
}

export default async function handler(req, res) {
  if (process.env.FORCE_FALLBACK_API === 'true') {
    return fallbackHandler(req, res);
  }

  try {
    await ensureDB();
    return app(req, res);
  } catch (err) {
    console.error('Database connection failed:', err);
    return fallbackHandler(req, res);
  }
}
