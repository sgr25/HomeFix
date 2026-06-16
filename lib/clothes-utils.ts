import type { ClothingItem, Season, ClothingStatus, Gender } from '@/types';
import { DEFAULT_GENDER } from '@/types';

export function normalizeGender(value: unknown): Gender {
  if (value === 'boys' || value === 'girls' || value === 'unassigned') return value;
  return DEFAULT_GENDER;
}

export function normalizeClothingItem(item: ClothingItem): ClothingItem {
  return { ...item, gender: normalizeGender(item.gender) };
}

export function normalizeClothingItems(items: ClothingItem[]): ClothingItem[] {
  return items.map(normalizeClothingItem);
}

const seasonLabel: Record<Season, string> = {
  summer: 'קיץ',
  winter: 'חורף',
  transition: 'מעבר',
};

const statusLabel: Record<ClothingStatus, string> = {
  in_closet: 'בארון',
  laundry: 'כביסה',
  in_box: 'בארגז',
};

export const genderLabel: Record<Gender, string> = {
  boys: 'בנים',
  girls: 'בנות',
  unassigned: 'ללא שיוך',
};

export const genderColor: Record<Gender, string> = {
  boys: 'bg-sky-100 text-sky-800',
  girls: 'bg-pink-100 text-pink-800',
  unassigned: 'bg-slate-100 text-slate-600',
};

export type SortKey = 'updated_at' | 'size' | 'child_name' | 'season';

export function filterClothes(items: ClothingItem[], query: string): ClothingItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  return items.filter((item) => {
    const haystack = [
      item.size,
      item.child_name,
      item.set_name,
      seasonLabel[item.season],
      statusLabel[item.status],
      genderLabel[normalizeGender(item.gender)],
      item.boxes?.description,
      item.boxes?.box_number != null ? String(item.boxes.box_number) : null,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function sortClothes(items: ClothingItem[], sortKey: SortKey): ClothingItem[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    switch (sortKey) {
      case 'updated_at':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      case 'size':
        return a.size.localeCompare(b.size, 'he');
      case 'child_name':
        return (a.child_name ?? '').localeCompare(b.child_name ?? '', 'he');
      case 'season':
        return a.season.localeCompare(b.season);
      default:
        return 0;
    }
  });
  return sorted;
}

export function clothingToPayload(item: ClothingItem) {
  return {
    child_name: item.child_name,
    size: item.size,
    season: item.season,
    gender: normalizeGender(item.gender),
    image_url: item.image_url,
    status: item.status,
    box_id: item.box_id,
    set_name: item.set_name ?? null,
  };
}
