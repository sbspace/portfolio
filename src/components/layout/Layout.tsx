import type { ReactNode } from 'react';
import type { Page } from '@/types';
import { Navigation } from './Navigation';

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

export function Layout({ currentPage, onNavigate, children }: Props) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation currentPage={currentPage} onNavigate={onNavigate} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  );
}
