import '../config/env.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Expense, EXPENSE_CATEGORIES } from '../models/Expense.js';

/**
 * Optional seed script — creates a demo user and sample expenses.
 * Run: npm run seed (from backend/)
 */
async function seed() {
  await connectDB();

  const email = 'demo@example.com';
  await User.deleteMany({ email });
  await Expense.deleteMany({});

  const passwordHash = await bcrypt.hash('demo12345', 12);
  const user = await User.create({
    name: 'Demo User',
    email,
    passwordHash,
    currency: 'INR',
  });

  const now = new Date();
  const samples = [];
  for (let i = 0; i < 24; i += 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 3);
    samples.push({
      user: user._id,
      amount: Math.round(15 + Math.random() * 180),
      category: EXPENSE_CATEGORIES[i % EXPENSE_CATEGORIES.length],
      description: `Sample expense ${i + 1}`,
      date: d,
      paymentMethod: i % 2 === 0 ? 'Card' : 'Cash',
      shopName: `Store ${(i % 5) + 1}`,
      gstOrTax: Math.round(Math.random() * 5),
      items: [{ name: 'Item A', quantity: 1, unitPrice: 10, lineTotal: 10 }],
      source: 'manual',
    });
  }
  await Expense.insertMany(samples);

  console.log('Seed complete.');
  console.log('Login:', email, '/ demo12345');
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
