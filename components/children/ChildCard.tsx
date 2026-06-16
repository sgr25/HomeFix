'use client';

import { useState } from 'react';
import { Pencil, Trash2, Check, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Child } from '@/types';

const COMMON_SIZES = ['NB','0-3m','3-6m','6-12m','12-18m','18-24m','2Y','3Y','4Y','5Y','6Y','7Y','8Y','9Y','10Y','12Y','14Y','XS','S','M','L'];

interface Props {
  child: Child;
  clothesCount: number;
  onUpdated: () => void;
}

export default function ChildCard({ child, clothesCount, onUpdated }: Props) {
  const [editing, setEditing]     = useState(false);
  const [sizes, setSizes]         = useState<string[]>(child.current_sizes);
  const [customSize, setCustomSize] = useState('');
  const [saving, setSaving]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    setSaving(true);
    await fetch(`/api/children/${encodeURIComponent(child.name)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_sizes: sizes }),
    });
    setSaving(false);
    setEditing(false);
    onUpdated();
  };

  const cancelEdit = () => {
    setSizes(child.current_sizes);
    setEditing(false);
  };

  const deleteChild = async () => {
    await fetch(`/api/children/${encodeURIComponent(child.name)}`, { method: 'DELETE' });
    onUpdated();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">{child.name}</p>
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
                title="ערוך מידות"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-red-600">למחוק?</span>
                  <Button size="icon" variant="destructive" className="w-7 h-7" onClick={deleteChild}>
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="outline" className="w-7 h-7" onClick={() => setConfirmDelete(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="icon"
                  variant="outline"
                  className="w-8 h-8 text-red-500 hover:text-red-600 hover:border-red-300"
                  onClick={() => setConfirmDelete(true)}
                  title="מחק ילד"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sizes display / edit */}
      <div className="border-t border-slate-100 px-5 py-4">
        {editing ? (
          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-600">בחר מידות נוכחיות:</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSize(s)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    sizes.includes(s)
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'border-slate-300 text-slate-600 hover:border-purple-400'
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
