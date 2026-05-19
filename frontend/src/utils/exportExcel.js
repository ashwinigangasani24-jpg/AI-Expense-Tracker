import * as XLSX from 'xlsx';
import { formatDate } from './format.js';

export function exportExpensesExcel(rows) {
  const data = rows.map((r) => ({
    Date: formatDate(r.date),
    Category: r.category,
    Shop: r.shopName,
    Description: r.description,
    Amount: r.amount,
    Payment: r.paymentMethod,
    Source: r.source,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
  XLSX.writeFile(wb, 'expenses.xlsx');
}
