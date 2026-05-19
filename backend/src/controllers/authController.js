import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/jwt.js';

export async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required');
  }
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters');
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    throw new AppError('Email already registered', 409);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
  });
  const token = signToken(user._id);
  res.status(201).json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError('Email and password are required');
  }
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError('Invalid credentials', 401);
  }
  const token = signToken(user._id);
  res.json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
}

export async function me(req, res) {
  res.json({ success: true, user: req.user.toSafeObject() });
}
