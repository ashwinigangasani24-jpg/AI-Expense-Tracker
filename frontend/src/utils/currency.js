/** Default display currency for the app */
export const DEFAULT_CURRENCY = 'INR';

export function getUserCurrency(user) {
  const c = user?.currency || DEFAULT_CURRENCY;
  // Legacy accounts created with USD default — show rupees unless user picked another currency
  if (c === 'USD') return DEFAULT_CURRENCY;
  return c;
}
