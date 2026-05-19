import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { protect } from '../middleware/auth.js';
import * as ctrl from '../controllers/reportsController.js';

const router = Router();
router.use(protect);

router.get('/monthly', asyncHandler(ctrl.monthlyReport));
router.get('/yearly', asyncHandler(ctrl.yearlyReport));

export default router;
