import { toast } from 'sonner';

export const notify = {
  saved: (msg = 'נשמר בהצלחה') => toast.success(msg),
  deleted: (msg = 'נמחק בהצלחה') => toast.success(msg),
  error: (msg = 'שגיאה — נסה שוב') => toast.error(msg),
  itemSaved: () => toast.success('הפריט נשמר'),
  itemDeleted: (onUndo?: () => void | Promise<void>) => {
    if (onUndo) {
      toast.success('הפריט נמחק', {
        action: {
          label: 'ביטול',
          onClick: () => { void onUndo(); },
        },
        duration: 5000,
      });
    } else {
      toast.success('הפריט נמחק');
    }
  },
  bulkUpdated: (count: number) => toast.success(`${count} פריטים עודכנו`),
  uploaded: (count: number) => toast.success(`${count} פריטים נשמרו`),
};
