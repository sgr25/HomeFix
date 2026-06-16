'use client';

import { useState } from 'react';
import { ShoppingBag, Loader2, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { fetchJson } from '@/lib/api';
import { notify } from '@/lib/toast';
import type { ShoppingGapsReport } from '@/lib/shopping-gaps-utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShoppingGapsReport({ open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<(ShoppingGapsReport & { narrative?: string }) | null>(null);
  const [error, setError] = useState('');

  const generate = async (withNarrative = false) => {
    setLoading(true);
    setError('');
    try {
      const url = withNarrative
        ? '/api/reports/shopping-gaps?narrative=true'
        : '/api/reports/shopping-gaps';
      const data = await fetchJson<ShoppingGapsReport & { narrative?: string }>(url, { method: 'POST' });
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת הדוח');
      notify.error();
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (v && !report && !loading) {
      generate(false);
    }
    if (!v) {
      setReport(null);
      setError('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            מה יש ומה צריך? — דוח חוסרים לקניות
          </DialogTitle>
          <DialogDescription>
            סיכום מלאי לפי ילד, עונה וסוג בגד — כולל פריטים בארון, בכביסה ובארגזים
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" disabled={loading} onClick={() => generate(false)} className="gap-1.5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
            רענן דוח
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => generate(true)}
            className="gap-1.5 border-violet-300 text-violet-700"
          >
            <Sparkles className="w-4 h-4" />
            הוסף המלצות AI
          </Button>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading && !report && (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">מנתח מלאי...</span>
          </div>
        )}

        {report && (
          <div className="space-y-6">
            {report.children.length === 0 ? (
              <p className="text-sm text-slate-600">
                אין ילדים עם מידה נוכחית מוגדרת. הגדר מידה לכל ילד במסך הילדים.
              </p>
            ) : (
              report.children.map((child) => (
                <section key={child.name} className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100">
                    <h3 className="font-bold text-slate-800">
                      {child.name}
                    </h3>
                    <p className="text-xs text-emerald-700">מידה נוכחית: {child.current_size}</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {child.seasons.map((season) => (
                      <div key={season.season} className="px-4 py-3">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">
                          מלאי {season.season_label} קיים:
                        </h4>
                        <ul className="space-y-1">
                          {season.categories.map((cat) => (
                            <li key={cat.clothing_type} className="text-sm text-slate-600 flex justify-between gap-4">
                              <span>{cat.label}:</span>
                              <span className={cat.count === 0 ? 'text-red-600 font-medium' : 'font-medium text-slate-800'}>
                                {cat.count} פריטים במערכת
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              ))
            )}

            {report.narrative && (
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                <h4 className="text-sm font-bold text-violet-900 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  המלצות קניה
                </h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{report.narrative}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
