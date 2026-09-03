import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-stretch gap-3 mb-6 md:flex-row md:items-start md:justify-between md:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {action && (
        <div className="flex min-w-0 w-full items-center gap-2 md:w-auto md:flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
