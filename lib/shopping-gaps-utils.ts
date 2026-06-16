import type { ClothingType, Season } from '@/types';
import { CLOTHING_TYPE_VALUES, clothingMatchesChildGender, clothingTypeLabel, getChildCurrentSize, normalizeClothingType, seasonLabel } from '@/lib/clothes-utils';
import type { Child, ClothingItem } from '@/types';

export interface ShoppingGapCategory {
  clothing_type: ClothingType;
  label: string;
  count: number;
}

export interface ShoppingGapSeason {
  season: Season;
  season_label: string;
  categories: ShoppingGapCategory[];
}

export interface ShoppingGapChild {
  name: string;
  current_size: string;
  seasons: ShoppingGapSeason[];
}

export interface ShoppingGapsReport {
  generated_at: string;
  children: ShoppingGapChild[];
}

const SEASONS: Season[] = ['summer', 'winter', 'transition'];

function itemMatchesChild(item: ClothingItem, child: Child, size: string): boolean {
  if (item.size !== size) return false;
  if (!clothingMatchesChildGender(item.gender, child.gender)) return false;
  if (item.child_name === child.name) return true;
  if (item.child_name == null) return true;
  return false;
}

export function buildShoppingGapsReport(
  children: Child[],
  clothes: ClothingItem[]
): ShoppingGapsReport {
  const reportChildren: ShoppingGapChild[] = [];

  for (const child of children) {
    const size = getChildCurrentSize(child);
    if (!size) continue;

    const matching = clothes.filter((item) => itemMatchesChild(item, child, size));

    const seasons: ShoppingGapSeason[] = SEASONS.map((season) => {
      const seasonItems = matching.filter((i) => i.season === season);
      const countByType = new Map<ClothingType, number>();

      for (const item of seasonItems) {
        const t = normalizeClothingType(item.clothing_type);
        countByType.set(t, (countByType.get(t) ?? 0) + 1);
      }

      const categories: ShoppingGapCategory[] = CLOTHING_TYPE_VALUES
        .filter((t) => t !== 'unassigned')
        .map((clothing_type) => ({
          clothing_type,
          label: clothingTypeLabel[clothing_type].replace(/[^\u0590-\u05FF\s/a-zA-Z]/g, '').trim(),
          count: countByType.get(clothing_type) ?? 0,
        }));

      return {
        season,
        season_label: seasonLabel[season],
        categories,
      };
    });

    reportChildren.push({
      name: child.name,
      current_size: size,
      seasons,
    });
  }

  return {
    generated_at: new Date().toISOString(),
    children: reportChildren,
  };
}
