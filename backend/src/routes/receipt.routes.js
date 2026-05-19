import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { protect } from '../middleware/auth.js';
import { uploadReceipt } from '../middleware/upload.js';
import { AppError } from '../utils/AppError.js';
import * as ctrl from '../controllers/receiptController.js';

const router = Router();
router.use(protect);

function uploadMiddleware(req, res, next) {
  uploadReceipt.single('image')(req, res, (err) => {
    if (err) {
      next(new AppError(err.message || 'Upload failed', 400));
    } else {
      next();
    }
  });
}

router.post('/upload', uploadMiddleware, asyncHandler(ctrl.uploadAndAnalyze));
router.get('/', asyncHandler(ctrl.listReceipts));
router.get('/:id/image', asyncHandler(ctrl.getReceiptImage));
router.get('/:id', asyncHandler(ctrl.getReceipt));

export default router;
