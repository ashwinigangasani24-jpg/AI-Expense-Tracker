import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { Card } from '../components/Card.jsx';
import { Button } from '../components/Button.jsx';
import { formatDate, formatMoney, toInputDate } from '../utils/format.js';
import { getUserCurrency } from '../utils/currency.js';
import { useAuth } from '../context/AuthContext.jsx';
import { exportExpensesPdf } from '../utils/exportPdf.js';
import { exportExpensesExcel } from '../utils/exportExcel.js';

export default function ExpenseHistoryPage() {
  const { user } = useAuth();
  const currency = getUserCurrency(user);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);

  async function load() {
    setLoading(true);
    try {
      const { data: meta } = await api.get('/expenses/meta');
      setCategories(meta.categories);
      const { data } = await api.get('/expenses', {
        params: {
          from: from || undefined,
          to: to || undefined,
          category: category || undefined,
          limit: 100,
        },
      });
      setItems(data.data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function remove(id) {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Deleted');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Expense history</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Date filters, exports, and full CRUD via the REST API.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => exportExpensesPdf(items, currency)}>
            Export PDF
          </Button>
          <Button type="button" variant="outline" onClick={() => exportExpensesExcel(items)}>
            Export Excel
          </Button>
        </div>
      </div>

      <Card title="Filters">
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="text-sm font-medium">
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="text-sm font-medium">
            To
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="text-sm font-medium">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <Button className="w-full" type="button" onClick={load}>
              Apply
            </Button>
          </div>
        </div>
      </Card>

      <Card title={`Results (${items.length})`}>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-500">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Shop</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((r) => (
                  <tr key={r._id}>
                    <td className="py-2">{formatDate(r.date)}</td>
                    <td className="py-2">{r.category}</td>
                    <td className="py-2">{r.shopName || '—'}</td>
                    <td className="py-2">{r.description || '—'}</td>
                    <td className="py-2 text-right font-semibold">{formatMoney(r.amount, currency)}</td>
                    <td className="py-2 text-right">
                      <Button variant="ghost" type="button" onClick={() => remove(r._id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <QuickAdd onAdded={load} currency={currency} categories={categories} />
    </div>
  );
}

function QuickAdd({ onAdded, currency, categories }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(toInputDate());
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/expenses', {
        amount: Number(amount),
        category,
        description,
        date,
        source: 'manual',
      });
      toast.success('Expense added');
      setOpen(false);
      setAmount('');
      setDescription('');
      onAdded();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="Quick add"
      action={
        <Button variant="outline" type="button" onClick={() => setOpen((v) => !v)}>
          {open ? 'Close' : 'New expense'}
        </Button>
      }
    >
      {open && (
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Amount ({currency})
            <input
              required
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="text-sm font-medium">
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
          <label className="text-sm font-medium sm:col-span-2">
            Description
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="text-sm font-medium">
            Date
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <div className="flex items-end">
            <Button className="w-full" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
