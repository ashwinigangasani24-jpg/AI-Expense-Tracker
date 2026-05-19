import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { protect } from '../middleware/auth.js';
import * as ctrl from '../controllers/userController.js';

const router = Router();
router.use(protect);

router.patch('/profile', asyncHandler(ctrl.updateProfile));

export default router;
