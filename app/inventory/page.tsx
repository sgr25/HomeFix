'use client';

import { useState, useEffect, useCallback } from 'react';
import ClothingCard from '@/components/inventory/ClothingCard';
import FilterBar from '@/components/inventory/FilterBar';
import { Skeleton } from '@/components/ui/skeleton';
import type { Child, ClothingItem } from '@/types';

interface Filters { child: string; season: string; status: string; }

export default function InventoryPage() {
  const [items, setItems]     = useState<ClothingItem[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [filters, setFilters] = useState<Filters>({ child: '', season: '', status: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/children').then((r) => r.json()).then((d) => setChildren(Array.isArray(d) ? d : []));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.child)  params.set('child', filters.child);
    if (filters.season) params.set('season', filters.season);
    if (filters.status) params.set('status', filters.status);
    fetch(`/api/clothes?${params}`)
      .then((r) => r.json())
      .then((d) => { setItems(Array.isArray(d) ? d : []); setLoading(false); });
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק פריט זה לצמיתות?')) return;
    await fetch(`/api/clothes/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">מלאי בגדים</h1>
        <p className="text-sm text-slate-500">{items.length} פריטים נמצאו</p>
      </div>

      <FilterBar children={children} filters={filters} onChange={setFilters} />

      {loading ? (
        <div className="flex flex-wrap gap-4">
          {[...Array(12)].map((_, i) => <Skeleton key={i} className="w-40 h-56 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg">לא נמצאו פריטים</p>
          <p className="text-sm">נסה לשנות את הסינון</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {items.map((item) => (
            <ClothingCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
