'use client';

import { cn } from '@/lib/utils';
import { childGenderLabel } from '@/lib/clothes-utils';
import type { ChildGender } from '@/types';

const OPTIONS: ChildGender[] = ['boys', 'girls'];

interface Props {
  value: ChildGender | null;
  onChange: (gender: ChildGender) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export default function ChildGenderPicker({ value, onChange, size = 'md', disabled = false }: Props) {
  const btnClass = size === 'sm' ? 'text-[10px] py-1 px-2' : 'text-xs py-1.5 px-3';

  return (
    <div className="flex gap-1.5" dir="rtl">
      {OPTIONS.map((g) => (
        <button
          key={g}
          type="button"
          disabled={disabled}
          onClick={() => onChange(g)}
          className={cn(
            'flex-1 rounded-md border font-medium transition-all duration-150',
            btnClass,
            value === g
              ? g === 'boys'
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-pink-600 text-white border-pink-600'
              : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50',
            disabled && 'opacity-50 pointer-events-none'
          )}
        >
          {childGenderLabel[g]}
        </button>
      ))}
    </div>
  );
}
