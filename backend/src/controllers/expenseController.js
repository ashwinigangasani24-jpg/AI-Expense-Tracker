import { Expense, EXPENSE_CATEGORIES } from '../models/Expense.js';
import { AppError } from '../utils/AppError.js';

function parseDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function listExpenses(req, res) {
  const { from, to, category, page = 1, limit = 20 } = req.query;
  const q = { user: req.userId };
  if (from || to) {
    q.date = {};
    if (from) q.date.$gte = new Date(from);
    if (to) q.date.$lte = new Date(to);
  }
  if (category && EXPENSE_CATEGORIES.includes(category)) {
    q.category = category;
  }
  const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Math.max(1, Number(limit)));
  const take = Math.min(100, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Expense.find(q).sort({ date: -1, createdAt: -1 }).skip(skip).limit(take).lean(),
    Expense.countDocuments(q),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: Number(page), limit: take, total },
  });
}

export async function getExpense(req, res) {
  const doc = await Expense.findOne({ _id: req.params.id, user: req.userId });
  if (!doc) throw new AppError('Expense not found', 404);
  res.json({ success: true, data: doc });
}

export async function createExpense(req, res) {
  const {
    amount,
    category,
    description,
    date,
    paymentMethod,
    shopName,
    gstOrTax,
    items,
    source,
    receipt,
    notes,
  } = req.body;

  if (amount == null || !date) {
    throw new AppError('Amount and date are required');
  }
  const d = parseDate(date);
  if (!d) throw new AppError('Invalid date');

  const cat = EXPENSE_CATEGORIES.includes(category) ? category : 'Other';

  const doc = await Expense.create({
    user: req.userId,
    amount: Number(amount),
    category: cat,
    description: description || '',
    date: d,
    paymentMethod: paymentMethod || '',
    shopName: shopName || '',
    gstOrTax: gstOrTax != null ? Number(gstOrTax) : 0,
    items: Array.isArray(items) ? items : [],
    source: source === 'receipt' || source === 'voice' ? source : 'manual',
    receipt: receipt || null,
    notes: notes || '',
  });

  res.status(201).json({ success: true, data: doc });
}

export async function updateExpense(req, res) {
  const doc = await Expense.findOne({ _id: req.params.id, user: req.userId });
  if (!doc) throw new AppError('Expense not found', 404);

  const fields = [
    'amount',
    'category',
    'description',
    'date',
    'paymentMethod',
    'shopName',
    'gstOrTax',
    'items',
    'source',
    'receipt',
    'notes',
  ];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      if (f === 'date') {
        const d = parseDate(req.body.date);
        if (!d) throw new AppError('Invalid date');
        doc.date = d;
      } else if (f === 'category') {
        doc.category = EXPENSE_CATEGORIES.includes(req.body.category)
          ? req.body.category
          : doc.category;
      } else if (f === 'amount' || f === 'gstOrTax') {
        doc[f] = Number(req.body[f]);
      } else {
        doc[f] = req.body[f];
      }
    }
  }
  await doc.save();
  res.json({ success: true, data: doc });
}

export async function deleteExpense(req, res) {
  const r = await Expense.deleteOne({ _id: req.params.id, user: req.userId });
  if (r.deletedCount === 0) throw new AppError('Expense not found', 404);
  res.json({ success: true, message: 'Deleted' });
}

export async function expenseMeta(req, res) {
  res.json({ success: true, categories: EXPENSE_CATEGORIES });
}
