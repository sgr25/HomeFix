'use client';

import { useState } from 'react';
import { Package, Shirt, WashingMachine, Loader2 } from 'lucide-react';
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
import { clothingTypeLabel, seasonLabel } from '@/lib/clothes-utils';
import type { GrowthScanResult } from '@/lib/growth-utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childName: string;
  oldSize: string;
  newSize: string;
  scan: GrowthScanResult | null;
  loading?: boolean;
  onLaundryDone?: () => void;
}

export default function GrowthModal({
  open,
  onOpenChange,
  childName,
  oldSize,
  newSize,
  scan,
  loading = false,
  onLaundryDone,
}: Props) {
  const [markingLaundry, setMarkingLaundry] = useState(false);

  const markOutdatedAsLaundry = async () => {
    if (!scan?.outdated_closet.item_ids.length) return;
    setMarkingLaundry(true);
    try {
      await fetchJson('/api/clothes/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: scan.outdated_closet.item_ids,
          updates: { status: 'laundry' },
        }),
      });
      notify.bulkUpdated(scan.outdated_closet.count);
      onLaundryDone?.();
      onOpenChange(false);
    } catch {
      notify.error();
    } finally {
      setMarkingLaundry(false);
    }
  };

  const hasBoxed = (scan?.boxed.length ?? 0) > 0;
  const hasOutdated = (scan?.outdated_closet.count ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">עדכון מידה — {childName}</DialogTitle>
          <DialogDescription className="text-right">
            המידה עודכנה מ-{oldSize} ל-{newSize}. הנה סיכום המלאי הרלוונטי:
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">סורק מלאי...</span>
          </div>
        ) : scan ? (
          <div className="space-y-5">
            {/* Section A: boxed items in new size */}
            <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
              <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                <Package className="w-4 h-4" />
                בגדים במידה {newSize} בקופסאות
              </h3>
              {hasBoxed ? (
                <ul className="space-y-3">
                  {scan.boxed.map((box) => (
                    <li key={box.box_id} className="bg-white rounded-lg border border-blue-100 p-3 space-y-1.5">
                      <p className="text-sm font-medium text-slate-800">{box.summary_he}</p>
                      <ul className="text-xs text-slate-600 space-y-0.5 pr-2">
                        {box.items.map((item, i) => (
                          <li key={i}>
                            {clothingTypeLabel[item.clothing_type].replace(/[^\u0590-\u05FF\s/a-zA-Z]/g, '').trim()}
                            {' · '}
                            {seasonLabel[item.season]}
                            {' — '}
                            {item.count} פריטים
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600">
                  לא נמצאו בגדים במידה {newSize} בארגזי אחסון.
                </p>
              )}
            </section>

            {/* Section B: outdated closet items */}
            <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
              <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                <Shirt className="w-4 h-4" />
                בגדים קטנים בארון
              </h3>
              <p className="text-sm text-slate-700">{scan.outdated_closet.summary_he}</p>
              {hasOutdated && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-amber-300 text-amber-900 hover:bg-amber-100"
                  disabled={markingLaundry}
                  onClick={markOutdatedAsLaundry}
                >
                  {markingLaundry ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <WashingMachine className="w-3.5 h-3.5" />
                  )}
                  סמן בגדים ישנים אלו כ&apos;בכביסה&apos; לקראת אריזה מחדש
                </Button>
              )}
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
