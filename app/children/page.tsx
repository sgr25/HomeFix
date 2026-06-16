'use client';

import { useState, useEffect } from 'react';
import ChildCard from '@/components/children/ChildCard';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { fetchJson } from '@/lib/api';
import { notify } from '@/lib/toast';
import type { Child, ClothingItem } from '@/types';

const COMMON_SIZES = ['NB','0-3m','3-6m','6-12m','12-18m','18-24m','2Y','3Y','4Y','5Y','6Y','7Y','8Y','9Y','10Y','12Y','14Y','XS','S','M','L'];

export default function ChildrenPage() {
  const [children, setChildren]   = useState<Child[]>([]);
  const [clothes, setClothes]     = useState<ClothingItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [newName, setNewName]     = useState('');
  const [newSizes, setNewSizes]   = useState<string[]>([]);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const load = () =>
    Promise.all([
      fetchJson<Child[]>('/api/children'),
      fetchJson<ClothingItem[]>('/api/clothes'),
    ]).then(([c, cl]) => {
      setChildren(Array.isArray(c) ? c : []);
      setClothes(Array.isArray(cl) ? cl : []);
      setLoading(false);
    }).catch(() => { setLoading(false); notify.error(); });

  useEffect(() => { load(); }, []);

  const toggleNewSize = (size: string) => {
    setNewSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const saveChild = async () => {
    const name = newName.trim();
    if (!name) { setError('נא להזין שם'); return; }
    if (children.some((c) => c.name === name)) { setError('ילד בשם זה כבר קיים'); return; }

    setError('');
    setSaving(true);

    try {
      await fetchJson('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, current_sizes: newSizes }),
      });

      setNewName('');
      setNewSizes([]);
      notify.saved(`${name} נשמר בהצלחה`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה — נסה שוב');
      notify.error();
    } finally {
      setSaving(false);
    }
  };

  const clothesCountFor = (name: string) =>
    clothes.filter((c) => c.child_name === name).length;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6" dir="rtl">
      <PageHeader title="ילדים" description="ניהול ילדים ומידות נוכחיות" />

      {/* Add child form */}
      <form
        className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4"
        onSubmit={(e) => { e.preventDefault(); saveChild(); }}
      >
        <h2 className="text-sm font-semibold text-slate-700">הוספת ילד/ה חדש/ה</h2>

        <div>
          <label className="text-xs text-slate-500 block mb-1">שם</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError(''); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="למשל: יואב, שירה..."
            dir="rtl"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        <div>
          <label className="text-xs text-slate-500 block mb-2">מידות נוכחיות (אופציונלי)</label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => toggleNewSize(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
                  newSizes.includes(s)
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'border-slate-300 text-slate-600 hover:border-purple-400 hover:bg-purple-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={saving || !newName.trim()} className="gap-1">
          {saving ? (
            <>שומר...</>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              שמור
            </>
          )}
        </Button>
      </form>

      {/* Children list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : children.length === 0 ? (
        <EmptyState title="אין ילדים עדיין" description="הוסף ילד/ה ראשון/ה למעלה" />
      ) : (
        <div className="space-y-3">
          {children.map((child) => (
            <ChildCard
              key={child.name}
              child={child}
              clothesCount={clothesCountFor(child.name)}
              onUpdated={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
