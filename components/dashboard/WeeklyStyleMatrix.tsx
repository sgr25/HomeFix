'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Loader2, CheckCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import WeatherIcon from './WeatherIcon';
import type { DayOutfit, WeatherDay, ClothingItem } from '@/types';

interface Props {
  outfits: DayOutfit[];
  forecast: WeatherDay[] | null;
  clothesMap: Record<string, ClothingItem>;
  onWornToday: (date: string, itemIds: string[]) => Promise<void>;
  onRefresh: () => void;
  loading: boolean;
}

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function dayLabel(iso: string) {
  const d = new Date(iso);
  return DAYS_HE[d.getDay()];
}

export default function WeeklyStyleMatrix({
  outfits, forecast, clothesMap, onWornToday, onRefresh, loading,
}: Props) {
  const [wornLoading, setWornLoading] = useState<string | null>(null);

  const uniqueDates = [...new Set(outfits.map((o) => o.date))].slice(0, 7);
  const uniqueChildren = [...new Set(outfits.map((o) => o.child_name))];
  const forecastMap: Record<string, WeatherDay> = {};
  if (forecast) forecast.forEach((f) => { forecastMap[f.date] = f; });

  const handleWorn = async (date: string, outfitRow: DayOutfit) => {
    setWornLoading(`${date}-${outfitRow.child_name}`);
    await onWornToday(date, outfitRow.items);
    setWornLoading(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800">המלצת לבוש שבועית</h2>
        <Button
          onClick={onRefresh}
          disabled={loading}
          className="gap-2 bg-gradient-to-l from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md px-5"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Sparkles className="w-4 h-4" />}
          {loading ? 'מייצר תוכנית...' : 'צור תוכנית הלבשה שבועית'}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : outfits.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
          <Sparkles className="w-8 h-8 text-indigo-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">לחץ על הכפתור כדי לייצר תוכנית הלבשה שבועית</p>
          <p className="text-xs text-slate-400 mt-1">המערכת תציע תלבושות מותאמות לפי מזג האוויר</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" dir="rtl">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-2 pr-3 text-slate-500 font-medium w-28">ילד</th>
                {uniqueDates.map((date) => {
                  const weather = forecastMap[date];
                  return (
                    <th key={date} className="py-2 px-2 text-center font-medium text-slate-700 min-w-28">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs text-slate-500">{dayLabel(date)}</span>
                        <span className="text-[10px] text-slate-400">{date.slice(5)}</span>
                        {weather && (
                          <div className="flex flex-col items-center -mt-1">
                            <WeatherIcon icon={weather.icon} size={32} />
                            <span className="text-[10px] text-slate-500">
                              {weather.temp_min}°–{weather.temp_max}°
                            </span>
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {uniqueChildren.map((child) => (
                <tr key={child} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 pr-3 font-semibold text-slate-700">{child}</td>
                  {uniqueDates.map((date) => {
                    const outfit = outfits.find((o) => o.date === date && o.child_name === child);
                    const key = `${date}-${child}`;
                    return (
                      <td key={date} className="py-3 px-2 text-center">
                        {outfit ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="flex gap-1 justify-center flex-wrap">
                              {outfit.items.slice(0, 2).map((itemId) => {
                                const item = clothesMap[itemId];
                                return item ? (
                                  <div key={itemId} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                                    <Image src={item.image_url} alt={item.size} fill className="object-cover" sizes="48px" />
                                  </div>
                                ) : null;
                              })}
                            </div>
                            {date === new Date().toISOString().slice(0, 10) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-2 gap-0.5"
                                disabled={wornLoading === key}
                                onClick={() => handleWorn(date, outfit)}
                              >
                                {wornLoading === key
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <CheckCheck className="w-3 h-3" />}
                                נלבש
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
