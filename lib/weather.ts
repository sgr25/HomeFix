import type { WeatherDay } from '@/types';

interface OWMForecastItem {
  dt: number;
  main: { temp_min: number; temp_max: number };
  weather: Array<{ description: string; icon: string }>;
  rain?: { '3h': number };
  pop: number;
}

interface OWMResponse {
  list: OWMForecastItem[];
}

/**
 * Fetches a 7-day daily weather forecast from OpenWeatherMap.
 * Uses the free /forecast endpoint (3-hour intervals) and aggregates by day.
 */
export async function getWeeklyForecast(): Promise<WeatherDay[]> {
  const city = process.env.NEXT_PUBLIC_WEATHER_CITY ?? 'Tel Aviv';
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) throw new Error('OPENWEATHER_API_KEY is not set');

  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&cnt=56`;
  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (!res.ok) throw new Error(`OpenWeatherMap error: ${res.status}`);

  const data: OWMResponse = await res.json();

  // Group 3-hour slots by date, aggregate min/max temp, pick midday icon
  const byDay: Record<string, OWMForecastItem[]> = {};
  for (const item of data.list) {
    const date = new Date(item.dt * 1000).toISOString().slice(0, 10);
    if (!byDay[date]) byDay[date] = [];
    byDay[date].push(item);
  }

  return Object.entries(byDay)
    .slice(0, 7)
    .map(([date, slots]) => {
      const temps = slots.map((s) => s.main.temp_min).concat(slots.map((s) => s.main.temp_max));
      const midday = slots.find((s) => new Date(s.dt * 1000).getHours() >= 12) ?? slots[0];
      const rain = slots.reduce((acc, s) => acc + (s.rain?.['3h'] ?? 0), 0);
      return {
        date,
        temp_min: Math.round(Math.min(...temps)),
        temp_max: Math.round(Math.max(...temps)),
        description: midday.weather[0].description,
        icon: midday.weather[0].icon,
        precipitation: Math.round(rain * 10) / 10,
      };
    });
}
