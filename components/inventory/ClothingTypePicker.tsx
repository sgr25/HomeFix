'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getClothingTypeOptions } from '@/lib/clothes-utils';
import type { ClothingType } from '@/types';

interface Props {
  value: ClothingType | '';
  onChange: (value: ClothingType) => void;
  variant?: 'compact' | 'full';
  required?: boolean;
  className?: string;
}

export default function ClothingTypePicker({
  value,
  onChange,
  variant = 'compact',
  required = false,
  className,
}: Props) {
  const options = getClothingTypeOptions().filter((o) => o.value !== 'unassigned');

  if (variant === 'compact') {
    return (
      <Select
        value={value || undefined}
        onValueChange={(v) => onChange(v as ClothingType)}
      >
        <SelectTrigger
          className={cn(
            'h-8 text-xs',
            required && !value && 'border-amber-400 ring-1 ring-amber-300',
            className
          )}
        >
          <SelectValue placeholder={required ? 'סוג בגד *' : 'סוג בגד'} />
        </SelectTrigger>
        <SelectContent dir="rtl">
          {options.map(({ value: v, label }) => (
            <SelectItem key={v} value={v} className="text-xs">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className={cn('space-y-1', className)} dir="rtl">
      <label className="text-xs font-medium text-slate-600">
        סוג בגד{required ? ' *' : ''}
      </label>
      <div className="grid grid-cols-3 gap-1.5">
        {options.map(({ value: v, label }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              'py-1.5 px-1 rounded-lg border text-[10px] leading-tight transition-all duration-150 text-center',
              value === v
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-slate-300 text-slate-600 hover:border-indigo-400 hover:bg-indigo-50'
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
