import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import receiptRoutes from './routes/receipt.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import userRoutes from './routes/user.routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { getAiStatus } from './services/ai.service.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

/** Root — browsers often open http://localhost:5000/ without /api */
app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'ai-expense-tracker-api',
    message: 'Use /api/* routes. See docs/API.md',
    health: '/api/health',
    examples: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      expenses: 'GET /api/expenses',
      uploadReceipt: 'POST /api/receipts/upload',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'ai-expense-tracker-api', ai: getAiStatus() });
});

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
