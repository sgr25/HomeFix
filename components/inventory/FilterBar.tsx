'use client';

import { Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { childGenderLabel, childGenderColor, getClothingTypeOptions } from '@/lib/clothes-utils';
import type { Child } from '@/types';

interface Filters {
  child: string;
  season: string;
  status: string;
  gender: string;
  clothing_type: string;
}

interface Props {
  childrenList: Child[];
  filters: Filters;
  onChange: (filters: Filters) => void;
  setsForAll?: boolean;
  onSetsForAllChange?: (value: boolean) => void;
}

const ALL = '__all__';

export default function FilterBar({
  childrenList,
  filters,
  onChange,
  setsForAll = false,
  onSetsForAllChange,
}: Props) {
  const set = (key: keyof Filters) => (value: string) =>
    onChange({ ...filters, [key]: value === ALL ? '' : value });

  const clothingOptions = getClothingTypeOptions();

  return (
    <div className="space-y-3" dir="rtl">
      {onSetsForAllChange && (
        <Button
          variant={setsForAll ? 'default' : 'outline'}
          className={cn(
            'gap-2 font-semibold transition-all',
            setsForAll
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
              : 'border-indigo-300 text-indigo-700 hover:bg-indigo-50'
          )}
          onClick={() => onSetsForAllChange(!setsForAll)}
        >
          <Users className="w-4 h-4" />
          סטים שזמינים לכולם
          {setsForAll && (
            <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">פעיל</span>
          )}
        </Button>
      )}

      <div className={cn('flex flex-wrap gap-3 items-center', setsForAll && 'opacity-40 pointer-events-none')}>
        <Select value={filters.child || ALL} onValueChange={set('child')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="כל הילדים" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value={ALL}>כל הילדים</SelectItem>
            {(childrenList ?? []).map((c) => (
              <SelectItem key={c.name} value={c.name}>
                <span className="flex items-center gap-1.5">
                  {c.name}
                  {c.gender && (
                    <Badge className={`text-[9px] px-1 py-0 ${childGenderColor[c.gender]}`}>
                      {childGenderLabel[c.gender]}
                    </Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.season || ALL} onValueChange={set('season')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="כל העונות" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value={ALL}>כל העונות</SelectItem>
            <SelectItem value="summer">קיץ</SelectItem>
            <SelectItem value="winter">חורף</SelectItem>
            <SelectItem value="transition">מעבר</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.status || ALL} onValueChange={set('status')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="כל הסטטוסים" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value={ALL}>כל הסטטוסים</SelectItem>
            <SelectItem value="in_closet">בארון</SelectItem>
            <SelectItem value="laundry">כביסה</SelectItem>
            <SelectItem value="in_box">בארגז</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.gender || ALL} onValueChange={set('gender')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="כל המגדרים" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value={ALL}>כל המגדרים</SelectItem>
            <SelectItem value="boys">בנים</SelectItem>
            <SelectItem value="girls">בנות</SelectItem>
            <SelectItem value="unassigned">ללא שיוך</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Select value={filters.clothing_type || ALL} onValueChange={set('clothing_type')}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="כל סוגי הבגדים" />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          <SelectItem value={ALL}>כל סוגי הבגדים</SelectItem>
          {clothingOptions.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
