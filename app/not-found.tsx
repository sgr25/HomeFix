import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center" dir="rtl">
      <h2 className="text-xl font-bold text-slate-800 mb-2">הדף לא נמצא</h2>
      <p className="text-sm text-slate-500 mb-6">הדף שחיפשת אינו קיים.</p>
      <Button asChild>
        <Link href="/">חזרה ללוח הבקרה</Link>
      </Button>
    </div>
  );
}
