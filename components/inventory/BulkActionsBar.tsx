'use client';

import { useState } from 'react';
import { Trash2, WashingMachine, Shirt, Package, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Box, Child } from '@/types';

interface Props {
  selectedCount: number;
  boxes: Box[];
  childrenList: Child[];
  saving: boolean;
  onLaundry: () => void;
  onCloset: () => void;
  onBox: (boxId: string) => void;
  onAssignChild: (childName: string) => void;
  onDelete: () => void;
  onClear: () => void;
}

export default function BulkActionsBar({
  selectedCount,
  boxes,
  childrenList,
  saving,
  onLaundry,
  onCloset,
  onBox,
  onAssignChild,
  onDelete,
  onClear,
}: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <div
        className="fixed bottom-16 md:bottom-0 inset-x-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-700 shrink-0">
            {selectedCount} פריטים נבחרו
          </span>

          <Button size="sm" variant="outline" disabled={saving} onClick={onLaundry} className="gap-1">
            <WashingMachine className="w-3.5 h-3.5" /> לכביסה
          </Button>
          <Button size="sm" variant="outline" disabled={saving} onClick={onCloset} className="gap-1">
            <Shirt className="w-3.5 h-3.5" /> לארון
          </Button>

          {boxes.length > 0 && (
            <Select onValueChange={onBox} disabled={saving}>
              <SelectTrigger className="h-8 w-36 text-xs gap-1">
                <Package className="w-3.5 h-3.5 shrink-0" />
                <SelectValue placeholder="ארוז בקופסה" />
              </SelectTrigger>
              <SelectContent>
                {boxes.map((b) => (
                  <SelectItem key={b.id} value={b.id}>ארגז #{b.box_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {childrenList.length > 0 && (
            <Select onValueChange={onAssignChild} disabled={saving}>
              <SelectTrigger className="h-8 w-36 text-xs gap-1">
                <User className="w-3.5 h-3.5 shrink-0" />
                <SelectValue placeholder="שייך לילד" />
              </SelectTrigger>
              <SelectContent>
                {childrenList.map((c) => (
                  <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            size="sm"
            variant="destructive"
            disabled={saving}
            onClick={() => setDeleteOpen(true)}
            className="gap-1"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            מחק
          </Button>

          <Button size="sm" variant="ghost" disabled={saving} onClick={onClear} className="text-xs mr-auto">
            נקה בחירה
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת {selectedCount} פריטים</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק לצמיתות את כל הפריטים שנבחרו מהמערכת. לא ניתן לבטל.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { setDeleteOpen(false); onDelete(); }}
            >
              מחק הכל
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
