import type { ClothingItem, Season, ClothingStatus } from '@/types';

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
    image_url: item.image_url,
    status: item.status,
    box_id: item.box_id,
    set_name: item.set_name ?? null,
  };
}
