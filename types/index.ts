export type Season = 'summer' | 'winter' | 'transition';
export type ClothingStatus = 'in_closet' | 'laundry' | 'in_box';

export interface Child {
  name: string;
  current_sizes: string[];
  active: boolean;
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
  image_url: string;
  status: ClothingStatus;
  box_id: string | null;
  updated_at: string;
  // Joined fields
  boxes?: Box | null;
  children?: Child | null;
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
