'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Sparkles, Package, WashingMachine, Shirt } from 'lucide-react';
import WeeklyStyleMatrix from '@/components/dashboard/WeeklyStyleMatrix';
import SetupChecklist from '@/components/onboarding/SetupChecklist';
import { fetchJson } from '@/lib/api';
import type { DayOutfit, WeatherDay, ClothingItem, Child, Box } from '@/types';

export default function DashboardPage() {
  const [outfits, setOutfits]       = useState<DayOutfit[]>([]);
  const [forecast, setForecast]     = useState<WeatherDay[] | null>(null);
  const [clothesMap, setClothesMap] = useState<Record<string, ClothingItem>>({});
  const [stylistLoading, setStylistLoading] = useState(false);
  const [stylistError, setStylistError] = useState<string | null>(null);

  const [stats, setStats] = useState({ total: 0, laundry: 0, inBox: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [childrenCount, setChildrenCount] = useState(0);
  const [boxesCount, setBoxesCount] = useState(0);

  const [seasonal, setSeasonal]     = useState('');
  const [seasonalLoading, setSeasonalLoading] = useState(false);
  const [seasonalError, setSeasonalError] = useState<string | null>(null);

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

  const STYLIST_ERROR_MSG =
    'לא הצלחנו לייצר תוכנית לבוש. ודא שיש בגדים בארון, שהמפתחות תקינים, או נסה שנית מאוחר יותר';

  const loadStylist = useCallback(async () => {
    setStylistError(null);
    setStylistLoading(true);
    try {
      const r = await fetch('/api/agents/stylist');
      const body = await r.json();
      if (!r.ok) {
        throw new Error(
          typeof body.error === 'string' ? body.error : 'שגיאה בחיבור לסוכן הסטייליסט'
        );
      }
      const outfitsList = Array.isArray(body.outfits) ? body.outfits : [];
      if (outfitsList.length === 0) {
        setStylistError(STYLIST_ERROR_MSG);
        setOutfits([]);
        setForecast(null);
      } else {
        setOutfits(outfitsList);
        setForecast(Array.isArray(body.forecast) ? body.forecast : null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : STYLIST_ERROR_MSG;
      setStylistError(msg === 'שגיאה בחיבור לסוכן הסטייליסט' ? STYLIST_ERROR_MSG : msg);
      setOutfits([]);
      setForecast(null);
    } finally {
      setStylistLoading(false);
    }
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
    setSeasonalError(null);
    try {
      const res = await fetch('/api/agents/seasonal', { method: 'POST' });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(typeof body.error === 'string' ? body.error : 'שגיאה בהפקת הדוח העונתי');
      }

      if (!body.report) {
        throw new Error('השרת לא החזיר תוכן עבור הדוח');
      }

      setSeasonal(body.report);
    } catch (err) {
      console.error(err);
      setSeasonalError(
        err instanceof Error
          ? err.message
          : 'לא הצלחנו לייצר את הדוח העונתי. אנא נסה שנית מאוחר יותר.'
      );
    } finally {
      setSeasonalLoading(false);
    }
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
          { label: 'בארגזים',    value: stats.inBox,    href: '/boxes', icon: Package,        color: 'text-slate-600',  bg: 'bg-slate-100' },
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
        {stylistError && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            dir="rtl"
          >
            {stylistError}
          </div>
        )}
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
            <p className="text-sm text-slate-500">ניתוח אילו ארגזים כדאי להוציא לקראת העונה</p>
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

        {seasonalError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            dir="rtl"
          >
            {seasonalError}
          </div>
        )}

        {seasonal && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{seasonal}</p>
          </div>
        )}
      </div>
    </div>
  );
}
