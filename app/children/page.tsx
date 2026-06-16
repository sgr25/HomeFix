'use client';

import { useState, useEffect } from 'react';
import ChildCard from '@/components/children/ChildCard';
import ChildGenderPicker from '@/components/children/ChildGenderPicker';
import ShoppingGapsReport from '@/components/reports/ShoppingGapsReport';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ShoppingBag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { fetchJson } from '@/lib/api';
import { notify } from '@/lib/toast';
import { COMMON_SIZES } from '@/lib/clothes-utils';
import type { Child, ChildGender, ClothingItem } from '@/types';

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<ChildGender | null>(null);
  const [newSize, setNewSize] = useState('');
  const [newCustomSize, setNewCustomSize] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);

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

  const isNewCustom = newSize === '__custom__';

  const saveChild = async () => {
    const name = newName.trim();
    if (!name) { setError('נא להזין שם'); return; }
    if (!newGender) { setError('נא לבחור מגדר'); return; }
    if (children.some((c) => c.name === name)) { setError('ילד בשם זה כבר קיים'); return; }

    const sizeValue = isNewCustom ? newCustomSize.trim() : (newSize === '__none__' || !newSize ? '' : newSize);

    setError('');
    setSaving(true);

    try {
      await fetchJson('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, gender: newGender, current_size: sizeValue }),
      });

      setNewName('');
      setNewGender(null);
      setNewSize('');
      setNewCustomSize('');
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
      <PageHeader
        title="ילדים"
        description="ניהול ילדים ומידות נוכחיות"
        action={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setReportOpen(true)}
          >
            <ShoppingBag className="w-4 h-4" />
            הפק דוח חוסרים וקניות
          </Button>
        }
      />

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
          <label className="text-xs text-slate-500 block mb-1.5">מגדר</label>
          <ChildGenderPicker value={newGender} onChange={setNewGender} />
        </div>

        <div>
          <label className="text-xs text-slate-500 block mb-1.5">מידה נוכחית (אופציונלי)</label>
          <Select value={newSize || '__none__'} onValueChange={setNewSize}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="בחר מידה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">ללא מידה</SelectItem>
              {COMMON_SIZES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
              <SelectItem value="__custom__">מידה אחרת...</SelectItem>
            </SelectContent>
          </Select>
          {isNewCustom && (
            <Input
              value={newCustomSize}
              onChange={(e) => setNewCustomSize(e.target.value)}
              placeholder="הזן מידה (למשל 3T, 4T)..."
              className="h-8 text-xs mt-2"
              dir="rtl"
            />
          )}
        </div>

        <Button type="submit" disabled={saving || !newName.trim() || !newGender} className="gap-1">
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

      <ShoppingGapsReport open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
}
