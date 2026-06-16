'use client';

import { useState, useEffect } from 'react';
import BoxCard from '@/components/boxes/BoxCard';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { fetchJson } from '@/lib/api';
import { notify } from '@/lib/toast';
import type { Box, ClothingItem } from '@/types';

export default function BoxesPage() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBoxNum, setNewBoxNum] = useState('');
  const [newBoxDesc, setNewBoxDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const load = () =>
    Promise.all([
      fetchJson<Box[]>('/api/boxes'),
      fetchJson<ClothingItem[]>('/api/clothes?status=in_box'),
    ]).then(([b, c]) => {
      setBoxes(Array.isArray(b) ? b : []);
      setClothes(Array.isArray(c) ? c : []);
      setLoading(false);
    }).catch(() => { setLoading(false); notify.error(); });

  useEffect(() => { load(); }, []);

  const createBox = async () => {
    if (!newBoxNum) return;
    setCreating(true);
    try {
      await fetchJson('/api/boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ box_number: Number(newBoxNum), description: newBoxDesc || null }),
      });
      notify.saved('הקופסה נוצרה');
      setNewBoxNum('');
      setNewBoxDesc('');
      load();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : undefined);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6" dir="rtl">
      <PageHeader title="קופסאות אחסון" description="ניהול קופסאות ותוכנן" />

      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-slate-500 block mb-1">מספר קופסה חדשה</label>
          <input
            type="number"
            min={1}
            value={newBoxNum}
            onChange={(e) => setNewBoxNum(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="מס׳"
          />
        </div>
        <div className="flex-1 min-w-40">
          <label className="text-xs text-slate-500 block mb-1">תיאור מיקום (אופציונלי)</label>
          <input
            type="text"
            value={newBoxDesc}
            onChange={(e) => setNewBoxDesc(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="למשל: עלייה, מחסן..."
          />
        </div>
        <Button onClick={createBox} disabled={creating || !newBoxNum} className="gap-1">
          <Plus className="w-4 h-4" />
          צור קופסה
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : boxes.length === 0 ? (
        <EmptyState title="אין קופסאות עדיין" description="צור קופסה ראשונה למעלה" />
      ) : (
        <div className="space-y-3">
          {boxes.map((box) => (
            <BoxCard
              key={box.id}
              box={box}
              items={clothes.filter((c) => c.box_id === box.id)}
              onUpdated={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
