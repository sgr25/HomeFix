'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import ClothingCard from '@/components/inventory/ClothingCard';
import FilterBar from '@/components/inventory/FilterBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { Child, Box, ClothingItem } from '@/types';

interface Filters { child: string; season: string; status: string; }

export default function InventoryPage() {
  const [items, setItems]       = useState<ClothingItem[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [boxes, setBoxes]       = useState<Box[]>([]);
  const [filters, setFilters]   = useState<Filters>({ child: '', season: '', status: '' });
  const [setsForAll, setSetsForAll] = useState(false);
  const [loading, setLoading]   = useState(true);

  // Smart search state
  const [smartQuery, setSmartQuery]     = useState('');
  const [smartResults, setSmartResults] = useState<ClothingItem[] | null>(null);
  const [smartLoading, setSmartLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/children').then((r) => r.json()),
      fetch('/api/boxes').then((r) => r.json()),
    ]).then(([c, b]) => {
      setChildren(Array.isArray(c) ? c : []);
      setBoxes(Array.isArray(b) ? b : []);
    });
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (setsForAll) {
      params.set('sets_for_all', 'true');
    } else {
      if (filters.child)  params.set('child', filters.child);
      if (filters.season) params.set('season', filters.season);
      if (filters.status) params.set('status', filters.status);
    }
    fetch(`/api/clothes?${params}`)
      .then((r) => r.json())
      .then((d) => { setItems(Array.isArray(d) ? d : []); setLoading(false); });
  }, [filters, setsForAll]);

  useEffect(() => {
    if (smartResults === null) load();
  }, [load, smartResults]);

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק פריט זה לצמיתות?')) return;
    await fetch(`/api/clothes/${id}`, { method: 'DELETE' });
    if (smartResults !== null) {
      setSmartResults((prev) => prev?.filter((i) => i.id !== id) ?? null);
    } else {
      load();
    }
  };

  const handleEdit = async (id: string, updates: Partial<ClothingItem>) => {
    await fetch(`/api/clothes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (smartResults !== null) {
      setSmartResults((prev) =>
        prev?.map((i) => (i.id === id ? { ...i, ...updates } : i)) ?? null
      );
    } else {
      load();
    }
  };

  const handleSmartSearch = async () => {
    const q = smartQuery.trim();
    if (!q) return;
    setSmartLoading(true);
    setSmartResults(null);
    try {
      const res = await fetch('/api/search/smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const { items: found } = await res.json();
      setSmartResults(Array.isArray(found) ? found : []);
    } catch {
      setSmartResults([]);
    }
    setSmartLoading(false);
  };

  const clearSmartSearch = () => {
    setSmartQuery('');
    setSmartResults(null);
    searchInputRef.current?.focus();
  };

  const displayItems = smartResults !== null ? smartResults : items;
  const isSmartMode  = smartResults !== null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">מלאי בגדים</h1>
        <p className="text-sm text-slate-500">
          {isSmartMode
            ? `${displayItems.length} תוצאות לחיפוש: "${smartQuery}"`
            : `${displayItems.length} פריטים נמצאו`}
        </p>
      </div>

      {/* Smart search bar */}
      <div className="flex items-center gap-2" dir="rtl">
        <div className="relative flex-1 max-w-xl">
          <input
            ref={searchInputRef}
            type="text"
            value={smartQuery}
            onChange={(e) => setSmartQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSmartSearch()}
            placeholder="חיפוש חכם בשפה חופשית (למשל: הבגדים של דני לחורף)..."
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white shadow-sm"
            dir="rtl"
          />
          {isSmartMode && (
            <button
              onClick={clearSmartSearch}
              className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSmartSearch}
          disabled={smartLoading || !smartQuery.trim()}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl shadow-sm"
        >
          {smartLoading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Search className="w-4 h-4" />}
          {smartLoading ? 'מחפש...' : 'חיפוש'}
        </Button>
        {isSmartMode && (
          <Button variant="outline" onClick={clearSmartSearch} className="gap-1 text-sm">
            <X className="w-3.5 h-3.5" />
            נקה חיפוש
          </Button>
        )}
      </div>

      {/* Filters (hidden while smart search is active) */}
      {!isSmartMode && (
        <FilterBar
          children={children}
          filters={filters}
          onChange={setFilters}
          setsForAll={setsForAll}
          onSetsForAllChange={setSetsForAll}
        />
      )}

      {/* Smart loading skeleton */}
      {smartLoading ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>הבינה המלאכותית מנתחת את השאילתה...</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="w-40 h-56 rounded-xl" />)}
          </div>
        </div>
      ) : loading && !isSmartMode ? (
        <div className="flex flex-wrap gap-4">
          {[...Array(12)].map((_, i) => <Skeleton key={i} className="w-40 h-56 rounded-xl" />)}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg">
            {isSmartMode ? 'לא נמצאו פריטים התואמים לחיפוש' : 'לא נמצאו פריטים'}
          </p>
          <p className="text-sm">
            {isSmartMode ? 'נסה לנסח את החיפוש בצורה אחרת' : 'נסה לשנות את הסינון'}
          </p>
        </div>
      ) : (
        <>
          {isSmartMode && (
            <p className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 w-fit">
              מציג תוצאות חיפוש חכם — לחץ "נקה חיפוש" לחזרה למלאי הרגיל
            </p>
          )}
          {setsForAll && !isSmartMode && (
            <p className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 w-fit">
              מציג סטים שיש לכולם לפחות פריט אחד בארון
            </p>
          )}
          <div className="flex flex-wrap gap-4">
            {displayItems.map((item) => (
              <ClothingCard
                key={item.id}
                item={item}
                boxes={boxes}
                allChildren={children}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
