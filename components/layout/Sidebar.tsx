'use client';

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
  { href: '/',          label: 'לוח הבקרה',  icon: LayoutDashboard },
  { href: '/children',  label: 'ילדים',       icon: Users },
  { href: '/inventory', label: 'בגדים',       icon: Shirt },
  { href: '/boxes',     label: 'קופסאות',     icon: Box },
  { href: '/laundry',   label: 'כביסה',       icon: WashingMachine },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="no-print flex flex-col w-60 min-h-screen bg-slate-800 text-slate-100 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-700">
        <Shirt className="w-7 h-7 text-blue-400" />
        <div>
          <p className="font-bold text-sm leading-tight">ארון חכם</p>
          <p className="text-xs text-slate-400">ניהול מלאי בגדים</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
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
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 text-xs text-slate-500 border-t border-slate-700">
        Smart Wardrobe v1.0
      </div>
    </aside>
  );
}
