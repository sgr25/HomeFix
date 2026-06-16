'use client';

import { useState, useEffect, useCallback } from 'react';
import Dropzone from '@/components/upload/Dropzone';
import ClothingQuickForm, { type PendingItem } from '@/components/upload/ClothingQuickForm';
import { Button } from '@/components/ui/button';
import { Loader2, Save, PlusCircle } from 'lucide-react';
import type { Child, Box } from '@/types';

export default function UploadPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/children').then((r) => r.json()),
      fetch('/api/boxes').then((r) => r.json()),
    ]).then(([c, b]) => {
      setChildren(Array.isArray(c) ? c : []);
      setBoxes(Array.isArray(b) ? b : []);
    });
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    const newItems: PendingItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      size: '',
      season: '',
      status: 'in_closet',
      child_name: '',
      box_number: '',
      set_name: '',
      uploading: false,
      saved: false,
    }));
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const addBlankItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        file: null,
        preview: null,
        size: '',
        season: '',
        status: 'in_closet',
        child_name: '',
        box_number: '',
        set_name: '',
        uploading: false,
        saved: false,
      },
    ]);
  }, []);

  const updateItem = (id: string, updates: Partial<PendingItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const saveAll = async () => {
    const pending = items.filter((i) => !i.saved && !i.uploading);
    if (!pending.length) return;
    setSaving(true);

    for (const item of pending) {
      if (!item.size || !item.season) {
        updateItem(item.id, { error: 'נא לבחור מידה ועונה' });
        continue;
      }
      if (item.status === 'in_box' && !item.box_number) {
        updateItem(item.id, { error: 'נא לבחור קופסה' });
        continue;
      }

      updateItem(item.id, { uploading: true, error: undefined });

      try {
        // 1. Upload image (optional)
        let url: string | null = null;
        if (item.file) {
          const fd = new FormData();
          fd.append('file', item.file);
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
          if (!uploadRes.ok) {
            const body = await uploadRes.json().catch(() => ({}));
            throw new Error(typeof body.error === 'string' ? body.error : 'שגיאה בהעלאת התמונה');
          }
          ({ url } = await uploadRes.json());
        }

        // 2. Resolve box_id from box_number
        let box_id: string | null = null;
        if (item.status === 'in_box' && item.box_number) {
          const box = boxes.find((b) => String(b.box_number) === item.box_number);
          box_id = box?.id ?? null;
        }

        // 3. Save clothing record
        const saveRes = await fetch('/api/clothes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            child_name: item.child_name && item.child_name !== '__none__' ? item.child_name : null,
            size: item.size,
            season: item.season,
            image_url: url ?? null,
            status: item.status,
            box_id,
            set_name: item.set_name || null,
          }),
        });
        if (!saveRes.ok) {
          const body = await saveRes.json().catch(() => ({}));
          throw new Error(typeof body.error === 'string' ? body.error : 'שגיאה בשמירת הפריט');
        }

        updateItem(item.id, { uploading: false, saved: true });
      } catch (err) {
        updateItem(item.id, {
          uploading: false,
          error: err instanceof Error ? err.message : 'שגיאה',
        });
      }
    }

    setSaving(false);
  };

  const unsavedCount = items.filter((i) => !i.saved).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">הוספת בגד</h1>
          <p className="text-sm text-slate-500">גרור תמונות או הוסף פריט ללא תמונה</p>
        </div>
        {unsavedCount > 0 && (
          <Button onClick={saveAll} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            שמור הכל ({unsavedCount})
          </Button>
        )}
      </div>

      <Dropzone onFiles={handleFiles} />

      <div className="flex justify-center">
        <Button variant="outline" onClick={addBlankItem} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          הוסף פריט ללא תמונה
        </Button>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-4 pt-2">
          {items.map((item) => (
            <ClothingQuickForm
              key={item.id}
              item={item}
              children={children}
              boxes={boxes}
              onChange={updateItem}
              onRemove={removeItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
