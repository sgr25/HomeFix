import type { ClothingType, Season } from '@/types';
import { clothingTypeLabel, normalizeClothingType, seasonLabel } from '@/lib/clothes-utils';

export interface GrowthScanItem {
  clothing_type: ClothingType;
  season: Season;
  count: number;
}

export interface GrowthScanBoxGroup {
  box_number: number;
  box_id: string;
  items: GrowthScanItem[];
  summary_he: string;
}

export interface GrowthScanResult {
  boxed: GrowthScanBoxGroup[];
  outdated_closet: {
    count: number;
    item_ids: string[];
    summary_he: string;
  };
}

const typePluralHe: Partial<Record<ClothingType, string>> = {
  shirt: 'חולצות',
  pants: 'מכנסיים',
  skirt: 'חצאיות',
  jumper: 'סרפנים',
  dress: 'שמלות',
  set: 'סטים',
  pajamas: "פיג'מות",
  overall: 'אוברולים',
  underwear: 'לבנים',
  tights: 'גרביונים',
  socks: 'גרביים',
  hair_accessory: 'קישוטי שיער',
  unassigned: 'פריטים',
};

function formatTypeCounts(items: GrowthScanItem[]): string {
  const byType = new Map<ClothingType, number>();
  for (const item of items) {
    const t = normalizeClothingType(item.clothing_type);
    byType.set(t, (byType.get(t) ?? 0) + item.count);
  }
  const parts = [...byType.entries()]
    .filter(([, count]) => count > 0)
    .map(([type, count]) => {
      const label = typePluralHe[type] ?? clothingTypeLabel[type].replace(/[^\u0590-\u05FF\s/a-zA-Z]/g, '').trim();
      return `${count} ${label}`;
    });
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} ו-${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')} ו-${parts[parts.length - 1]}`;
}

export function buildBoxSummaryHe(boxNumber: number, newSize: string, items: GrowthScanItem[]): string {
  const counts = formatTypeCounts(items);
  if (!counts) return `לא נמצאו פריטים במידה ${newSize} בקופסה מספר ${boxNumber}`;
  return `נמצאו ${counts} במידה ${newSize} בקופסה מספר ${boxNumber}`;
}

export function buildOutdatedClosetSummaryHe(childName: string, oldSize: string, count: number): string {
  if (count === 0) return `אין פריטים במידה ${oldSize} בארון של ${childName}`;
  return `שים לב: בארון של ${childName} יש ${count} פריטים במידה הישנה ${oldSize}`;
}

interface RawBoxItem {
  id: string;
  clothing_type: string;
  season: string;
  box_id: string;
  boxes: { box_number: number } | null;
}

export function aggregateGrowthScan(
  childName: string,
  oldSize: string,
  newSize: string,
  boxedRaw: RawBoxItem[],
  outdatedIds: string[]
): GrowthScanResult {
  const boxMap = new Map<string, { box_number: number; box_id: string; items: Map<string, GrowthScanItem> }>();

  for (const row of boxedRaw) {
    const boxId = row.box_id;
    const boxNumber = row.boxes?.box_number ?? 0;
    if (!boxMap.has(boxId)) {
      boxMap.set(boxId, { box_number: boxNumber, box_id: boxId, items: new Map() });
    }
    const group = boxMap.get(boxId)!;
    const type = normalizeClothingType(row.clothing_type);
    const season = row.season as Season;
    const key = `${type}:${season}`;
    const existing = group.items.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      group.items.set(key, { clothing_type: type, season, count: 1 });
    }
  }

  const boxed: GrowthScanBoxGroup[] = [...boxMap.values()]
    .sort((a, b) => a.box_number - b.box_number)
    .map((g) => {
      const items = [...g.items.values()];
      return {
        box_number: g.box_number,
        box_id: g.box_id,
        items,
        summary_he: buildBoxSummaryHe(g.box_number, newSize, items),
      };
    });

  const count = outdatedIds.length;
  return {
    boxed,
    outdated_closet: {
      count,
      item_ids: outdatedIds,
      summary_he: buildOutdatedClosetSummaryHe(childName, oldSize, count),
    },
  };
}

export function formatSeasonTypeDetail(items: GrowthScanItem[]): string {
  return items
    .map((i) => `${clothingTypeLabel[i.clothing_type].replace(/[^\u0590-\u05FF\s/a-zA-Z]/g, '').trim()} (${seasonLabel[i.season]}): ${i.count}`)
    .join(' · ');
}
