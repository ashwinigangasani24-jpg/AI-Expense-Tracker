import {
  getCategoryTotals,
  getMonthlyTotals,
  getRecentExpenses,
  getSummary,
} from '../services/analytics.service.js';
import { generateExpenseNarrative } from '../services/ai.service.js';

export async function dashboard(req, res) {
  const { from, to, ai } = req.query;
  const userId = req.userId;

  const [summary, categoryPie, monthly, recent] = await Promise.all([
    getSummary(userId),
    getCategoryTotals(userId, { from, to }),
    getMonthlyTotals(userId, 12),
    getRecentExpenses(userId, 8),
  ]);

  let aiBlock = null;
  if (ai === '1' || ai === 'true') {
    const statsText = JSON.stringify({
      summary,
      categoryPie,
      monthlyTail: monthly.slice(-3),
    });
    aiBlock = await generateExpenseNarrative(statsText);
  }

  res.json({
    success: true,
    data: {
      summary,
      categoryPie,
      monthly,
      recent,
      ai: aiBlock,
    },
  });
}

export async function analytics(req, res) {
  const { from, to, ai } = req.query;
  const userId = req.userId;
  const [summary, categoryPie, monthly, recent] = await Promise.all([
    getSummary(userId),
    getCategoryTotals(userId, { from, to }),
    getMonthlyTotals(userId, 18),
    getRecentExpenses(userId, 15),
  ]);

  const topCategories = [...categoryPie].sort((a, b) => b.total - a.total).slice(0, 5);

  let aiBlock = null;
  if (ai === '1' || ai === 'true') {
    aiBlock = await generateExpenseNarrative(
      JSON.stringify({ summary, categoryPie, topCategories })
    );
  }

  res.json({
    success: true,
    data: {
      summary,
      categoryPie,
      monthly,
      recent,
      topCategories,
      ai: aiBlock,
    },
  });
}
