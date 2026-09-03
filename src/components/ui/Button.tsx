import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:   'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  ghost:     'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
  danger:    'text-rose-500 hover:text-rose-700 hover:bg-rose-50',
};

const SIZES: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-xs rounded-md gap-1',
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-1.5',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center font-medium transition-colors
        disabled:opacity-40 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
    </button>
  );
}
