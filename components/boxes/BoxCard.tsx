'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, Printer, Package, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { fetchJson } from '@/lib/api';
import { notify } from '@/lib/toast';
import type { Box, ClothingItem } from '@/types';

import { genderLabel } from '@/lib/clothes-utils';

const seasonLabel: Record<string, string> = { summer: 'קיץ', winter: 'חורף', transition: 'מעבר' };

interface Props {
  box: Box;
  items: ClothingItem[];
  onUpdated?: () => void;
}

export default function BoxCard({ box, items, onUpdated }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [boxNumber, setBoxNumber] = useState(String(box.box_number));
  const [description, setDescription] = useState(box.description ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePrint = () => {
    const html = `
<!DOCTYPE html><html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<title>ארגז #${box.box_number}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  p  { color: #555; margin: 0 0 16px; font-size: 13px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .item { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; text-align: center; }
  .item img { width: 100%; height: 120px; object-fit: cover; }
  .info { padding: 6px; font-size: 11px; }
  .size { font-weight: bold; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<h1>ארגז #${box.box_number}</h1>
<p>${box.description ?? ''} — ${items.length} פריטים</p>
<div class="grid">
${items.map((i) => `
  <div class="item">
    <img src="${i.image_url}" alt="${i.size}" />
    <div class="info">
      <div class="size">${i.size}</div>
      <div>${seasonLabel[i.season]}</div>
      <div>${genderLabel[i.gender ?? 'unassigned']}</div>
      ${i.child_name ? `<div>${i.child_name}</div>` : ''}
    </div>
  </div>`).join('')}
</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await fetchJson(`/api/boxes/${box.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          box_number: Number(boxNumber),
          description: description || null,
        }),
      });
      notify.saved();
      setEditing(false);
      onUpdated?.();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const deleteBox = async () => {
    try {
      await fetchJson(`/api/boxes/${box.id}`, { method: 'DELETE' });
      notify.deleted('הארגז נמחק');
      onUpdated?.();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => !editing && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            {editing ? (
              <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                <Input
                  type="number"
                  value={boxNumber}
                  onChange={(e) => setBoxNumber(e.target.value)}
                  className="h-8 w-20 text-sm"
                  aria-label="מספר ארגז"
                />
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-8 text-sm flex-1 min-w-32"
                  placeholder="תיאור..."
                  dir="rtl"
                  aria-label="תיאור ארגז"
                />
              </div>
            ) : (
              <>
                <p className="font-bold text-slate-800 text-sm">ארגז #{box.box_number}</p>
                {box.description && (
                  <p className="text-xs text-slate-500">{box.description}</p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Badge variant="secondary">{items.length} פריטים</Badge>
          {editing ? (
            <>
              <Button size="icon" variant="default" className="w-8 h-8" onClick={saveEdit} disabled={saving} aria-label="שמור">
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" className="w-8 h-8" onClick={() => setEditing(false)} aria-label="ביטול">
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button size="icon" variant="outline" className="w-8 h-8" onClick={() => setEditing(true)} aria-label="ערוך ארגז">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" className="w-8 h-8" onClick={handlePrint} aria-label="הדפס מניפסט">
                <Printer className="w-4 h-4" />
              </Button>
              {confirmDelete ? (
                <>
                  <Button size="icon" variant="destructive" className="w-8 h-8" onClick={deleteBox} aria-label="אשר מחיקה">
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline" className="w-8 h-8" onClick={() => setConfirmDelete(false)} aria-label="ביטול">
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button size="icon" variant="outline" className="w-8 h-8 text-red-500" onClick={() => setConfirmDelete(true)} aria-label="מחק ארגז">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <button onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'כווץ' : 'הרחב'}>
                {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
            </>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4">
          {items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">הארגז ריק</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col items-center gap-1 w-24"
                  title={`${item.size} — ${seasonLabel[item.season]} — ${genderLabel[item.gender ?? 'unassigned']}`}
                >
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-slate-100">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.size} fill className="object-cover" sizes="96px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400">ללא תמונה</div>
                    )}
                  </div>
                  <p className="text-[10px] font-semibold text-slate-600">{item.size}</p>
                  <p className="text-[10px] text-slate-500">{genderLabel[item.gender ?? 'unassigned']}</p>
                  {item.child_name && <p className="text-[10px] text-slate-400">{item.child_name}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
