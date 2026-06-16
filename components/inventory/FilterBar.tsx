'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Child } from '@/types';

interface Filters {
  child: string;
  season: string;
  status: string;
}

interface Props {
  children: Child[];
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const ALL = '__all__';

export default function FilterBar({ children, filters, onChange }: Props) {
  const set = (key: keyof Filters) => (value: string) =>
    onChange({ ...filters, [key]: value === ALL ? '' : value });

  return (
    <div className="flex flex-wrap gap-3 items-center" dir="rtl">
      <Select value={filters.child || ALL} onValueChange={set('child')}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="כל הילדים" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>כל הילדים</SelectItem>
          {children.map((c) => (
            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.season || ALL} onValueChange={set('season')}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="כל העונות" />
        </SelectTrigger>
        <SelectContent>
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
        <SelectContent>
          <SelectItem value={ALL}>כל הסטטוסים</SelectItem>
          <SelectItem value="in_closet">בארון</SelectItem>
          <SelectItem value="laundry">כביסה</SelectItem>
          <SelectItem value="in_box">בקופסה</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
