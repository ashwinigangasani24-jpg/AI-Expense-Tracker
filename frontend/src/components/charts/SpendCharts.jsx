import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card } from '../Card.jsx';
import { formatMoney } from '../../utils/format.js';

const COLORS = ['#0b8ff0', '#22c55e', '#a855f7', '#f97316', '#eab308', '#14b8a6', '#f43f5e', '#64748b', '#38bdf8'];

export function CategoryPie({ data, currency }) {
  const chartData = (data || []).map((d) => ({ name: d.category, value: d.total }));
  return (
    <Card title="Spending by category">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie dataKey="value" data={chartData} innerRadius={60} outerRadius={90} paddingAngle={2}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [formatCur(v, currency), '']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function MonthlyBar({ data, currency }) {
  const chartData = (data || []).map((d) => ({ name: d.label, total: d.total }));
  return (
    <Card title="Monthly trend">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [formatCur(v, currency), 'Total']} />
            <Bar dataKey="total" fill="#0b8ff0" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function formatCur(v, currency) {
  return formatMoney(v, currency);
}
