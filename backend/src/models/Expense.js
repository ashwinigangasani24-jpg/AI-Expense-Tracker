import mongoose from 'mongoose';

export const EXPENSE_CATEGORIES = [
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

const lineItemSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    lineTotal: { type: Number, default: 0 },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: EXPENSE_CATEGORIES,
      default: 'Other',
    },
    description: { type: String, default: '', trim: true },
    date: { type: Date, required: true, index: true },
    paymentMethod: { type: String, default: '' },
    shopName: { type: String, default: '' },
    gstOrTax: { type: Number, default: 0 },
    items: { type: [lineItemSchema], default: [] },
    source: { type: String, enum: ['manual', 'receipt', 'voice'], default: 'manual' },
    receipt: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt', default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

expenseSchema.index({ user: 1, date: -1 });

export const Expense = mongoose.model('Expense', expenseSchema);
