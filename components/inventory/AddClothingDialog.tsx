'use client';

import { useState, useCallback } from 'react';
import { Plus, Loader2, Save, PlusCircle } from 'lucide-react';
import Dropzone from '@/components/upload/Dropzone';
import ClothingQuickForm, { type PendingItem } from '@/components/upload/ClothingQuickForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { notify } from '@/lib/toast';
import type { Child, Box } from '@/types';

function createBlankItem(): PendingItem {
  return {
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
  };
}

interface Props {
  childrenList: Child[];
  boxes: Box[];
  onSaved: () => void;
}

export default function AddClothingDialog({ childrenList, boxes, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<PendingItem>(createBlankItem);
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    setItem((prev) => {
      if (prev.preview) URL.revokeObjectURL(prev.preview);
      return createBlankItem();
    });
    setSaving(false);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetForm();
  };

  const handleFiles = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setItem((prev) => {
      if (prev.preview) URL.revokeObjectURL(prev.preview);
      return {
        ...prev,
        file,
        preview: URL.createObjectURL(file),
        error: undefined,
      };
    });
  }, []);

  const updateItem = (_id: string, updates: Partial<PendingItem>) =>
    setItem((prev) => ({ ...prev, ...updates, error: undefined }));

  const removeItem = () => {
    setItem((prev) => {
      if (prev.preview) URL.revokeObjectURL(prev.preview);
      return { ...prev, file: null, preview: null };
    });
  };

  const addBlankItem = () => {
    setItem((prev) => {
      if (prev.preview) URL.revokeObjectURL(prev.preview);
      return { ...prev, file: null, preview: null, error: undefined };
    });
  };

  const saveItem = async () => {
    if (!item.size || !item.season) {
      setItem((prev) => ({ ...prev, error: 'נא לבחור מידה ועונה' }));
      return;
    }
    if (item.status === 'in_box' && !item.box_number) {
      setItem((prev) => ({ ...prev, error: 'נא לבחור ארגז' }));
      return;
    }

    setSaving(true);
    setItem((prev) => ({ ...prev, uploading: true, error: undefined }));

    try {
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

      let box_id: string | null = null;
      if (item.status === 'in_box' && item.box_number) {
        const box = boxes.find((b) => String(b.box_number) === item.box_number);
        box_id = box?.id ?? null;
      }

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

      onSaved();
      notify.itemSaved();
      setOpen(false);
      resetForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה';
      notify.error(msg);
      setItem((prev) => ({
        ...prev,
        uploading: false,
        error: err instanceof Error ? err.message : 'שגיאה',
      }));
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
          <Plus className="w-4 h-4" />
          הוסף בגד חדש
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת בגד חדש</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Dropzone onFiles={handleFiles} />

          <div className="flex justify-center">
            <Button variant="outline" onClick={addBlankItem} className="gap-2 text-sm">
              <PlusCircle className="w-4 h-4" />
              הוסף פריט ללא תמונה
            </Button>
          </div>

          <div className="flex justify-center">
            <ClothingQuickForm
              item={item}
              children={childrenList}
              boxes={boxes}
              onChange={updateItem}
              onRemove={removeItem}
            />
          </div>
        </div>

        <DialogFooter className="flex-row-reverse gap-2 sm:justify-start">
          <Button onClick={saveItem} disabled={saving || item.uploading} className="gap-2">
            {saving || item.uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            שמור פריט
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
