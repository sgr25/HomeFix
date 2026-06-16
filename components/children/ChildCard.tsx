'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Check, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { fetchJson } from '@/lib/api';
import { notify } from '@/lib/toast';
import { childGenderLabel, childGenderColor } from '@/lib/clothes-utils';
import ChildGenderPicker from '@/components/children/ChildGenderPicker';
import type { Child, ChildGender } from '@/types';

const COMMON_SIZES = ['NB','0-3m','3-6m','6-12m','12-18m','18-24m','2Y','3Y','4Y','5Y','6Y','7Y','8Y','9Y','10Y','12Y','14Y','XS','S','M','L'];

interface Props {
  child: Child;
  clothesCount: number;
  onUpdated: () => void;
}

export default function ChildCard({ child, clothesCount, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(child.name);
  const [sizes, setSizes] = useState<string[]>(child.current_sizes);
  const [gender, setGender] = useState<ChildGender | null>(child.gender);
  const [customSize, setCustomSize] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setName(child.name);
    setSizes(child.current_sizes);
    setGender(child.gender);
  }, [child.name, child.current_sizes, child.gender]);

  const toggleSize = (size: string) => {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const addCustomSize = () => {
    const s = customSize.trim();
    if (s && !sizes.includes(s)) setSizes((prev) => [...prev, s]);
    setCustomSize('');
  };

  const saveEdit = async () => {
    if (!gender) {
      notify.error('נא לבחור מגדר');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = { current_sizes: sizes, gender };
      if (name.trim() !== child.name) body.new_name = name.trim();
      await fetchJson(`/api/children/${encodeURIComponent(child.name)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      notify.saved();
      setEditing(false);
      onUpdated();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setName(child.name);
    setSizes(child.current_sizes);
    setGender(child.gender);
    setEditing(false);
  };

  const deleteChild = async () => {
    try {
      await fetchJson(`/api/children/${encodeURIComponent(child.name)}`, { method: 'DELETE' });
      notify.deleted(`${child.name} הוסר`);
      onUpdated();
    } catch {
      notify.error();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            {editing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-sm font-bold w-32"
                dir="rtl"
                aria-label="שם ילד"
              />
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-800 text-sm">{child.name}</p>
                {child.gender ? (
                  <Badge className={`text-[10px] ${childGenderColor[child.gender]}`}>
                    {childGenderLabel[child.gender]}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">
                    לא הוגדר
                  </Badge>
                )}
              </div>
            )}
            <p className="text-xs text-slate-500">{clothesCount} פריטים משויכים</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!editing && (
            <>
              <Button
                size="icon"
                variant="outline"
                className="w-8 h-8"
                onClick={() => setEditing(true)}
                aria-label="ערוך ילד"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-red-600">למחוק?</span>
                  <Button size="icon" variant="destructive" className="w-7 h-7" onClick={deleteChild} aria-label="אשר מחיקה">
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="outline" className="w-7 h-7" onClick={() => setConfirmDelete(false)} aria-label="ביטול">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="icon"
                  variant="outline"
                  className="w-8 h-8 text-red-500 hover:text-red-600 hover:border-red-300"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="מחק ילד"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 px-5 py-4 space-y-3">
        {editing ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-600 mb-1.5">מגדר:</p>
              <ChildGenderPicker value={gender} onChange={setGender} disabled={saving} />
            </div>

            <p className="text-xs font-medium text-slate-600">בחר מידות נוכחיות:</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSize(s)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
                    sizes.includes(s)
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'border-slate-300 text-slate-600 hover:border-purple-400 hover:bg-purple-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomSize()}
                placeholder="מידה אחרת..."
                className="h-8 text-xs flex-1"
                dir="rtl"
              />
              <Button size="sm" variant="outline" onClick={addCustomSize} className="text-xs h-8">
                הוסף
              </Button>
            </div>

            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={saveEdit} disabled={saving} className="text-xs h-8 gap-1">
                <Check className="w-3 h-3" />
                {saving ? 'שומר...' : 'שמור'}
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit} className="text-xs h-8 gap-1">
                <X className="w-3 h-3" />
                ביטול
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {child.current_sizes.length > 0 ? (
              child.current_sizes.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                  {s}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-slate-400">אין מידות מוגדרות</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
