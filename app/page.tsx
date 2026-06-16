'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Sparkles, Package, WashingMachine, Shirt } from 'lucide-react';
import WeeklyStyleMatrix from '@/components/dashboard/WeeklyStyleMatrix';
import SetupChecklist from '@/components/onboarding/SetupChecklist';
import { fetchJson } from '@/lib/api';
import { notify } from '@/lib/toast';
import type { DayOutfit, WeatherDay, ClothingItem, Child, Box } from '@/types';

export default function DashboardPage() {
  const [outfits, setOutfits]       = useState<DayOutfit[]>([]);
  const [forecast, setForecast]     = useState<WeatherDay[] | null>(null);
  const [clothesMap, setClothesMap] = useState<Record<string, ClothingItem>>({});
  const [stylistLoading, setStylistLoading] = useState(false);

  const [stats, setStats] = useState({ total: 0, laundry: 0, inBox: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [childrenCount, setChildrenCount] = useState(0);
  const [boxesCount, setBoxesCount] = useState(0);

  const [seasonal, setSeasonal]     = useState('');
  const [seasonalLoading, setSeasonalLoading] = useState(false);

  // Load stats
  useEffect(() => {
    Promise.all([
      fetchJson<ClothingItem[]>('/api/clothes'),
      fetchJson<Child[]>('/api/children'),
      fetchJson<Box[]>('/api/boxes'),
    ]).then(([all, children, boxes]) => {
      if (Array.isArray(all)) {
        setStats({
          total:   all.length,
          laundry: all.filter((c) => c.status === 'laundry').length,
          inBox:   all.filter((c) => c.status === 'in_box').length,
        });
        const map: Record<string, ClothingItem> = {};
        all.forEach((c) => { map[c.id] = c; });
        setClothesMap(map);
      }
      setChildrenCount(Array.isArray(children) ? children.length : 0);
      setBoxesCount(Array.isArray(boxes) ? boxes.length : 0);
      setStatsLoading(false);
    }).catch(() => setStatsLoading(false));
  }, []);

  const loadStylist = useCallback(() => {
    setStylistLoading(true);
    fetch('/api/agents/stylist')
      .then((r) => r.json())
      .then(({ outfits: o, forecast: f }) => {
        setOutfits(Array.isArray(o) ? o : []);
        setForecast(Array.isArray(f) ? f : null);
        setStylistLoading(false);
      })
      .catch(() => setStylistLoading(false));
  }, []);

  const handleWornToday = async (_date: string, itemIds: string[]) => {
    await fetch('/api/agents/stylist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_ids: itemIds }),
    });
    // Refresh stats
    const allRes = await fetch('/api/clothes').then((r) => r.json());
    if (Array.isArray(allRes)) {
      setStats({
        total:   allRes.length,
        laundry: allRes.filter((c: ClothingItem) => c.status === 'laundry').length,
        inBox:   allRes.filter((c: ClothingItem) => c.status === 'in_box').length,
      });
    }
  };

  const generateSeasonalReport = async () => {
    setSeasonalLoading(true);
    setSeasonal('');
    try {
      const res = await fetch('/api/agents/seasonal', { method: 'POST' });
      const { report } = await res.json();
      setSeasonal(report ?? '');
    } catch {
      setSeasonal('שגיאה בייצור הדוח');
    }
    setSeasonalLoading(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">ארון חכם</h1>
        <p className="text-slate-500">ניהול מלאי בגדים לכל המשפחה</p>
      </div>

      <SetupChecklist
        childrenCount={childrenCount}
        clothesCount={stats.total}
        boxesCount={boxesCount}
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'סה״כ פריטים', value: stats.total,   href: '/inventory',              icon: Shirt,         color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'בכביסה',      value: stats.laundry,  href: '/laundry',                icon: WashingMachine, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'בקופסאות',    value: stats.inBox,    href: '/boxes', icon: Package,        color: 'text-slate-600',  bg: 'bg-slate-100' },
        ].map(({ label, value, href, icon: Icon, color, bg }) => (
          <Link
            key={label}
            href={href}
            aria-label={statsLoading ? `צפה ב${label}` : `צפה ב${label} — ${value} פריטים`}
            className={`flex items-center gap-4 ${bg} rounded-2xl p-5 border border-white shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-[1.01]`}
          >
            <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              {statsLoading
                ? <Skeleton className="h-7 w-16" />
                : <p className={`text-2xl font-bold ${color}`}>{value}</p>
              }
              <p className="text-sm text-slate-600">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Stylist matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <WeeklyStyleMatrix
          outfits={outfits}
          forecast={forecast}
          clothesMap={clothesMap}
          onWornToday={handleWornToday}
          onRefresh={loadStylist}
          loading={stylistLoading}
        />
      </div>

      {/* Seasonal Logistics Agent */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              דוח היערכות עונתית
            </h2>
            <p className="text-sm text-slate-500">ניתוח אילו קופסאות כדאי להוציא לקראת העונה</p>
          </div>
          <Button
            onClick={generateSeasonalReport}
            disabled={seasonalLoading}
            variant="outline"
            className="gap-2"
          >
            {seasonalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            צור דוח
          </Button>
        </div>

        {seasonal && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{seasonal}</p>
          </div>
        )}
      </div>
    </div>
  );
}
