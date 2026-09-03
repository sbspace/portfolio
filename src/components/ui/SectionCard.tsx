import type { ReactNode } from 'react';

interface Props {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionCard({ title, description, action, children, className = '', noPadding = false }: Props) {
  const hasHeader = title || action;
  return (
    <div className={`bg-white rounded-xl border border-slate-100 shadow-sm ${className}`}>
      {hasHeader && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            {title && <h2 className="text-sm font-semibold text-slate-700">{title}</h2>}
            {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}
