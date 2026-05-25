import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { Card } from '../components/Card.jsx';
import { Button } from '../components/Button.jsx';
import { ExpenseForm } from '../components/ExpenseForm.jsx';
import { ReceiptImage } from '../components/ReceiptImage.jsx';
import { formatMoney } from '../utils/format.js';
import { getUserCurrency } from '../utils/currency.js';
import { useAuth } from '../context/AuthContext.jsx';

const METHOD_LABEL = {
  'ai-vision': 'Read from image (AI vision)',
  'image-ocr': 'Read from image (OCR)',
};

export default function UploadReceiptPage() {
  const { user } = useAuth();
  const currency = getUserCurrency(user);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [formInitial, setFormInitial] = useState({});

  function onPick(e) {
    const f = e.target.files?.[0];
    setFile(f || null);
    setResult(null);
    if (preview) URL.revokeObjectURL(preview);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview('');
  }

  function applyResult(data) {
    setResult(data);
    const s = data.suggestedExpense;
    setFormInitial({
      amount: s.amount ?? '',
      category: s.category || 'Other',
      description: s.description || '',
      date: s.date ? new Date(s.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      paymentMethod: s.paymentMethod || '',
      shopName: s.shopName || '',
      gstOrTax: s.gstOrTax ?? '',
      items: s.items || [],
      receipt: s.receipt,
    });
  }

  async function analyze() {
    if (!file) {
      toast.error('Choose an image first');
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/receipts/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });
      applyResult(data.data);

      if (data.data.alreadySavedAsExpense || data.data.isDuplicate) {
        toast('This receipt is already saved as an expense.', { icon: '⚠️', duration: 5000 });
      } else {
        toast.success('Receipt read from your image');
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveExpense(payload) {
    setBusy(true);
    try {
      await api.post('/expenses', payload);
      toast.success('Expense saved');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Scan receipt</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Upload a bill — shop, ₹ amount, tax, and category are extracted automatically from your image only.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Upload">
          <input type="file" accept="image/*" onChange={onPick} className="block w-full text-sm" />
          {preview && (
            <img src={preview} alt="Receipt preview" className="mt-4 max-h-80 w-full rounded-xl object-contain" />
          )}
          <Button className="mt-4" type="button" onClick={analyze} disabled={busy || !file}>
            {busy ? 'Reading image (may take 1–2 min)…' : 'Read from image'}
          </Button>
        </Card>

        <Card title="Extracted from your image">
          {!result && (
            <p className="text-sm text-slate-500">Upload a receipt and click Read from image.</p>
          )}
          {result?.extracted && (
            <div className="space-y-3 text-sm">
              {(result.alreadySavedAsExpense || result.isDuplicate) && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100">
                  <p className="text-xs font-medium">
                    This exact receipt image was already saved as an expense. You can view it in Expenses.
                  </p>
                </div>
              )}
              {result.extractionMethod && (
                <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-900/40 dark:text-brand-100">
                  {METHOD_LABEL[result.extractionMethod] || result.extractionMethod}
                </span>
              )}
              {result.receiptId && (
                <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
                  <ReceiptImage
                    receiptId={result.receiptId}
                    className="max-h-48 w-full bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <KV k="Shop" v={result.extracted.shopName || '—'} />
                <KV
                  k="Date"
                  v={
                    result.extracted.receiptDate
                      ? new Date(result.extracted.receiptDate).toLocaleDateString('en-IN')
                      : '—'
                  }
                />
                <KV k="Total" v={formatMoney(result.extracted.totalAmount, currency)} />
                <KV k="Tax" v={formatMoney(result.extracted.gstOrTax, currency)} />
                <KV k="Pay with" v={result.extracted.paymentMethod || '—'} />
                <KV k="Category" v={result.extracted.categoryGuess || '—'} />
                {(result.alreadySavedAsExpense || result.isDuplicate) && (
                  <KV k="Status" v="Already in ledger" />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">Summary</div>
                <p className="mt-1 text-slate-700 dark:text-slate-200">{result.ai?.explanation}</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {result?.extracted && !(result.alreadySavedAsExpense || result.isDuplicate) && (
        <Card title="Confirm & save (filled from image)">
          <ExpenseForm
            initial={formInitial}
            onSubmit={saveExpense}
            busy={busy}
            submitLabel="Save to ledger"
          />
        </Card>
      )}
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{k}</div>
      <div className="mt-1 font-medium text-slate-900 dark:text-slate-100">{v}</div>
    </div>
  );
}
