import { Receipt } from '../models/Receipt.js';
import { AppError } from '../utils/AppError.js';
import { sha256Buffer } from '../utils/hash.js';
import { extractFromReceiptImage } from '../services/receiptExtract.service.js';

function mapCategory(guess) {
  const allowed = [
    'Food',
    'Transport',
    'Shopping',
    'Bills',
    'Entertainment',
    'Health',
    'Travel',
    'Education',
    'Other',
  ];
  if (guess && allowed.includes(guess)) return guess;
  return 'Other';
}

function buildSuggestedExpense(receipt, ai) {
  return {
    amount: receipt.totalAmount,
    category: receipt.categoryGuess || 'Other',
    description: ai?.explanation?.slice(0, 200) || 'Receipt expense',
    date: receipt.receiptDate || new Date(),
    paymentMethod: receipt.paymentMethod || '',
    shopName: receipt.shopName || '',
    gstOrTax: receipt.gstOrTax ?? 0,
    items: receipt.items || [],
    source: 'receipt',
    receipt: receipt._id.toString(),
  };
}

/**
 * Handles Multer upload, image-only extraction, duplicate detection, and persistence.
 */
export async function uploadAndAnalyze(req, res) {
  if (!req.file) {
    throw new AppError('Image file is required (field name: image)');
  }
  console.log(`[receipt] upload start user=${req.userId} size=${req.file.size} type=${req.file.mimetype}`);
  const buffer = req.file.buffer;
  const mimeType = req.file.mimetype;
  const fileHash = sha256Buffer(buffer);

  const existing = await Receipt.findOne({ user: req.userId, fileHash }).sort({ createdAt: -1 });
  const isDuplicate = Boolean(existing);

  let ai;
  try {
    const base64 = buffer.toString('base64');
    ai = await extractFromReceiptImage({ buffer, base64, mimeType });
    console.log(`[receipt] extracted via ${ai.extractionMethod} total=${ai.totalAmount}`);
  } catch (e) {
    console.error('[receipt] extraction failed:', e.message);
    throw new AppError(e.message || 'Could not read receipt from image', 422);
  }

  const receipt = await Receipt.create({
    user: req.userId,
    fileHash,
    imageMimeType: mimeType,
    imageData: buffer,
    shopName: ai.shopName || '',
    receiptDate: ai.receiptDate ? new Date(ai.receiptDate) : undefined,
    totalAmount: typeof ai.totalAmount === 'number' ? ai.totalAmount : Number(ai.totalAmount) || 0,
    gstOrTax: typeof ai.gstOrTax === 'number' ? ai.gstOrTax : Number(ai.gstOrTax) || 0,
    paymentMethod: ai.paymentMethod || '',
    items: Array.isArray(ai.items) ? ai.items : [],
    categoryGuess: mapCategory(ai.categoryGuess),
    aiExplanation: ai.explanation || '',
    structuredJson: {
      insights: ai.insights || [],
      savingsTips: ai.savingsTips || [],
      unusualFlags: ai.unusualFlags || [],
      extractionMethod: ai.extractionMethod || 'image',
    },
    isDuplicate,
    duplicateOf: existing?._id || null,
    processingError: '',
  });

  const suggestedExpense = buildSuggestedExpense(receipt, ai);

  res.status(201).json({
    success: true,
    data: {
      receiptId: receipt._id.toString(),
      isDuplicate,
      duplicateReceiptId: existing?._id?.toString() || null,
      analysisFailed: false,
      extractionMethod: ai.extractionMethod,
      extracted: {
        shopName: receipt.shopName,
        receiptDate: receipt.receiptDate,
        totalAmount: receipt.totalAmount,
        gstOrTax: receipt.gstOrTax,
        paymentMethod: receipt.paymentMethod,
        items: receipt.items,
        categoryGuess: receipt.categoryGuess,
      },
      ai: {
        explanation: receipt.aiExplanation,
        insights: receipt.structuredJson.insights || [],
        savingsTips: receipt.structuredJson.savingsTips || [],
        unusualFlags: receipt.structuredJson.unusualFlags || [],
        demoMode: false,
      },
      suggestedExpense,
    },
  });
}

export async function listReceipts(req, res) {
  const items = await Receipt.find({ user: req.userId })
    .sort({ createdAt: -1 })
    .select('-imageData')
    .limit(50)
    .lean();
  res.json({ success: true, data: items });
}

export async function getReceipt(req, res) {
  const doc = await Receipt.findOne({ _id: req.params.id, user: req.userId }).select('-imageData').lean();
  if (!doc) throw new AppError('Receipt not found', 404);
  res.json({ success: true, data: doc });
}

/** Streams stored receipt image (authenticated). */
export async function getReceiptImage(req, res) {
  const doc = await Receipt.findOne({ _id: req.params.id, user: req.userId }).select('imageData imageMimeType');
  if (!doc) throw new AppError('Receipt not found', 404);
  res.setHeader('Content-Type', doc.imageMimeType);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.send(doc.imageData);
}
