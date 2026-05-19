import { useEffect, useState } from 'react';
import api from '../services/api.js';

/** Loads receipt image with auth header via blob URL. */
export function ReceiptImage({ receiptId, alt = 'Receipt', className = '' }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let objectUrl;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/receipts/${receiptId}/image`, { responseType: 'blob' });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setSrc(objectUrl);
      } catch {
        if (!cancelled) setSrc('');
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [receiptId]);

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-500 dark:bg-slate-800 ${className}`}
      >
        Preview
      </div>
    );
  }
  return <img src={src} alt={alt} className={`rounded-xl object-contain ${className}`} />;
}
