'use client';

import Image from 'next/image';
import { X, Loader2, CheckCircle2, Shirt } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Child, Box, Season, ClothingStatus, Gender } from '@/types';

export interface PendingItem {
  id: string;
  file: File | null;
  preview: string | null;
  size: string;
  season: Season | '';
  gender: Gender | '';
  status: ClothingStatus;
  child_name: string;
  box_number: string;
  set_name: string;
  uploading: boolean;
  saved: boolean;
  error?: string;
}

interface Props {
  item: PendingItem;
  children: Child[];
  boxes: Box[];
  onChange: (id: string, updates: Partial<PendingItem>) => void;
  onRemove: (id: string) => void;
}

const COMMON_SIZES = ['NB','0-3m','3-6m','6-12m','12-18m','18-24m','2Y','3Y','4Y','5Y','6Y','7Y','8Y','9Y','10Y','12Y','14Y','XS','S','M','L'];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'boys', label: 'בנים' },
  { value: 'girls', label: 'בנות' },
  { value: 'unassigned', label: 'ללא שיוך' },
];

export default function ClothingQuickForm({ item, children, boxes, onChange, onRemove }: Props) {
  const set = (key: keyof PendingItem) => (value: string) => onChange(item.id, { [key]: value });

  if (item.saved) {
    return (
      <div className="flex flex-col items-center gap-2 w-40 opacity-60">
        <div className="relative w-40 h-40 rounded-xl overflow-hidden bg-slate-100">
          {item.preview ? (
            <Image src={item.preview} alt="saved" fill className="object-cover" sizes="160px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100">
              <Shirt className="w-12 h-12 text-slate-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <p className="text-xs text-green-600 font-medium">נשמר</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-40 relative" dir="rtl">
      <div className="relative w-40 h-40 rounded-xl overflow-hidden bg-slate-100">
        {item.preview ? (
          <Image src={item.preview} alt="preview" fill className="object-cover" sizes="160px" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-slate-100">
            <Shirt className="w-12 h-12 text-slate-300" />
            <span className="text-[10px] text-slate-400">ללא תמונה</span>
          </div>
        )}
        {item.uploading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-1 right-1 w-6 h-6"
          onClick={() => onRemove(item.id)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Size */}
      <Select value={item.size} onValueChange={set('size')}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="מידה" />
        </SelectTrigger>
        <SelectContent>
          {COMMON_SIZES.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Gender */}
      <div className="flex gap-1">
        {GENDER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(item.id, { gender: value })}
            className={cn(
              'flex-1 text-[10px] py-1 rounded-md border transition-all duration-150',
              item.gender === value
                ? value === 'boys'
                  ? 'bg-sky-600 text-white border-sky-600'
                  : value === 'girls'
                    ? 'bg-pink-600 text-white border-pink-600'
                    : 'bg-slate-600 text-white border-slate-600'
                : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Season */}
      <div className="flex gap-1">
        {(['summer','winter','transition'] as Season[]).map((s) => (
          <button
            key={s}
            onClick={() => onChange(item.id, { season: s })}
            className={cn(
              'flex-1 text-[10px] py-1 rounded-md border transition-all duration-150',
              item.season === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-slate-300 text-slate-600 hover:border-blue-400 hover:bg-blue-50'
            )}
          >
            {s === 'summer' ? '☀️' : s === 'winter' ? '❄️' : '🌤️'}
          </button>
        ))}
      </div>

      {/* Status toggle */}
      <div className="flex gap-1">
        {(['in_closet','in_box'] as const).map((st) => (
          <button
            key={st}
            onClick={() => onChange(item.id, { status: st })}
            className={cn(
              'flex-1 text-[10px] py-1 rounded-md border transition-all duration-150',
              item.status === st
                ? 'bg-slate-700 text-white border-slate-700'
                : 'border-slate-300 text-slate-600 hover:border-slate-500 hover:bg-slate-50'
            )}
          >
            {st === 'in_closet' ? 'בארון' : 'בארגז'}
          </button>
        ))}
      </div>

      {/* Conditional: child or box */}
      {item.status === 'in_closet' ? (
        <Select value={item.child_name} onValueChange={set('child_name')}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="ילד/ה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__" className="text-xs">ללא שיוך</SelectItem>
            {children.map((c) => (
              <SelectItem key={c.name} value={c.name} className="text-xs">{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Select value={item.box_number} onValueChange={set('box_number')}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="מספר ארגז" />
          </SelectTrigger>
          <SelectContent>
            {boxes.map((b) => (
              <SelectItem key={b.id} value={String(b.box_number)} className="text-xs">
                ארגז #{b.box_number}{b.description ? ` — ${b.description}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Set name */}
      <Input
        type="text"
        value={item.set_name}
        onChange={(e) => onChange(item.id, { set_name: e.target.value })}
        placeholder="שם סט תואם (אופציונלי)"
        className="h-8 text-xs"
        dir="rtl"
      />

      {item.error && <p className="text-[10px] text-red-500">{item.error}</p>}
    </div>
  );
}
