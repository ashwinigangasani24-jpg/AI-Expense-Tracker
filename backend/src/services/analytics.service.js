import mongoose from 'mongoose';
import { Expense, EXPENSE_CATEGORIES } from '../models/Expense.js';

function uid(userId) {
  return typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
}

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfYear(d) {
  const x = new Date(d);
  x.setMonth(0, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Aggregation helpers for dashboard & analytics endpoints.
 */
export async function getCategoryTotals(userId, { from, to }) {
  const match = { user: uid(userId) };
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);
  }
  const rows = await Expense.aggregate([
    { $match: match },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
  return rows.map((r) => ({ category: r._id, total: r.total, count: r.count }));
}

export async function getMonthlyTotals(userId, months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const rows = await Expense.aggregate([
    { $match: { user: uid(userId), date: { $gte: since } } },
    {
      $group: {
        _id: { y: { $year: '$date' }, m: { $month: '$date' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ]);

  return rows.map((r) => ({
    label: `${r._id.y}-${String(r._id.m).padStart(2, '0')}`,
    total: r.total,
  }));
}

export async function getRecentExpenses(userId, limit = 10) {
  return Expense.find({ user: userId })
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function getMonthlyBreakdown(userId, year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const rows = await Expense.aggregate([
    { $match: { user: uid(userId), date: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: { $month: '$date' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({ month: r._id, total: r.total, count: r.count }));
}

export async function getYearlyBreakdown(userId, yearsBack = 5) {
  const since = new Date();
  since.setFullYear(since.getFullYear() - (yearsBack - 1));
  since.setMonth(0, 1);
  since.setHours(0, 0, 0, 0);
  const rows = await Expense.aggregate([
    { $match: { user: uid(userId), date: { $gte: since } } },
    {
      $group: {
        _id: { $year: '$date' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({ year: r._id, total: r.total, count: r.count }));
}

export async function getSummary(userId) {
  const now = new Date();
  const mStart = startOfMonth(now);
  const yStart = startOfYear(now);

  const [monthAgg, yearAgg, allTime] = await Promise.all([
    Expense.aggregate([
      { $match: { user: uid(userId), date: { $gte: mStart } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: { user: uid(userId), date: { $gte: yStart } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: { user: uid(userId) } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  return {
    thisMonth: monthAgg[0]?.total || 0,
    thisMonthCount: monthAgg[0]?.count || 0,
    thisYear: yearAgg[0]?.total || 0,
    thisYearCount: yearAgg[0]?.count || 0,
    allTime: allTime[0]?.total || 0,
    allTimeCount: allTime[0]?.count || 0,
    categories: EXPENSE_CATEGORIES,
  };
}
