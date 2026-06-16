import type { ClothingItem, Season, ClothingStatus, Gender, Child, ChildGender, ClothingType } from '@/types';
import { DEFAULT_GENDER, DEFAULT_CLOTHING_TYPE } from '@/types';

export const COMMON_SIZES = [
  'NB', '0-3m', '3-6m', '6-12m', '12-18m', '18-24m',
  '2Y', '3Y', '4Y', '5Y', '6Y', '7Y', '8Y', '9Y', '10Y', '12Y', '14Y',
  'XS', 'S', 'M', 'L',
] as const;

export function syncChildSizes(current_size: unknown, current_sizes?: unknown): {
  current_size: string;
  current_sizes: string[];
} {
  if (typeof current_size === 'string' && current_size.trim()) {
    const size = current_size.trim();
    return { current_size: size, current_sizes: [size] };
  }
  if (Array.isArray(current_sizes) && current_sizes.length > 0) {
    const size = String(current_sizes[0]).trim();
    return { current_size: size, current_sizes: current_sizes.map(String) };
  }
  return { current_size: '', current_sizes: [] };
}

export function getChildCurrentSize(child: Pick<Child, 'current_size' | 'current_sizes'>): string {
  if (child.current_size?.trim()) return child.current_size.trim();
  return child.current_sizes?.[0]?.trim() ?? '';
}

export const CLOTHING_TYPE_VALUES = [
  'set', 'shirt', 'pants', 'skirt', 'jumper', 'pajamas',
  'overall', 'dress', 'underwear', 'tights', 'socks',
  'hair_accessory', 'unassigned',
] as const satisfies readonly ClothingType[];

export const clothingTypeLabel: Record<ClothingType, string> = {
  set: 'סט/חליפה 👔',
  shirt: 'חולצה 👕',
  pants: 'מכנס 🩳',
  skirt: 'חצאית 👗',
  jumper: 'סרפן 👗',
  pajamas: "פיג'מה 🥱",
  overall: 'אוברול 🩱',
  dress: 'שמלה 👗',
  underwear: 'לבנים 🩲',
  tights: 'גרביונים 🧦',
  socks: 'גרביים 🧦',
  hair_accessory: 'קישוט שיער 🎀',
  unassigned: 'ללא שיוך ⚪',
};

export const CLOTHING_TYPE_OPTIONS: { value: ClothingType; label: string }[] =
  CLOTHING_TYPE_VALUES.map((value) => ({ value, label: clothingTypeLabel[value] }));

export function getClothingTypeOptions(): { value: ClothingType; label: string }[] {
  return CLOTHING_TYPE_VALUES
    .filter((value) => value !== 'unassigned')
    .map((value) => ({ value, label: clothingTypeLabel[value] }));
}

export function isClothingType(value: unknown): value is ClothingType {
  return typeof value === 'string' && (CLOTHING_TYPE_VALUES as readonly string[]).includes(value);
}

export function normalizeClothingType(value: unknown): ClothingType {
  if (isClothingType(value)) return value;
  return DEFAULT_CLOTHING_TYPE;
}

export function normalizeGender(value: unknown): Gender {
  if (value === 'boys' || value === 'girls' || value === 'unassigned') return value;
  return DEFAULT_GENDER;
}

export function normalizeClothingItem(item: ClothingItem): ClothingItem {
  return {
    ...item,
    gender: normalizeGender(item.gender),
    clothing_type: normalizeClothingType(item.clothing_type),
  };
}

export function normalizeClothingItems(items: ClothingItem[]): ClothingItem[] {
  return items.map(normalizeClothingItem);
}

const seasonLabel: Record<Season, string> = {
  summer: 'קיץ',
  winter: 'חורף',
  transition: 'מעבר',
};

export { seasonLabel };

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

export const childGenderLabel: Record<ChildGender, string> = {
  boys: 'בן',
  girls: 'בת',
};

export const childGenderColor: Record<ChildGender, string> = {
  boys: 'bg-sky-100 text-sky-800',
  girls: 'bg-pink-100 text-pink-800',
};

export function isChildGender(value: unknown): value is ChildGender {
  return value === 'boys' || value === 'girls';
}

export function genderFromChild(child: Pick<Child, 'gender'> | null | undefined): ChildGender | '' {
  return child?.gender && isChildGender(child.gender) ? child.gender : '';
}

export function genderDefaultFromChildName(
  childName: string,
  childrenList: Pick<Child, 'name' | 'gender'>[]
): Gender | '' {
  if (!childName || childName === '__none__') return '';
  const child = childrenList.find((c) => c.name === childName);
  const g = genderFromChild(child);
  return g || '';
}

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
      clothingTypeLabel[normalizeClothingType(item.clothing_type)],
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
    clothing_type: normalizeClothingType(item.clothing_type),
    image_url: item.image_url,
    status: item.status,
    box_id: item.box_id,
    set_name: item.set_name ?? null,
  };
}
