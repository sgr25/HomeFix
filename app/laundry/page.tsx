'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { WashingMachine, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { ClothingItem } from '@/types';

export default function LaundryPage() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () =>
    fetch('/api/clothes?status=laundry')
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      });

  useEffect(() => { load(); }, []);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const selectAll = () => setSelected(new Set(items.map((i) => i.id)));
  const clearAll  = () => setSelected(new Set());

  const markClean = async () => {
    if (!selected.size) return;
    setSaving(true);
    await Promise.all(
      [...selected].map((id) =>
        fetch(`/api/clothes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_closet' }),
        })
      )
    );
    setSaving(false);
    setSelected(new Set());
    load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <WashingMachine className="w-7 h-7 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">מעקב כביסה</h1>
            <p className="text-sm text-slate-500">
              {items.length} פריטים בכביסה
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>בחר הכל</Button>
          <Button variant="outline" size="sm" onClick={clearAll}>נקה בחירה</Button>
          <Button
            size="sm"
            disabled={!selected.size || saving}
            onClick={markClean}
            className="gap-1"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            החזר לארון ({selected.size})
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <WashingMachine className="w-14 h-14 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">אין בגדים בכביסה</p>
          <p className="text-sm">כל הבגדים נקיים ומסודרים!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => {
            const checked = selected.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                  checked
                    ? 'border-blue-500 shadow-md shadow-blue-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="relative h-36 bg-slate-100">
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.size} fill className="object-cover" sizes="180px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <span className="text-xs">ללא תמונה</span>
                    </div>
                  )}
                  {checked && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <CheckCheck className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-2 bg-white">
                  <p className="text-xs font-semibold text-slate-700">{item.size}</p>
                  {item.child_name && (
                    <Badge variant="secondary" className="text-[10px] mt-1">{item.child_name}</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
