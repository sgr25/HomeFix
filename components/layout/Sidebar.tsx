'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Box,
  WashingMachine,
  Shirt,
  Users,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/',          label: 'לוח הבקרה',  icon: LayoutDashboard },
  { href: '/children',  label: 'ילדים',       icon: Users },
  { href: '/inventory', label: 'בגדים',       icon: Shirt },
  { href: '/upload',    label: 'העלאה',       icon: Upload },
  { href: '/boxes',     label: 'קופסאות',     icon: Box },
  { href: '/laundry',   label: 'כביסה',       icon: WashingMachine },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [laundryCount, setLaundryCount] = useState(0);

  useEffect(() => {
    fetch('/api/clothes?status=laundry')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLaundryCount(data.length);
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <aside className="no-print hidden md:flex flex-col w-60 min-h-screen bg-slate-800 text-slate-100 shrink-0">
      <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-700">
        <Shirt className="w-7 h-7 text-blue-400" />
        <div>
          <p className="font-bold text-sm leading-tight">ארון חכם</p>
          <p className="text-xs text-slate-400">ניהול מלאי בגדים</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="ניווט ראשי">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          const showBadge = href === '/laundry' && laundryCount > 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              )}
              dir="rtl"
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden />
              <span className="flex-1">{label}</span>
              {showBadge && (
                <Badge className="bg-yellow-500 text-slate-900 hover:bg-yellow-500 text-[10px] px-1.5 min-w-[20px] justify-center">
                  {laundryCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700">
        <p className="px-2 text-xs text-slate-500">Smart Wardrobe v1.0</p>
      </div>
    </aside>
  );
}
