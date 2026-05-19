/**
 * Offline receipt extraction when Gemini/OpenAI quota is exhausted (dev/demo only).
 */
export function buildDemoReceiptAnalysis() {
  const receiptDate = new Date().toISOString().slice(0, 10);
  return {
    shopName: '[Demo] Sample store — not from your image',
    receiptDate,
    totalAmount: 47.85,
    gstOrTax: 2.15,
    paymentMethod: 'Card',
    categoryGuess: 'Food',
    items: [
      { name: 'Groceries bundle', quantity: 1, unitPrice: 45.7, lineTotal: 45.7 },
    ],
    explanation:
      'Demo mode: AI quota was unavailable, so sample receipt data was used. Replace with a live Gemini key or disable demo fallback.',
    insights: ['Demo data — not from your actual receipt.'],
    savingsTips: ['Compare unit prices on packaged goods.', 'Use store loyalty programs when available.'],
    unusualFlags: [],
    _demo: true,
  };
}
