import multer from 'multer';

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const allowed = /^image\/(jpeg|png|webp|gif)$/;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
  }
}

const maxMb = Number(process.env.MAX_FILE_MB || 8);

export const uploadReceipt = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxMb * 1024 * 1024 },
});
