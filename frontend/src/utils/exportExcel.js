import { formatDate } from './format.js';

function csvValue(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function exportExpensesCsv(rows) {
  const headers = ['Date', 'Category', 'Shop', 'Description', 'Amount', 'Payment', 'Source'];
  const lines = rows.map((r) =>
    [
      formatDate(r.date),
      r.category,
      r.shopName,
      r.description,
      r.amount,
      r.paymentMethod,
      r.source,
    ]
      .map(csvValue)
      .join(',')
  );

  const csv = [headers.map(csvValue).join(','), ...lines].join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'expenses.csv';
  link.click();
  URL.revokeObjectURL(url);
}
