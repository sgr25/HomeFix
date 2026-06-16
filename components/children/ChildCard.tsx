'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Check, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchJson } from '@/lib/api';
import { notify } from '@/lib/toast';
import { childGenderLabel, childGenderColor, COMMON_SIZES, getChildCurrentSize } from '@/lib/clothes-utils';
import ChildGenderPicker from '@/components/children/ChildGenderPicker';
import GrowthModal from '@/components/children/GrowthModal';
import type { GrowthScanResult } from '@/lib/growth-utils';
import type { Child, ChildGender } from '@/types';

interface Props {
  child: Child;
  clothesCount: number;
  onUpdated: () => void;
}

export default function ChildCard({ child, clothesCount, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(child.name);
  const [currentSize, setCurrentSize] = useState(getChildCurrentSize(child));
  const [customSize, setCustomSize] = useState('');
  const [gender, setGender] = useState<ChildGender | null>(child.gender);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [growthOpen, setGrowthOpen] = useState(false);
  const [growthScan, setGrowthScan] = useState<GrowthScanResult | null>(null);
  const [growthLoading, setGrowthLoading] = useState(false);
  const [growthOldSize, setGrowthOldSize] = useState('');
  const [growthNewSize, setGrowthNewSize] = useState('');

  useEffect(() => {
    setName(child.name);
    setCurrentSize(getChildCurrentSize(child));
    setGender(child.gender);
  }, [child]);

  const isCustomSize = currentSize !== '' && !COMMON_SIZES.includes(currentSize as typeof COMMON_SIZES[number]);

  const saveEdit = async () => {
    if (!gender) {
      notify.error('נא לבחור מגדר');
      return;
    }
    const oldSize = getChildCurrentSize(child);
    const newSize = currentSize.trim();

    setSaving(true);
    try {
      const body: Record<string, unknown> = { current_size: newSize, gender };
      if (name.trim() !== child.name) body.new_name = name.trim();
      await fetchJson(`/api/children/${encodeURIComponent(child.name)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      notify.saved();
      setEditing(false);
      onUpdated();

      if (oldSize && newSize && oldSize !== newSize) {
        setGrowthOldSize(oldSize);
        setGrowthNewSize(newSize);
        setGrowthOpen(true);
        setGrowthLoading(true);
        setGrowthScan(null);
        try {
          const scan = await fetchJson<GrowthScanResult>(
            `/api/children/${encodeURIComponent(child.name)}/growth-scan`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ old_size: oldSize, new_size: newSize }),
            }
          );
          setGrowthScan(scan);
        } catch {
          notify.error('שגיאה בסריקת המלאי');
          setGrowthOpen(false);
        } finally {
          setGrowthLoading(false);
        }
      }
    } catch (err) {
      notify.error(err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setName(child.name);
    setCurrentSize(getChildCurrentSize(child));
    setGender(child.gender);
    setCustomSize('');
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

  const displaySize = getChildCurrentSize(child);

  return (
    <>
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

              <div>
                <p className="text-xs font-medium text-slate-600 mb-1.5">מידה נוכחית:</p>
                <Select
                  value={isCustomSize ? '__custom__' : (currentSize || '__none__')}
                  onValueChange={(v) => {
                    if (v === '__custom__') {
                      setCurrentSize(customSize || '');
                    } else if (v === '__none__') {
                      setCurrentSize('');
                    } else {
                      setCurrentSize(v);
                    }
                  }}
                >
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
                {(isCustomSize || currentSize === '') && (
                  <Input
                    value={isCustomSize ? currentSize : customSize}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCustomSize(v);
                      setCurrentSize(v);
                    }}
                    placeholder="הזן מידה (למשל 3T, 4T)..."
                    className="h-8 text-xs mt-2"
                    dir="rtl"
                  />
                )}
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
              {displaySize ? (
                <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                  מידה: {displaySize}
                </Badge>
              ) : (
                <span className="text-xs text-slate-400">אין מידה מוגדרת</span>
              )}
            </div>
          )}
        </div>
      </div>

      <GrowthModal
        open={growthOpen}
        onOpenChange={setGrowthOpen}
        childName={child.name}
        oldSize={growthOldSize}
        newSize={growthNewSize}
        scan={growthScan}
        loading={growthLoading}
        onLaundryDone={onUpdated}
      />
    </>
  );
}
