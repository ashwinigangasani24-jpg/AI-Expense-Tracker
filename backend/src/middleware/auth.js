import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Validates Bearer JWT and attaches req.userId / req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) {
    throw new AppError('Not authorized', 401);
  }
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
  const user = await User.findById(payload.sub);
  if (!user) {
    throw new AppError('User not found', 401);
  }
  req.userId = user._id.toString();
  req.user = user;
  next();
});
