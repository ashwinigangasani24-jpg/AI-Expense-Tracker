import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from './Button.jsx';

const categories = [
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

/**
 * Parses loose phrases like "coffee 12 dollars food" into partial form fields (best-effort).
 */
function parseVoiceText(text) {
  const lower = text.toLowerCase();
  const amountMatch = lower.match(/(\d+(\.\d+)?)/);
  const amount = amountMatch ? Number(amountMatch[1]) : '';
  let category = 'Other';
  for (const c of categories) {
    if (lower.includes(c.toLowerCase())) {
      category = c;
      break;
    }
  }
  const description = text.trim();
  return { amount, category, description };
}

export function ExpenseForm({
  initial = {},
  onSubmit,
  submitLabel = 'Save expense',
  busy = false,
}) {
  const [amount, setAmount] = useState(initial.amount ?? '');
  const [category, setCategory] = useState(initial.category ?? 'Food');
  const [description, setDescription] = useState(initial.description ?? '');
  const [date, setDate] = useState(initial.date ?? '');
  const [paymentMethod, setPaymentMethod] = useState(initial.paymentMethod ?? '');
  const [shopName, setShopName] = useState(initial.shopName ?? '');
  const [gstOrTax, setGstOrTax] = useState(initial.gstOrTax ?? '');
  const [itemsJson, setItemsJson] = useState(
    initial.items ? JSON.stringify(initial.items, null, 2) : '[]'
  );
  const [receipt, setReceipt] = useState(initial.receipt ?? '');
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);

  useEffect(() => {
    setAmount(initial.amount ?? '');
    setCategory(initial.category ?? 'Food');
    setDescription(initial.description ?? '');
    setDate(
      initial.date
        ? new Date(initial.date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10)
    );
    setPaymentMethod(initial.paymentMethod ?? '');
    setShopName(initial.shopName ?? '');
    setGstOrTax(initial.gstOrTax ?? '');
    setItemsJson(initial.items ? JSON.stringify(initial.items, null, 2) : '[]');
    setReceipt(initial.receipt ?? '');
  }, [initial]);

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }
    const r = new SR();
    r.lang = 'en-US';
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (ev) => {
      const text = ev.results[0][0].transcript;
      const parsed = parseVoiceText(text);
      if (parsed.amount !== '') setAmount(String(parsed.amount));
      if (parsed.category) setCategory(parsed.category);
      if (parsed.description) setDescription(parsed.description);
      toast.success('Voice captured');
    };
    r.onerror = () => toast.error('Voice capture failed');
    r.onend = () => setListening(false);
    recogRef.current = r;
    setListening(true);
    r.start();
  }

  function stopVoice() {
    try {
      recogRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    let items = [];
    try {
      items = JSON.parse(itemsJson || '[]');
      if (!Array.isArray(items)) throw new Error();
    } catch {
      toast.error('Items must be a JSON array.');
      return;
    }
    await onSubmit({
      amount: Number(amount),
      category,
      description,
      date,
      paymentMethod,
      shopName,
      gstOrTax: gstOrTax === '' ? 0 : Number(gstOrTax),
      items,
      receipt: receipt || undefined,
      source: receipt ? 'receipt' : 'manual',
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={listening ? 'danger' : 'outline'}
          onClick={listening ? stopVoice : startVoice}
        >
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {listening ? 'Stop' : 'Voice fill'}
        </Button>
        <p className="text-xs text-slate-500 self-center">
          Say amount, category, and a short description (e.g. “groceries 84 dollars food”).
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Amount
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Date
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Payment method
          <input
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder="Card, Cash, UPI..."
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
          Shop / merchant
          <input
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          GST / Tax
          <input
            type="number"
            step="0.01"
            min="0"
            value={gstOrTax}
            onChange={(e) => setGstOrTax(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Linked receipt ID (optional)
          <input
            value={receipt}
            onChange={(e) => setReceipt(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
          Description
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
          Line items (JSON array)
          <textarea
            rows={4}
            value={itemsJson}
            onChange={(e) => setItemsJson(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
      </div>
      <Button type="submit" disabled={busy} className="w-full sm:w-auto">
        {busy ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
