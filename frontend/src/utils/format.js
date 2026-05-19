import { DEFAULT_CURRENCY } from './currency.js';

function localeForCurrency(currency) {
  if (currency === 'INR') return 'en-IN';
  if (currency === 'USD') return 'en-US';
  return undefined;
}

export function formatMoney(amount, currency = DEFAULT_CURRENCY) {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(localeForCurrency(currency), {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'INR' ? 2 : 2,
    }).format(value);
  } catch {
    if (currency === 'INR') return `₹${value.toFixed(2)}`;
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatDate(d) {
  if (!d) return '';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  return x.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function toInputDate(d) {
  const x = d ? new Date(d) : new Date();
  return x.toISOString().slice(0, 10);
}
