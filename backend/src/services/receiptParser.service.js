function parseAmount(raw) {
  if (raw == null) return 0;
  const n = parseFloat(String(raw).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

function findGrandTotal(text) {
  const patterns = [
    /grand\s*total[^\d]{0,40}?(?:INR|Rs\.?|₹)?\s*([\d,]+\.?\d*)/gi,
    /total\s*(?:amount|payable)?[^\d]{0,30}?(?:INR|Rs\.?|₹)?\s*([\d,]+\.?\d*)/gi,
    /amount\s*paid[^\d]{0,20}?(?:INR|Rs\.?|₹)?\s*([\d,]+\.?\d*)/gi,
    /(?:INR|Rs\.?|₹)\s*([\d,]+\.\d{2})/gi,
  ];

  const candidates = [];
  for (const re of patterns) {
    let m;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(text)) !== null) {
      const v = parseAmount(m[1]);
      if (v > 0) candidates.push(v);
    }
  }

  if (candidates.length) {
    const grand = text.toLowerCase().lastIndexOf('grand total');
    if (grand >= 0) {
      const slice = text.slice(grand, grand + 120);
      const m = slice.match(/([\d,]+\.\d{2})/);
      if (m) return parseAmount(m[1]);
    }
    return Math.max(...candidates.filter((n) => n < 5_000_000));
  }

  const loose = [...text.matchAll(/\b(\d{1,3}(?:,\d{3})*\.\d{2})\b/g)].map((m) => parseAmount(m[1]));
  if (loose.length) return Math.max(...loose.filter((n) => n > 0 && n < 5_000_000));
  return 0;
}

function findGstTotal(text) {
  let sum = 0;
  const taxRe = /(?:CGST|SGST|IGST|GST)[^%\d]*(?:@)?\s*[\d.]+%?\s*[^\d]*([\d,]+\.?\d*)/gi;
  let m;
  while ((m = taxRe.exec(text)) !== null) {
    sum += parseAmount(m[1]);
  }
  return sum;
}

function findDate(text) {
  const m = text.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/);
  if (!m) return new Date().toISOString().slice(0, 10);
  let [, d, mo, y] = m;
  if (y.length === 2) y = `20${y}`;
  const iso = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return new Date().toISOString().slice(0, 10);
  return iso;
}

function guessShop(text, lines) {
  const lower = text.toLowerCase();
  const brands = [
    ['goibibo', 'goibibo'],
    ['paytm', 'Paytm'],
    ['makemytrip', 'MakeMyTrip'],
    ['swiggy', 'Swiggy'],
    ['zomato', 'Zomato'],
    ['amazon', 'Amazon'],
    ['flipkart', 'Flipkart'],
    ['irctc', 'IRCTC'],
    ['uber', 'Uber'],
    ['ola', 'Ola'],
    ['vetri travels', 'Vetri Travels'],
  ];
  for (const [key, label] of brands) {
    if (lower.includes(key)) return label;
  }
  const skip = /invoice|tax|receipt|bill|date|total|gst|booking/i;
  for (const line of lines.slice(0, 8)) {
    if (line.length > 3 && line.length < 60 && !skip.test(line)) {
      return line;
    }
  }
  return lines[0]?.slice(0, 50) || 'Receipt';
}

function guessCategory(text, shopName) {
  const t = `${text} ${shopName}`.toLowerCase();
  if (/bus|travel|flight|train|goibibo|makemytrip|irctc|hotel|vetri/i.test(t)) return 'Travel';
  if (/food|restaurant|swiggy|zomato|cafe|grocery|mart/i.test(t)) return 'Food';
  if (/fuel|petrol|diesel|transport|uber|ola|metro/i.test(t)) return 'Transport';
  if (/medical|pharmacy|health|hospital/i.test(t)) return 'Health';
  if (/amazon|flipkart|shopping|mart/i.test(t)) return 'Shopping';
  if (/electric|water|broadband|bill|recharge/i.test(t)) return 'Bills';
  return 'Other';
}

function guessPayment(text) {
  const t = text.toLowerCase();
  if (/upi|gpay|phonepe|paytm/i.test(t)) return 'UPI';
  if (/card|visa|mastercard|credit|debit/i.test(t)) return 'Card';
  if (/cash/i.test(t)) return 'Cash';
  return '';
}

/**
 * Turns raw OCR text into the same shape as AI vision output.
 */
export function parseReceiptOcrText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  const shopName = guessShop(text, lines);
  const totalAmount = findGrandTotal(text);
  const gstOrTax = findGstTotal(text);
  const receiptDate = findDate(text);
  const paymentMethod = guessPayment(text);
  const categoryGuess = guessCategory(text, shopName);

  return {
    shopName,
    receiptDate,
    totalAmount,
    gstOrTax,
    paymentMethod,
    categoryGuess,
    items: [],
    explanation: `Extracted from your receipt image using OCR (read ${lines.length} text lines). Merchant: ${shopName}, total ₹${totalAmount}.`,
    insights: ['Amounts were parsed automatically from the uploaded image text.'],
    savingsTips: [],
    unusualFlags: totalAmount <= 0 ? ['Could not find a clear total — verify the amount.'] : [],
  };
}
