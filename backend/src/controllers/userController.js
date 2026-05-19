import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export async function updateProfile(req, res) {
  const { name, currency, avatarUrl } = req.body;
  const user = await User.findById(req.userId);
  if (!user) throw new AppError('User not found', 404);

  if (name !== undefined) user.name = String(name).trim() || user.name;
  if (currency !== undefined) user.currency = String(currency).trim().slice(0, 8) || user.currency;
  if (avatarUrl !== undefined) user.avatarUrl = String(avatarUrl).trim().slice(0, 500);

  await user.save();
  res.json({ success: true, user: user.toSafeObject() });
}
