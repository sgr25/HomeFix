'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onFiles: (files: File[]) => void;
}

export default function Dropzone({ onFiles }: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => { if (accepted.length) onFiles(accepted); },
    [onFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-colors',
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40'
      )}
      dir="rtl"
    >
      <input {...getInputProps()} />
      <UploadCloud className={cn('w-12 h-12 transition-colors', isDragActive ? 'text-blue-500' : 'text-slate-400')} />
      <div className="text-center">
        <p className="font-semibold text-slate-700">
          {isDragActive ? 'שחרר את הקבצים כאן...' : 'גרור תמונות לכאן'}
        </p>
        <p className="text-sm text-slate-500 mt-1">או לחץ לבחירת קבצים (JPG, PNG, WEBP)</p>
      </div>
    </div>
  );
}
