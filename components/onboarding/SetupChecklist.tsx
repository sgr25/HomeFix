'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

const STORAGE_KEY = 'onboarding_done';

interface Props {
  childrenCount: number;
  clothesCount: number;
  boxesCount: number;
}

export default function SetupChecklist({ childrenCount, clothesCount, boxesCount }: Props) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(!!localStorage.getItem(STORAGE_KEY));
  }, []);

  if (hidden) return null;
  if (childrenCount > 0 && clothesCount >= 3) return null;

  const items = [
    { done: childrenCount > 0, label: 'הוסף ילד/ה', href: '/children' },
    { done: clothesCount >= 3, label: 'העלה לפחות 3 בגדים', href: '/upload' },
    { done: boxesCount > 0, label: 'צור קופסת אחסון', href: '/boxes' },
  ];

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 space-y-3">
      <h3 className="font-semibold text-indigo-900 text-sm">הגדרה ראשונית</h3>
      <ul className="space-y-2">
        {items.map(({ done, label, href }) => (
          <li key={href} className="flex items-center gap-2 text-sm">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center ${done ? 'bg-green-500 text-white' : 'bg-white border border-indigo-300'}`}>
              {done && <Check className="w-3 h-3" />}
            </span>
            {done ? (
              <span className="text-slate-500 line-through">{label}</span>
            ) : (
              <Link href={href} className="text-indigo-700 hover:underline">{label}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
