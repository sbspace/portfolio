import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { AppState, PriceData } from '@/types';
import { calcCombinedPortfolio } from '@/utils/portfolio';
import { calcRebalancing } from '@/utils/rebalancing';
import { formatKrw, formatPercent, formatPercentGap, formatGap } from '@/utils/formatting';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

interface Props {
  appState: AppState;
  prices: PriceData | null;
  loading: boolean;
  onFetchPrices: () => void;
}

type SortDir = 'asc' | 'desc' | null;

function nextSortDir(dir: SortDir): SortDir {
  if (dir === null) return 'desc';
  if (dir === 'desc') return 'asc';
  return null;
}

export function RebalancingPage({ appState, prices, loading, onFetchPrices }: Props) {
  const [categoryGapSort, setCategoryGapSort] = useState<SortDir>(null);
  const [holdingGapSort, setHoldingGapSort] = useState<SortDir>(null);

  useEffect(() => {
    if (!prices) onFetchPrices();
  }, []);

  const dummyPrices: PriceData = prices ?? {
    usdKrw: 1380,
    stocks: {},
    goldPerGram: 130000,
    crypto: {},
    fetchedAt: new Date().toISOString(),
    source: 'mock',
    errors: [],
  };

  const portfolio = calcCombinedPortfolio(
    appState.beomseokAssets,
    appState.seyeonAssets,
    dummyPrices
  );
  const rows = calcRebalancing(portfolio, appState.targetWeights);

  const categoryRows = rows.filter((r) => r.level === 'category');
  const holdingRows  = rows.filter((r) => r.level === 'holding');

  const sortByGap = <T extends { valueGap: number }>(list: T[], dir: SortDir): T[] => {
    if (dir === null) return list;
    return [...list].sort((a, b) => (dir === 'asc' ? a.valueGap - b.valueGap : b.valueGap - a.valueGap));
  };

  const sortedCategoryRows = useMemo(
    () => sortByGap(categoryRows, categoryGapSort),
    [categoryRows, categoryGapSort]
  );
  const sortedHoldingRows = useMemo(
    () => sortByGap(holdingRows, holdingGapSort),
    [holdingRows, holdingGapSort]
  );

  const SortIcon = ({ dir }: { dir: SortDir }) => {
    if (dir === 'asc') return <ArrowUp size={12} />;
    if (dir === 'desc') return <ArrowDown size={12} />;
    return <ArrowUpDown size={12} className="opacity-40" />;
  };

  const GapBadge = ({ value, isWeight }: { value: number; isWeight: boolean }) => {
    const abs = Math.abs(value);
    const threshold = isWeight ? 0.5 : 100000;
    const style =
      abs < threshold
        ? 'bg-emerald-50 text-emerald-700'
        : value > 0
        ? 'bg-amber-50 text-amber-700'
        : 'bg-sky-50 text-sky-700';
    const label = isWeight ? formatPercentGap(value) : formatGap(value);
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${style}`}>
        {label}
      </span>
    );
  };

  const thCls = 'text-xs font-medium text-slate-400 uppercase tracking-wide py-3 whitespace-nowrap';

  return (
    <div className="space-y-5">
      <PageHeader
        title="리밸런싱"
        action={
          <Button variant="secondary" size="sm" onClick={onFetchPrices} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            {loading ? '조회 중…' : '새로고침'}
          </Button>
        }
      />

      {/* 총자산 요약 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 rounded-xl p-4 text-white">
          <p className="text-slate-400 text-xs mb-1">총 자산</p>
          <p className="text-lg font-bold tabular-nums">{formatKrw(portfolio.totalKrw)}</p>
        </div>
        {categoryRows.map((r) => (
          <div key={r.category} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-400 mb-1">{r.label}</p>
            <p className="text-sm font-semibold text-slate-800 tabular-nums">{formatKrw(r.currentValueKrw)}</p>
            <div className="mt-1">
              <GapBadge value={r.weightGap} isWeight={true} />
            </div>
          </div>
        ))}
      </div>

      {/* 카테고리별 */}
      <SectionCard title="카테고리별 리밸런싱" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100">
              <tr>
                <th className={`${thCls} text-left px-5`}>항목</th>
                <th className={`${thCls} text-right px-3`}>현재 금액</th>
                <th className={`${thCls} text-right px-3`}>현재 비중</th>
                <th className={`${thCls} text-right px-3`}>목표 비중</th>
                <th className={`${thCls} text-right px-3`}>비중 Gap</th>
                <th className={`${thCls} text-right px-3`}>목표 금액</th>
                <th className={`${thCls} text-right px-5`}>
                  <button
                    type="button"
                    onClick={() => setCategoryGapSort(nextSortDir(categoryGapSort))}
                    className="inline-flex items-center gap-1 hover:text-slate-600 transition-colors"
                  >
                    금액 Gap
                    <SortIcon dir={categoryGapSort} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCategoryRows.map((row) => (
                <tr key={row.category} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3 font-semibold text-slate-800">{row.label}</td>
                  <td className="px-3 py-3 text-right text-slate-700 tabular-nums">{formatKrw(row.currentValueKrw)}</td>
                  <td className="px-3 py-3 text-right text-slate-700 tabular-nums">{formatPercent(row.currentWeight)}</td>
                  <td className="px-3 py-3 text-right text-slate-400 tabular-nums">{formatPercent(row.targetWeight)}</td>
                  <td className="px-3 py-3 text-right"><GapBadge value={row.weightGap} isWeight={true} /></td>
                  <td className="px-3 py-3 text-right text-slate-700 tabular-nums">{formatKrw(row.targetValueKrw)}</td>
                  <td className="px-5 py-3 text-right"><GapBadge value={row.valueGap} isWeight={false} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 종목별 */}
      {holdingRows.length > 0 ? (
        <SectionCard title="종목별 리밸런싱" noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100">
                <tr>
                  <th className={`${thCls} text-left px-5`}>종목</th>
                  <th className={`${thCls} text-right px-3`}>현재 금액</th>
                  <th className={`${thCls} text-right px-3`}>현재 비중</th>
                  <th className={`${thCls} text-right px-3`}>목표 비중</th>
                  <th className={`${thCls} text-right px-3`}>목표 금액</th>
                  <th className={`${thCls} text-right px-5`}>
                    <button
                      type="button"
                      onClick={() => setHoldingGapSort(nextSortDir(holdingGapSort))}
                      className="inline-flex items-center gap-1 hover:text-slate-600 transition-colors"
                    >
                      금액 Gap
                      <SortIcon dir={holdingGapSort} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedHoldingRows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-5 py-2.5">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded mr-2 font-medium ${
                          row.category === 'stock'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-violet-50 text-violet-700'
                        }`}
                      >
                        {row.category === 'stock' ? '주식' : '코인'}
                      </span>
                      <span className="text-slate-700">{row.label}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-700 tabular-nums">{formatKrw(row.currentValueKrw)}</td>
                    <td className="px-3 py-2.5 text-right text-slate-700 tabular-nums">{formatPercent(row.currentWeight)}</td>
                    <td className="px-3 py-2.5 text-right text-slate-400 tabular-nums">{formatPercent(row.targetWeight)}</td>
                    <td className="px-3 py-2.5 text-right text-slate-700 tabular-nums">{formatKrw(row.targetValueKrw)}</td>
                    <td className="px-5 py-2.5 text-right"><GapBadge value={row.valueGap} isWeight={false} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : (
        <SectionCard>
          <EmptyState
            title="종목별 리밸런싱 없음"
            description="목표 비중 설정 화면에서 종목별 목표 비중을 입력하면 종목별 리밸런싱이 표시됩니다."
          />
        </SectionCard>
      )}
    </div>
  );
}
