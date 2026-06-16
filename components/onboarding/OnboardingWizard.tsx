'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Users, Upload, Box, ArrowLeft } from 'lucide-react';

const STORAGE_KEY = 'onboarding_done';

export default function OnboardingWizard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [stats, setStats] = useState({ children: 0, clothes: 0, boxes: 0 });

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    Promise.all([
      fetch('/api/children').then((r) => r.json()),
      fetch('/api/clothes').then((r) => r.json()),
      fetch('/api/boxes').then((r) => r.json()),
    ]).then(([c, cl, b]) => {
      const children = Array.isArray(c) ? c.length : 0;
      const clothes = Array.isArray(cl) ? cl.length : 0;
      const boxes = Array.isArray(b) ? b.length : 0;
      setStats({ children, clothes, boxes });
      if (children === 0) setOpen(true);
      else if (clothes === 0) setOpen(true);
      else localStorage.setItem(STORAGE_KEY, '1');
    }).catch(() => {});
  }, []);

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  };

  const steps = [
    {
      title: 'ברוכים הבאים לארון חכם!',
      body: 'ננהל יחד את בגדי המשפחה — ילדים, מידות, קופסאות וכביסה.',
      action: () => setStep(1),
      actionLabel: 'בואו נתחיל',
    },
    {
      title: 'שלב 1: הוסף ילד/ה',
      body: 'הגדר שם ומידות נוכחיות לכל ילד.',
      action: () => { finish(); router.push('/children'); },
      actionLabel: 'לדף ילדים',
      icon: <Users className="w-10 h-10 text-purple-500" />,
    },
    {
      title: 'שלב 2: העלה בגדים',
      body: 'גרור תמונות או הוסף פריטים ללא תמונה.',
      action: () => { finish(); router.push('/inventory'); },
      actionLabel: 'להעלאה',
      icon: <Upload className="w-10 h-10 text-indigo-500" />,
    },
    {
      title: 'שלב 3: קופסאות (אופציונלי)',
      body: 'ארגן בגדי עונה בקופסאות ממוספרות.',
      action: () => { finish(); router.push('/boxes'); },
      actionLabel: 'לקופסאות',
      icon: <Box className="w-10 h-10 text-blue-500" />,
    },
  ];

  const current = step === 0 ? steps[0] : stats.children === 0 ? steps[1] : stats.clothes === 0 ? steps[2] : steps[3];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) finish(); else setOpen(v); }}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>{current.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {current.icon && <div className="flex justify-center">{current.icon}</div>}
          <p className="text-sm text-slate-600">{current.body}</p>
          <div className="flex gap-2">
            <Button onClick={current.action} className="flex-1 gap-2">
              {current.actionLabel}
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={finish}>דלג</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
