import { getMonthlyBreakdown, getYearlyBreakdown } from '../services/analytics.service.js';

export async function monthlyReport(req, res) {
  const year = Number(req.query.year) || new Date().getFullYear();
  const data = await getMonthlyBreakdown(req.userId, year);
  res.json({ success: true, year, data });
}

export async function yearlyReport(req, res) {
  const yearsBack = Math.min(20, Math.max(1, Number(req.query.yearsBack) || 5));
  const data = await getYearlyBreakdown(req.userId, yearsBack);
  res.json({ success: true, data });
}
