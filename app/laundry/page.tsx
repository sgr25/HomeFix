'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { WashingMachine, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { fetchJson } from '@/lib/api';
import { notify } from '@/lib/toast';
import type { ClothingItem } from '@/types';

export default function LaundryPage() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () =>
    fetchJson<ClothingItem[]>('/api/clothes?status=laundry')
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => { setLoading(false); notify.error(); });

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
    try {
      await fetchJson('/api/clothes/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected], updates: { status: 'in_closet' } }),
      });
      notify.bulkUpdated(selected.size);
      setSelected(new Set());
      load();
    } catch {
      notify.error();
    }
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      <PageHeader
        title="מעקב כביסה"
        description={`${items.length} פריטים בכביסה`}
        icon={<WashingMachine className="w-7 h-7 text-blue-500" />}
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={selectAll}>בחר הכל</Button>
            <Button variant="outline" size="sm" onClick={clearAll}>נקה בחירה</Button>
            <Button size="sm" disabled={!selected.size || saving} onClick={markClean} className="gap-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
              החזר לארון ({selected.size})
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<WashingMachine className="w-14 h-14" />}
          title="אין בגדים בכביסה"
          description="כל הבגדים נקיים ומסודרים!"
        />
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
