import { AppError } from '../utils/AppError.js';

/**
 * Central error handler — returns JSON errors consistently.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Something went wrong';

  if (process.env.NODE_ENV !== 'production' && status === 500) {
    console.error(err);
  }

  res.status(status).json({
    success: false,
    message,
    ...(err.details ? { details: err.details } : {}),
  });
}

export function notFound(req, res) {
  const hint =
    req.path.startsWith('/api') === false
      ? 'All endpoints are under /api — try GET /api/health'
      : 'Check method and path in docs/API.md';

  res.status(404).json({
    success: false,
    message: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    hint,
  });
}

export { AppError };
