import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { protect } from '../middleware/auth.js';
import * as ctrl from '../controllers/analyticsController.js';

const router = Router();
router.use(protect);

router.get('/dashboard', asyncHandler(ctrl.dashboard));
router.get('/full', asyncHandler(ctrl.analytics));

export default router;
