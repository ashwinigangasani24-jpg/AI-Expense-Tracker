import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/Card.jsx';
import { CategoryPie, MonthlyBar } from '../components/charts/SpendCharts.jsx';
import { formatDate, formatMoney } from '../utils/format.js';
import { getUserCurrency } from '../utils/currency.js';
import { Button } from '../components/Button.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const currency = getUserCurrency(user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ai, setAi] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: res } = await api.get('/analytics/dashboard', { params: { ai: ai ? 1 : 0 } });
        if (!cancelled) setData(res.data);
      } catch (e) {
        if (!cancelled) toast.error(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ai]);

  if (loading || !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const { summary, categoryPie, monthly, recent } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Live analytics, receipt-backed expenses, and AI commentary.
          </p>
        </div>
        <Button variant="outline" type="button" onClick={() => setAi((v) => !v)}>
          {ai ? 'Hide AI narrative' : 'Show AI narrative'}
        </Button>
      </div>

      {data.ai && (
        <Card title="AI spending narrative">
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{data.ai.summary}</p>
          {!!data.ai.tips?.length && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {data.ai.tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="This month" value={formatMoney(summary.thisMonth, currency)} hint={`${summary.thisMonthCount} txs`} />
        <Stat label="This year" value={formatMoney(summary.thisYear, currency)} hint={`${summary.thisYearCount} txs`} />
        <Stat label="All time" value={formatMoney(summary.allTime, currency)} hint={`${summary.allTimeCount} txs`} />
        <Stat label="Top category" value={categoryPie[0]?.category || '—'} hint={categoryPie[0] ? formatMoney(categoryPie[0].total, currency) : ''} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryPie data={categoryPie} currency={currency} />
        <MonthlyBar data={monthly} currency={currency} />
      </div>

      <Card title="Recent transactions">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500">
                <th className="pb-2">Date</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent.map((r) => (
                <tr key={r._id} className="text-slate-700 dark:text-slate-200">
                  <td className="py-2">{formatDate(r.date)}</td>
                  <td className="py-2">{r.category}</td>
                  <td className="py-2">{r.description || r.shopName || '—'}</td>
                  <td className="py-2 text-right font-semibold">{formatMoney(r.amount, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
