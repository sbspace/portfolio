import { useState } from 'react';
import type { Page } from '@/types';
import {
  LayoutDashboard,
  PenLine,
  Target,
  Scale,
  TrendingUp,
  NotebookPen,
  Settings,
  Menu,
  X,
  BarChart3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { page: Page; label: string; Icon: LucideIcon }[] = [
  { page: 'dashboard',   label: '대시보드',  Icon: LayoutDashboard },
  { page: 'input',       label: '자산 입력', Icon: PenLine },
  { page: 'target',      label: '목표 비중', Icon: Target },
  { page: 'rebalancing', label: '리밸런싱',  Icon: Scale },
  { page: 'history',     label: '이력',      Icon: TrendingUp },
  { page: 'memo',        label: '메모',      Icon: NotebookPen },
  { page: 'settings',    label: '설정',      Icon: Settings },
];

export function Navigation({ currentPage, onNavigate }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (page: Page) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <button
            onClick={() => handleNav('dashboard')}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BarChart3 size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-slate-900 hidden sm:block">Portfolio</span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_ITEMS.map(({ page, label, Icon }) => {
              const active = currentPage === page;
              return (
                <button
                  key={page}
                  onClick={() => handleNav(page)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                    ${active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 py-2 flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ page, label, Icon }) => {
              const active = currentPage === page;
              return (
                <button
                  key={page}
                  onClick={() => handleNav(page)}
                  className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
