import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { Card } from '../components/Card.jsx';
import { CategoryPie, MonthlyBar } from '../components/charts/SpendCharts.jsx';
import { formatMoney } from '../utils/format.js';
import { getUserCurrency } from '../utils/currency.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/Button.jsx';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const currency = getUserCurrency(user);
  const [data, setData] = useState(null);
  const [reports, setReports] = useState({ monthly: null, yearly: null });
  const [loading, setLoading] = useState(true);
  const [ai, setAi] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [full, m, y] = await Promise.all([
          api.get('/analytics/full', { params: { ai: ai ? 1 : 0 } }),
          api.get('/reports/monthly', { params: { year: new Date().getFullYear() } }),
          api.get('/reports/yearly', { params: { yearsBack: 6 } }),
        ]);
        if (!cancelled) {
          setData(full.data.data);
          setReports({ monthly: m.data.data, yearly: y.data.data });
        }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Category concentration, cadence, and AI commentary on your trends.
          </p>
        </div>
        <Button variant="outline" type="button" onClick={() => setAi((v) => !v)}>
          {ai ? 'AI on' : 'AI off'}
        </Button>
      </div>

      {data.ai && (
        <Card title="Natural language summary">
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{data.ai.summary}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500">Savings ideas</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {(data.ai.tips || []).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500">Pattern watch</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {(data.ai.patterns || []).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <MiniStat title="Top category" value={data.topCategories[0]?.category || '—'} sub={data.topCategories[0] ? formatMoney(data.topCategories[0].total, currency) : ''} />
        <MiniStat
          title="This month"
          value={formatMoney(data.summary.thisMonth, currency)}
          sub={`${data.summary.thisMonthCount} transactions`}
        />
        <MiniStat
          title="This year"
          value={formatMoney(data.summary.thisYear, currency)}
          sub={`${data.summary.thisYearCount} transactions`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryPie data={data.categoryPie} currency={currency} />
        <MonthlyBar data={data.monthly} currency={currency} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Monthly report (current year)">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="pb-2">Month</th>
                <th className="pb-2 text-right">Total</th>
                <th className="pb-2 text-right">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(reports.monthly || []).map((r) => (
                <tr key={r.month}>
                  <td className="py-2">{r.month}</td>
                  <td className="py-2 text-right font-semibold">{formatMoney(r.total, currency)}</td>
                  <td className="py-2 text-right text-slate-500">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Yearly totals">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="pb-2">Year</th>
                <th className="pb-2 text-right">Total</th>
                <th className="pb-2 text-right">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(reports.yearly || []).map((r) => (
                <tr key={r.year}>
                  <td className="py-2">{r.year}</td>
                  <td className="py-2 text-right font-semibold">{formatMoney(r.total, currency)}</td>
                  <td className="py-2 text-right text-slate-500">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ title, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 font-display text-xl font-bold text-slate-900 dark:text-white">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
