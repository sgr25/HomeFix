export type Season = 'summer' | 'winter' | 'transition';
export type ClothingStatus = 'in_closet' | 'laundry' | 'in_box';
export type Gender = 'boys' | 'girls' | 'unassigned';
export type ChildGender = 'boys' | 'girls';
export type ClothingType =
  | 'set'
  | 'shirt'
  | 'pants'
  | 'skirt'
  | 'jumper'
  | 'pajamas'
  | 'overall'
  | 'dress'
  | 'underwear'
  | 'tights'
  | 'socks'
  | 'hair_accessory'
  | 'unassigned';

export const DEFAULT_GENDER: Gender = 'unassigned';
export const DEFAULT_CLOTHING_TYPE: ClothingType = 'unassigned';

export interface Child {
  name: string;
  current_size: string;
  current_sizes: string[];
  active: boolean;
  gender: ChildGender | null;
}

export interface Box {
  id: string;
  box_number: number;
  description: string | null;
}

export interface ClothingItem {
  id: string;
  child_name: string | null;
  size: string;
  season: Season;
  gender?: Gender;
  clothing_type: ClothingType;
  image_url: string | null;
  status: ClothingStatus;
  box_id: string | null;
  set_name?: string | null;
  updated_at: string;
  // Joined fields
  boxes?: Box | null;
  children?: Child | null;
}

export interface PendingItem {
  id: string;
  file: File | null;
  preview: string | null;
  size: string;
  season: Season | '';
  gender: Gender | '';
  clothing_type: ClothingType | '';
  status: ClothingStatus;
  child_name: string;
  box_number: string;
  set_name: string;
  uploading: boolean;
  saved: boolean;
  error?: string;
}

// Wardrobe Stylist Agent output (enforced via Gemini responseSchema)
export interface DayOutfit {
  date: string;       // ISO "YYYY-MM-DD"
  child_name: string;
  items: string[];    // clothing UUIDs
}

// Weather forecast day
export interface WeatherDay {
  date: string;
  temp_min: number;
  temp_max: number;
  description: string;
  icon: string; // OpenWeatherMap icon code e.g. "01d"
  precipitation: number; // mm
}
