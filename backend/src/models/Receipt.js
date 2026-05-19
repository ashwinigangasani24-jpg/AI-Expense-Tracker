import mongoose from 'mongoose';

const extractedItemSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    lineTotal: { type: Number, default: 0 },
  },
  { _id: false }
);

const receiptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    /** SHA-256 of raw image bytes for duplicate detection */
    fileHash: { type: String, required: true, index: true },
    imageMimeType: { type: String, required: true },
    /** Stored image (GridFS alternative: keep under ~16MB BSON limit) */
    imageData: { type: Buffer, required: true },
    shopName: { type: String, default: '' },
    receiptDate: { type: Date },
    totalAmount: { type: Number },
    gstOrTax: { type: Number },
    paymentMethod: { type: String, default: '' },
    items: { type: [extractedItemSchema], default: [] },
    categoryGuess: { type: String, default: 'Other' },
    aiExplanation: { type: String, default: '' },
    structuredJson: { type: mongoose.Schema.Types.Mixed, default: {} },
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt', default: null },
    processingError: { type: String, default: '' },
  },
  { timestamps: true }
);

receiptSchema.index({ user: 1, fileHash: 1 });

export const Receipt = mongoose.model('Receipt', receiptSchema);
