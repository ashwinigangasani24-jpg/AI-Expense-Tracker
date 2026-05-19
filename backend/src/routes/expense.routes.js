import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { protect } from '../middleware/auth.js';
import * as ctrl from '../controllers/expenseController.js';

const router = Router();
router.use(protect);

router.get('/meta', asyncHandler(ctrl.expenseMeta));
router.get('/', asyncHandler(ctrl.listExpenses));
router.get('/:id', asyncHandler(ctrl.getExpense));
router.post('/', asyncHandler(ctrl.createExpense));
router.patch('/:id', asyncHandler(ctrl.updateExpense));
router.delete('/:id', asyncHandler(ctrl.deleteExpense));

export default router;
