import type { ReactNode } from 'react';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger:  'bg-rose-50 text-rose-700',
  info:    'bg-indigo-50 text-indigo-700',
  muted:   'bg-slate-50 text-slate-500',
};

interface Props {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'neutral', className = '' }: Props) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  );
}
