'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center" dir="rtl">
      <h2 className="text-xl font-bold text-slate-800 mb-2">משהו השתבש</h2>
      <p className="text-sm text-slate-500 mb-6">אירעה שגיאה בלתי צפויה. נסה שוב.</p>
      <Button onClick={reset}>נסה שוב</Button>
    </div>
  );
}
