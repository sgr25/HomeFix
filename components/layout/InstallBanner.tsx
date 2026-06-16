'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('pwa_banner_dismissed')) return;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isMobile && !isStandalone) {
      setDismissed(false);
      setShow(true);
    }
  }, []);

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-[72px] md:bottom-4 inset-x-4 md:inset-x-auto md:left-4 md:max-w-sm z-40 bg-white border border-slate-200 rounded-xl shadow-lg p-4 flex gap-3 items-start" dir="rtl">
      <Download className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium text-slate-800">הוסף למסך הבית</p>
        <p className="text-xs text-slate-500">לגישה מהירה לארון חכם מהטלפון</p>
        <p className="text-xs text-slate-400">Safari: שתף → הוסף למסך הבית | Chrome: תפריט → התקן</p>
      </div>
      <button
        onClick={() => { setDismissed(true); localStorage.setItem('pwa_banner_dismissed', '1'); }}
        className="text-slate-400 hover:text-slate-600"
        aria-label="סגור"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}
