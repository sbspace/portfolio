import type { PortfolioCalculation, TargetWeights } from '@/types';
import { formatKrw, formatPercent, formatPercentGap } from '@/utils/formatting';

interface Props {
  portfolio: PortfolioCalculation;
  targetWeights: TargetWeights;
}

const CATEGORY_LABELS = {
  cash:       '현금',
  stock:      '주식',
  gold:       '금',
  crypto:     '가상화폐',
  fixedAsset: '고정자산',
} as const;

const CATEGORY_DOTS: Record<string, string> = {
  현금:     'bg-indigo-400',
  주식:     'bg-emerald-400',
  금:       'bg-amber-400',
  가상화폐: 'bg-violet-400',
  고정자산: 'bg-slate-400',
};

export function CategorySummaryTable({ portfolio, targetWeights }: Props) {
  const { categoryValues, categoryWeights, totalKrw, includesFixedAsset } = portfolio;

  const rows = (
    ['cash', 'stock', 'gold', 'crypto', 'fixedAsset'] as const
  ).filter((k) => k !== 'fixedAsset' || includesFixedAsset);

  const gapStyle = (gap: number) => {
    const abs = Math.abs(gap);
    if (abs < 0.5) return 'bg-emerald-50 text-emerald-700';
    if (gap > 0)   return 'bg-amber-50 text-amber-700';
    return 'bg-sky-50 text-sky-700';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs font-medium text-slate-400 uppercase tracking-wide border-b border-slate-100">
            <th className="text-left pb-3 pr-3">자산군</th>
            <th className="text-right pb-3 px-2">평가액</th>
            <th className="text-right pb-3 px-2">현재</th>
            <th className="text-right pb-3 px-2">목표</th>
            <th className="text-right pb-3">Gap</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((key) => {
            const label = CATEGORY_LABELS[key];
            const current = categoryWeights[key];
            const target = targetWeights[key];
            const gap = current - target;
            return (
              <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 pr-3">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_DOTS[label] ?? 'bg-slate-300'}`} />
                    <span className="font-medium text-slate-700">{label}</span>
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right text-slate-600 tabular-nums">
                  {formatKrw(categoryValues[key])}
                </td>
                <td className="py-2.5 px-2 text-right tabular-nums text-slate-700">
                  {formatPercent(current)}
                </td>
                <td className="py-2.5 px-2 text-right tabular-nums text-slate-400">
                  {formatPercent(target)}
                </td>
                <td className="py-2.5 text-right">
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${gapStyle(gap)}`}>
                    {formatPercentGap(gap)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200">
            <td className="pt-3 font-semibold text-slate-900">합계</td>
            <td className="pt-3 text-right font-semibold text-slate-900 tabular-nums">
              {formatKrw(totalKrw)}
            </td>
            <td className="pt-3 text-right text-slate-500 tabular-nums" colSpan={3}>100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
