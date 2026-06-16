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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/',          label: 'לוח',    icon: LayoutDashboard },
  { href: '/children',  label: 'ילדים',  icon: Users },
  { href: '/inventory', label: 'בגדים',  icon: Shirt },
  { href: '/boxes',     label: 'ארגזים', icon: Box },
  { href: '/laundry',   label: 'כביסה',  icon: WashingMachine },
];

export default function MobileNav() {
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
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-800 border-t border-slate-700 safe-area-pb"
      aria-label="ניווט ראשי"
    >
      <div className="flex items-stretch justify-around">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          const isLaundry = href === '/laundry';
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[56px] py-2 text-[10px] font-medium transition-colors',
                active ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" aria-hidden />
              {label}
              {isLaundry && laundryCount > 0 && (
                <span className="absolute top-1 left-1/2 translate-x-3 min-w-[16px] h-4 px-1 rounded-full bg-yellow-500 text-[9px] font-bold text-slate-900 flex items-center justify-center">
                  {laundryCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
