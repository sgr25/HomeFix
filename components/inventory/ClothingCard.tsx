'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Trash2, Pencil, X, Save, Loader2, Shirt, ImagePlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ClothingItem, Box, Child, Season, ClothingStatus } from '@/types';

const seasonLabel: Record<string, string> = {
  summer: 'קיץ',
  winter: 'חורף',
  transition: 'מעבר',
};

const statusLabel: Record<string, string> = {
  in_closet: 'בארון',
  laundry: 'כביסה',
  in_box: 'בקופסה',
};

const statusColor: Record<string, string> = {
  in_closet: 'bg-green-100 text-green-800',
  laundry:   'bg-yellow-100 text-yellow-800',
  in_box:    'bg-blue-100 text-blue-800',
};

const COMMON_SIZES = ['NB','0-3m','3-6m','6-12m','12-18m','18-24m','2Y','3Y','4Y','5Y','6Y','7Y','8Y','9Y','10Y','12Y','14Y','XS','S','M','L'];

interface EditState {
  size: string;
  season: Season;
  status: ClothingStatus;
  child_name: string;
  box_id: string;
  set_name: string;
}

interface Props {
  item: ClothingItem;
  boxes?: Box[];
  allChildren?: Child[];
  onDelete?: (id: string) => void;
  onEdit?: (id: string, updates: Partial<ClothingItem>) => Promise<void>;
  compact?: boolean;
}

function ItemImage({
  imageUrl,
  alt,
  className,
  sizes,
  objectClass = 'object-cover',
}: {
  imageUrl: string | null | undefined;
  alt: string;
  className?: string;
  sizes: string;
  objectClass?: string;
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className={objectClass}
        sizes={sizes}
      />
    );
  }
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-slate-100 text-slate-400">
      <Shirt className="w-10 h-10" />
      <span className="text-[10px]">ללא תמונה</span>
    </div>
  );
}

export default function ClothingCard({ item, boxes = [], allChildren = [], onDelete, onEdit, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteImageOpen, setDeleteImageOpen] = useState(false);
  const cardFileRef = useRef<HTMLInputElement>(null);
  const dialogFileRef = useRef<HTMLInputElement>(null);
  const [editState, setEditState] = useState<EditState>({
    size: item.size,
    season: item.season,
    status: item.status,
    child_name: item.child_name ?? '',
    box_id: item.box_id ?? '',
    set_name: item.set_name ?? '',
  });

  const resetEdit = () => {
    setEditState({
      size: item.size,
      season: item.season,
      status: item.status,
      child_name: item.child_name ?? '',
      box_id: item.box_id ?? '',
      set_name: item.set_name ?? '',
    });
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!onEdit) return;
    setSaving(true);
    const updates: Partial<ClothingItem> = {
      size: editState.size,
      season: editState.season,
      status: editState.status,
      child_name: editState.child_name || null,
      box_id: editState.status === 'in_box' ? (editState.box_id || null) : null,
      set_name: editState.set_name || null,
    };
    await onEdit(item.id, updates);
    setSaving(false);
    setEditMode(false);
    setOpen(false);
  };

  const uploadImage = async (file: File) => {
    if (!onEdit) return;
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!uploadRes.ok) throw new Error('שגיאה בהעלאת התמונה');
      const { url } = await uploadRes.json();
      await onEdit(item.id, { image_url: url });
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) await uploadImage(file);
  };

  const confirmDeleteImage = async () => {
    if (!onEdit) return;
    setImageUploading(true);
    try {
      await onEdit(item.id, { image_url: null });
      setDeleteImageOpen(false);
    } finally {
      setImageUploading(false);
    }
  };

  const confirmDeleteItem = () => {
    onDelete?.(item.id);
    setDeleteOpen(false);
    setOpen(false);
  };

  const set = (key: keyof EditState) => (value: string) =>
    setEditState((prev) => ({ ...prev, [key]: value }));

  const renderImageArea = (variant: 'card' | 'dialog') => {
    const isCard = variant === 'card';
    const heightClass = isCard ? (compact ? 'h-28' : 'h-40') : 'h-52';
    const fileRef = isCard ? cardFileRef : dialogFileRef;

    return (
      <div
        className={cn(
          'relative w-full rounded-xl overflow-hidden bg-slate-100 group/image cursor-pointer',
          heightClass,
          isCard ? '' : 'rounded-xl'
        )}
        onClick={(e) => {
          if (!onEdit) return;
          e.stopPropagation();
          fileRef.current?.click();
        }}
        title={onEdit ? 'לחץ להוספת או החלפת תמונה' : undefined}
      >
        <ItemImage
          imageUrl={item.image_url}
          alt={`${item.size} ${item.season}`}
          sizes={isCard ? '160px' : '400px'}
          objectClass={isCard ? 'object-cover' : 'object-contain'}
        />

        {onEdit && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onClick={(e) => e.stopPropagation()}
              onChange={handleImageFileChange}
            />
            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100">
              {imageUploading ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <ImagePlus className="w-8 h-8 text-white drop-shadow" />
              )}
            </div>
          </>
        )}

        {onEdit && item.image_url && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-2 left-2 w-7 h-7 opacity-0 group-hover/image:opacity-100 transition-opacity z-10"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteImageOpen(true);
            }}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetEdit(); }}>
        <DialogTrigger asChild>
          <div
            className={cn(
              'group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer',
              compact ? 'w-28' : 'w-40'
            )}
          >
            {renderImageArea('card')}

            <div className="p-2 space-y-1">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="text-xs font-semibold text-slate-700">{item.size}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {seasonLabel[item.season]}
                </Badge>
              </div>

              <div className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium w-fit', statusColor[item.status])}>
                {statusLabel[item.status]}
              </div>

              {item.child_name && (
                <p className="text-[10px] text-slate-500 truncate">{item.child_name}</p>
              )}
              {item.boxes && (
                <p className="text-[10px] text-slate-500">קופסה #{item.boxes.box_number}</p>
              )}
              {item.set_name && (
                <p className="text-[10px] text-indigo-600 font-medium truncate">סט: {item.set_name}</p>
              )}
            </div>

            {onDelete && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 left-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                onClick={(e) => { e.stopPropagation(); setDeleteOpen(true); }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </DialogTrigger>

        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <span>פרטי פריט</span>
              {onEdit && !editMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-slate-500 hover:text-indigo-600"
                  onClick={() => setEditMode(true)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {renderImageArea('dialog')}

            {editMode ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">מידה</label>
                  <Select value={editState.size} onValueChange={set('size')}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר מידה" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_SIZES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">עונה</label>
                  <div className="flex gap-2">
                    {(['summer', 'winter', 'transition'] as Season[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setEditState((p) => ({ ...p, season: s }))}
                        className={cn(
                          'flex-1 py-1.5 rounded-lg border text-xs transition-colors',
                          editState.season === s
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-slate-300 text-slate-600 hover:border-blue-400'
                        )}
                      >
                        {s === 'summer' ? '☀️ קיץ' : s === 'winter' ? '❄️ חורף' : '🌤️ מעבר'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">סטטוס</label>
                  <div className="flex gap-2">
                    {(['in_closet', 'laundry', 'in_box'] as ClothingStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => setEditState((p) => ({ ...p, status: st }))}
                        className={cn(
                          'flex-1 py-1.5 rounded-lg border text-xs transition-colors',
                          editState.status === st
                            ? 'bg-slate-700 text-white border-slate-700'
                            : 'border-slate-300 text-slate-600 hover:border-slate-500'
                        )}
                      >
                        {statusLabel[st]}
                      </button>
                    ))}
                  </div>
                </div>

                {editState.status === 'in_closet' || editState.status === 'laundry' ? (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">ילד/ה</label>
                    <Select value={editState.child_name || '__none__'} onValueChange={(v) => set('child_name')(v === '__none__' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="ללא שיוך" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">ללא שיוך</SelectItem>
                        {allChildren.map((c) => (
                          <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">קופסה</label>
                    <Select value={editState.box_id || '__none__'} onValueChange={(v) => set('box_id')(v === '__none__' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר קופסה" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">ללא קופסה</SelectItem>
                        {boxes.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            קופסה #{b.box_number}{b.description ? ` — ${b.description}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">שם הסט / בגד תואם (אופציונלי)</label>
                  <input
                    type="text"
                    value={editState.set_name}
                    onChange={(e) => setEditState((p) => ({ ...p, set_name: e.target.value }))}
                    placeholder="למשל: סט ים קיץ 2025"
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    dir="rtl"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    שמור
                  </Button>
                  <Button variant="outline" onClick={resetEdit} disabled={saving} className="gap-1">
                    <X className="w-4 h-4" />
                    ביטול
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm" dir="rtl">
                <div className="flex gap-2 flex-wrap">
                  <span className="font-semibold text-slate-700">מידה:</span>
                  <span>{item.size}</span>
                  <Badge variant="secondary">{seasonLabel[item.season]}</Badge>
                  <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium', statusColor[item.status])}>
                    {statusLabel[item.status]}
                  </span>
                </div>
                {item.child_name && (
                  <p><span className="font-semibold text-slate-700">ילד/ה: </span>{item.child_name}</p>
                )}
                {item.boxes && (
                  <p><span className="font-semibold text-slate-700">קופסה: </span>#{item.boxes.box_number}{item.boxes.description ? ` — ${item.boxes.description}` : ''}</p>
                )}
                {item.set_name && (
                  <p><span className="font-semibold text-slate-700">שם הסט: </span><span className="text-indigo-600">{item.set_name}</span></p>
                )}
                {onDelete && (
                  <div className="pt-2 border-t border-slate-100">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="w-4 h-4" />
                      מחק פריט
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח/ה שברצונך למחוק את הפריט?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
            <AlertDialogAction onClick={confirmDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              אישור
            </AlertDialogAction>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteImageOpen} onOpenChange={setDeleteImageOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח/ה שברצונך למחוק את התמונה?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
            <AlertDialogAction
              onClick={confirmDeleteImage}
              disabled={imageUploading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {imageUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'אישור'}
            </AlertDialogAction>
            <AlertDialogCancel disabled={imageUploading}>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
