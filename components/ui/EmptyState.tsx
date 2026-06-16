import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="text-center py-20 text-slate-400">
      {icon && <div className="mb-3 flex justify-center opacity-40">{icon}</div>}
      <p className="text-lg font-medium text-slate-500">{title}</p>
      {description && <p className="text-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
