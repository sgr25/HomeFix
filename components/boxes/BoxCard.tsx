'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, Printer, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Box, ClothingItem } from '@/types';

const seasonLabel: Record<string, string> = { summer: 'קיץ', winter: 'חורף', transition: 'מעבר' };

interface Props {
  box: Box;
  items: ClothingItem[];
}

export default function BoxCard({ box, items }: Props) {
  const [expanded, setExpanded] = useState(false);

  const handlePrint = () => {
    const html = `
<!DOCTYPE html><html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<title>קופסה #${box.box_number}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  p  { color: #555; margin: 0 0 16px; font-size: 13px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .item { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; text-align: center; }
  .item img { width: 100%; height: 120px; object-fit: cover; }
  .info { padding: 6px; font-size: 11px; }
  .size { font-weight: bold; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<h1>קופסה #${box.box_number}</h1>
<p>${box.description ?? ''} — ${items.length} פריטים</p>
<div class="grid">
${items.map((i) => `
  <div class="item">
    <img src="${i.image_url}" alt="${i.size}" />
    <div class="info">
      <div class="size">${i.size}</div>
      <div>${seasonLabel[i.season]}</div>
      ${i.child_name ? `<div>${i.child_name}</div>` : ''}
    </div>
  </div>`).join('')}
</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">קופסה #{box.box_number}</p>
            {box.description && (
              <p className="text-xs text-slate-500">{box.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary">{items.length} פריטים</Badge>
          <Button
            size="icon"
            variant="outline"
            className="w-8 h-8"
            onClick={(e) => { e.stopPropagation(); handlePrint(); }}
            title="הדפס מניפסט"
          >
            <Printer className="w-4 h-4" />
          </Button>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded gallery */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4">
          {items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">הקופסה ריקה</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col items-center gap-1 w-24"
                  title={`${item.size} — ${seasonLabel[item.season]}`}
                >
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-slate-100">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.size} fill className="object-cover" sizes="96px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400">ללא תמונה</div>
                    )}
                  </div>
                  <p className="text-[10px] font-semibold text-slate-600">{item.size}</p>
                  {item.child_name && <p className="text-[10px] text-slate-400">{item.child_name}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
