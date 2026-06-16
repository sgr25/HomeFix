import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ארון חכם — ניהול מלאי בגדים',
  description: 'ניהול חכם של בגדי ילדים, קופסאות אחסון, ומעבר עונות',
  appleWebApp: { capable: true, title: 'ארון חכם' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="flex min-h-screen bg-slate-50 pb-14 md:pb-0">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
