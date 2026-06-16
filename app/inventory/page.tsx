'use client';

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, X, Loader2, Sparkles, CheckSquare, Square, Trash2, WashingMachine, Shirt } from 'lucide-react';
import ClothingCard from '@/components/inventory/ClothingCard';
import FilterBar from '@/components/inventory/FilterBar';
import AddClothingDialog from '@/components/inventory/AddClothingDialog';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchJson } from '@/lib/api';
import { filterClothes, sortClothes, clothingToPayload, type SortKey } from '@/lib/clothes-utils';
import { notify } from '@/lib/toast';
import type { Child, Box, ClothingItem, ClothingStatus } from '@/types';

interface Filters { child: string; season: string; status: string; }

const VALID_STATUSES: ClothingStatus[] = ['in_closet', 'laundry', 'in_box'];

function parseStatusParam(value: string | null): string {
  return value && VALID_STATUSES.includes(value as ClothingStatus) ? value : '';
}

function InventoryContent() {
  const searchParams = useSearchParams();
  const statusFromUrl = parseStatusParam(searchParams.get('status'));

  const [items, setItems] = useState<ClothingItem[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [filters, setFilters] = useState<Filters>({ child: '', season: '', status: statusFromUrl });
  const [setsForAll, setSetsForAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('updated_at');

  const [quickQuery, setQuickQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [smartQuery, setSmartQuery] = useState('');
  const [smartResults, setSmartResults] = useState<ClothingItem[] | null>(null);
  const [smartLoading, setSmartLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(quickQuery), 300);
    return () => clearTimeout(t);
  }, [quickQuery]);

  useEffect(() => {
    setFilters((prev) => (prev.status === statusFromUrl ? prev : { ...prev, status: statusFromUrl }));
  }, [statusFromUrl]);

  useEffect(() => {
    Promise.all([
      fetchJson<Child[]>('/api/children'),
      fetchJson<Box[]>('/api/boxes'),
    ]).then(([c, b]) => {
      setChildren(Array.isArray(c) ? c : []);
      setBoxes(Array.isArray(b) ? b : []);
    }).catch(() => notify.error());
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (setsForAll) {
      params.set('sets_for_all', 'true');
    } else {
      if (filters.child) params.set('child', filters.child);
      if (filters.season) params.set('season', filters.season);
      if (filters.status) params.set('status', filters.status);
    }
    fetchJson<ClothingItem[]>(`/api/clothes?${params}`)
      .then((d) => { setItems(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setLoading(false); notify.error(); });
  }, [filters, setsForAll]);

  useEffect(() => {
    if (smartResults === null) load();
  }, [load, smartResults]);

  const handleDelete = async (id: string) => {
    const item = [...items, ...(smartResults ?? [])].find((i) => i.id === id);
    if (!item) return;

    try {
      await fetchJson(`/api/clothes/${id}`, { method: 'DELETE' });
      if (smartResults !== null) {
        setSmartResults((prev) => prev?.filter((i) => i.id !== id) ?? null);
      } else {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
      notify.itemDeleted(async () => {
        await fetchJson('/api/clothes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clothingToPayload(item)),
        });
        load();
        notify.saved('הפריט שוחזר');
      });
    } catch {
      notify.error('שגיאה במחיקה');
    }
  };

  const handleEdit = async (id: string, updates: Partial<ClothingItem>): Promise<ClothingItem> => {
    const updated = await fetchJson<ClothingItem>(`/api/clothes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const applyUpdate = (list: ClothingItem[]) =>
      list.map((i) => (i.id === id ? updated : i));
    if (smartResults !== null) {
      setSmartResults((prev) => (prev ? applyUpdate(prev) : null));
    } else {
      setItems((prev) => applyUpdate(prev));
    }
    notify.itemSaved();
    return updated;
  };

  const handleSmartSearch = async () => {
    const q = smartQuery.trim();
    if (!q) return;
    setSmartLoading(true);
    setSmartResults(null);
    try {
      const { items: found } = await fetchJson<{ items: ClothingItem[] }>('/api/search/smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      setSmartResults(Array.isArray(found) ? found : []);
    } catch {
      setSmartResults([]);
      notify.error('שגיאה בחיפוש');
    }
    setSmartLoading(false);
  };

  const clearSmartSearch = () => {
    setSmartQuery('');
    setSmartResults(null);
    searchInputRef.current?.focus();
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const bulkUpdate = async (updates: Record<string, unknown>) => {
    if (!selected.size) return;
    setBulkSaving(true);
    try {
      await fetchJson('/api/clothes/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected], updates }),
      });
      notify.bulkUpdated(selected.size);
      setSelected(new Set());
      setSelectMode(false);
      if (smartResults !== null) handleSmartSearch();
      else load();
    } catch {
      notify.error();
    }
    setBulkSaving(false);
  };

  const bulkDelete = async () => {
    if (!selected.size) return;
    setBulkSaving(true);
    try {
      await fetchJson('/api/clothes/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected] }),
      });
      notify.deleted(`${selected.size} פריטים נמחקו`);
      setSelected(new Set());
      setSelectMode(false);
      if (smartResults !== null) handleSmartSearch();
      else load();
    } catch {
      notify.error();
    }
    setBulkSaving(false);
  };

  const baseItems = smartResults !== null ? smartResults : items;
  const isSmartMode = smartResults !== null;

  const displayItems = useMemo(() => {
    const filtered = isSmartMode ? baseItems : filterClothes(baseItems, debouncedQuery);
    return sortClothes(filtered, sortKey);
  }, [baseItems, debouncedQuery, isSmartMode, sortKey]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5" dir="rtl">
      <PageHeader
        title="בגדים"
        description={
          isSmartMode
            ? `${displayItems.length} תוצאות לחיפוש AI: "${smartQuery}"`
            : `${displayItems.length} פריטים${debouncedQuery ? ` (מסונן: "${debouncedQuery}")` : ''}`
        }
        action={
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
              className="gap-1"
            >
              {selectMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {selectMode ? 'ביטול בחירה' : 'בחר פריטים'}
            </Button>
            <AddClothingDialog childrenList={children} boxes={boxes} onSaved={load} />
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xl">
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="חיפוש מהיר (מידה, סט, ילד)..."
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white shadow-sm"
            dir="rtl"
            disabled={isSmartMode}
          />
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-xl">
          <input
            ref={searchInputRef}
            type="text"
            value={smartQuery}
            onChange={(e) => setSmartQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSmartSearch()}
            placeholder="חיפוש AI בשפה חופשית..."
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white shadow-sm"
            dir="rtl"
          />
          {isSmartMode && (
            <button
              onClick={clearSmartSearch}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="נקה חיפוש AI"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSmartSearch}
          disabled={smartLoading || !smartQuery.trim()}
          variant="outline"
          className="gap-2 border-violet-300 text-violet-700 hover:bg-violet-50"
        >
          {smartLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          חיפוש AI
        </Button>
        {!isSmartMode && (
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="מיון" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at">עדכון אחרון</SelectItem>
              <SelectItem value="size">מידה</SelectItem>
              <SelectItem value="child_name">ילד</SelectItem>
              <SelectItem value="season">עונה</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {!isSmartMode && (
        <FilterBar
          children={children}
          filters={filters}
          onChange={setFilters}
          setsForAll={setsForAll}
          onSetsForAllChange={setSetsForAll}
        />
      )}

      {selectMode && selected.size > 0 && (
        <div className="sticky top-0 z-30 flex flex-wrap gap-2 bg-white border border-slate-200 rounded-xl p-3 shadow-md">
          <span className="text-sm text-slate-600 self-center">{selected.size} נבחרו</span>
          <Button size="sm" variant="outline" disabled={bulkSaving} onClick={() => bulkUpdate({ status: 'laundry' })} className="gap-1">
            <WashingMachine className="w-3.5 h-3.5" /> לכביסה
          </Button>
          <Button size="sm" variant="outline" disabled={bulkSaving} onClick={() => bulkUpdate({ status: 'in_closet' })} className="gap-1">
            <Shirt className="w-3.5 h-3.5" /> לארון
          </Button>
          {boxes.length > 0 && (
            <Select onValueChange={(boxId) => bulkUpdate({ status: 'in_box', box_id: boxId })}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="לארגז..." />
              </SelectTrigger>
              <SelectContent>
                {boxes.map((b) => (
                  <SelectItem key={b.id} value={b.id}>ארגז #{b.box_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" variant="destructive" disabled={bulkSaving} onClick={bulkDelete} className="gap-1">
            <Trash2 className="w-3.5 h-3.5" /> מחק
          </Button>
        </div>
      )}

      {smartLoading ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-violet-600 text-sm font-medium">
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
        <EmptyState
          title={isSmartMode ? 'לא נמצאו פריטים התואמים לחיפוש' : 'לא נמצאו פריטים'}
          description={isSmartMode ? 'נסה לנסח את החיפוש בצורה אחרת' : 'נסה לשנות את הסינון או לחץ "הוסף בגד חדש" למעלה'}
        />
      ) : (
        <>
          {isSmartMode && (
            <p className="text-xs text-violet-600 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2 w-fit">
              מציג תוצאות חיפוש AI — לחץ X לחזרה לרשימה המלאה
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
                selectable={selectMode}
                selected={selected.has(item.id)}
                onToggleSelect={() => toggleSelect(item.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 max-w-7xl mx-auto space-y-5" dir="rtl">
          <Skeleton className="h-10 w-48" />
          <div className="flex flex-wrap gap-4">
            {[...Array(12)].map((_, i) => <Skeleton key={i} className="w-40 h-56 rounded-xl" />)}
          </div>
        </div>
      }
    >
      <InventoryContent />
    </Suspense>
  );
}
