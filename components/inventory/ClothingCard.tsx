'use client';

import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ClothingItem } from '@/types';

const seasonLabel: Record<string, string> = {
  summer: 'קיץ',
  winter: 'חורף',
  transition: 'מעבר',
};

const statusLabel: Record<string, string> = {
  in_closet: 'בארון',
  laundry: 'כביסה',
  in_box: 'בקופסה',
};

const statusColor: Record<string, string> = {
  in_closet: 'bg-green-100 text-green-800',
  laundry:   'bg-yellow-100 text-yellow-800',
  in_box:    'bg-blue-100 text-blue-800',
};

interface Props {
  item: ClothingItem;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export default function ClothingCard({ item, onDelete, compact = false }: Props) {
  return (
    <div
      className={cn(
        'group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow',
        compact ? 'w-28' : 'w-40'
      )}
    >
      <div className={cn('relative bg-slate-100', compact ? 'h-28' : 'h-40')}>
        <Image
          src={item.image_url}
          alt={`${item.size} ${item.season}`}
          fill
          className="object-cover"
          sizes="160px"
        />
      </div>

      <div className="p-2 space-y-1">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <span className="text-xs font-semibold text-slate-700">{item.size}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {seasonLabel[item.season]}
          </Badge>
        </div>

        <div className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium w-fit', statusColor[item.status])}>
          {statusLabel[item.status]}
        </div>

        {item.child_name && (
          <p className="text-[10px] text-slate-500 truncate">{item.child_name}</p>
        )}
        {item.boxes && (
          <p className="text-[10px] text-slate-500">קופסה #{item.boxes.box_number}</p>
        )}
      </div>

      {onDelete && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-1 left-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}
