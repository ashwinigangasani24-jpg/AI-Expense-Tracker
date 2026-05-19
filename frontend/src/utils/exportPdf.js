import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatMoney } from './format.js';
import { DEFAULT_CURRENCY } from './currency.js';

export function exportExpensesPdf(rows, currency = DEFAULT_CURRENCY) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Expense export', 14, 16);
  doc.setFontSize(10);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 24);

  const body = rows.map((r) => [
    formatDate(r.date),
    r.category,
    r.shopName || '',
    (r.description || '').slice(0, 60),
    formatMoney(r.amount, currency),
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['Date', 'Category', 'Shop', 'Description', 'Amount']],
    body,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [11, 143, 240] },
  });

  doc.save('expenses.pdf');
}
