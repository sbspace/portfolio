import type { PriceData } from '@/types';
import { formatDate } from '@/utils/formatting';
import { CheckCircle2, Clock, AlertTriangle, Database } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  prices: PriceData;
}

const SOURCE_CONFIG: Record<string, { label: string; Icon: LucideIcon; color: string }> = {
  realtime: { label: '실시간',    Icon: CheckCircle2,   color: 'text-emerald-600' },
  cached:   { label: '캐시',      Icon: Clock,          color: 'text-indigo-500' },
  fallback: { label: '부분 실패', Icon: AlertTriangle,  color: 'text-amber-600' },
  mock:     { label: 'Mock',      Icon: Database,       color: 'text-slate-400' },
};

export function PriceStatusBar({ prices }: Props) {
  const cfg = SOURCE_CONFIG[prices.source] ?? SOURCE_CONFIG.mock;
  const { Icon } = cfg;

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
      <span className={`flex items-center gap-1 font-medium ${cfg.color}`}>
        <Icon size={12} strokeWidth={2.5} />
        {cfg.label}
      </span>
      <span className="text-slate-400">{formatDate(prices.fetchedAt)}</span>
      {prices.errors.length > 0 && (
        <details>
          <summary className="cursor-pointer text-amber-600 font-medium hover:underline flex items-center gap-1 list-none">
            <AlertTriangle size={11} />
            {prices.errors.length}건 오류 (클릭)
          </summary>
          <ul className="mt-1.5 space-y-0.5 text-slate-500 pl-3">
            {prices.errors.map((err, i) => (
              <li key={i}>• {err}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
