import { useState, useEffect } from 'react';
import { Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { TargetWeights, AppSettings } from '@/types';
import { validateTargetWeights } from '@/utils/rebalancing';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { PageHeader } from '@/components/ui/PageHeader';

interface Props {
  targetWeights: TargetWeights;
  settings: AppSettings;
  includesFixed: boolean;
  onUpdate: (weights: TargetWeights) => void;
}

export function TargetWeightPage({ targetWeights, settings, includesFixed, onUpdate }: Props) {
  const [draft, setDraft] = useState<TargetWeights>(targetWeights);

  useEffect(() => {
    setDraft(targetWeights);
  }, [targetWeights]);

  // 현재 설정에 실제로 존재하는 티커만 집계 (삭제된 종목의 orphan 값 제외)
  const activeStockTickers  = new Set(settings.stockTickers.map((t) => t.ticker));
  const activeCryptoTickers = new Set(settings.cryptoTickers.map((t) => t.ticker));

  const validation  = validateTargetWeights(draft, includesFixed);
  const topTotal    = draft.cash + draft.stock + draft.gold + draft.crypto + (includesFixed ? draft.fixedAsset : 0);
  const stockTotal  = Object.entries(draft.stockHoldings)
    .filter(([ticker]) => activeStockTickers.has(ticker))
    .reduce((s, [, v]) => s + v, 0);
  const cryptoTotal = Object.entries(draft.cryptoHoldings)
    .filter(([ticker]) => activeCryptoTickers.has(ticker))
    .reduce((s, [, v]) => s + v, 0);

  const setTop = (key: keyof Pick<TargetWeights, 'cash' | 'stock' | 'gold' | 'crypto' | 'fixedAsset'>, value: string) => {
    setDraft((d) => ({ ...d, [key]: parseFloat(value) || 0 }));
  };
  const setStockWeight  = (ticker: string, value: string) => {
    setDraft((d) => ({ ...d, stockHoldings: { ...d.stockHoldings, [ticker]: parseFloat(value) || 0 } }));
  };
  const setCryptoWeight = (ticker: string, value: string) => {
    setDraft((d) => ({ ...d, cryptoHoldings: { ...d.cryptoHoldings, [ticker]: parseFloat(value) || 0 } }));
  };

  const inputCls =
    'border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent';

  const WeightBar = ({ current }: { current: number }) => {
    const isOver = current > 100.01;
    const pct = Math.min(current, 100);
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isOver ? 'bg-rose-400' : 'bg-indigo-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-xs font-semibold tabular-nums w-12 text-right ${isOver ? 'text-rose-500' : current >= 99.9 ? 'text-emerald-600' : 'text-slate-500'}`}>
          {current.toFixed(1)}%
        </span>
      </div>
    );
  };

  const SumStatus = ({ total }: { total: number }) => {
    const ok = Math.abs(total - 100) < 0.01;
    return (
      <div className={`flex items-center gap-1.5 text-xs font-medium mt-2 ${ok ? 'text-emerald-600' : 'text-rose-500'}`}>
        {ok
          ? <CheckCircle2 size={12} />
          : <AlertTriangle size={12} />
        }
        합계 {total.toFixed(1)}%{!ok && ' (100%가 되어야 합니다)'}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="목표 비중 설정"
        action={
          <Button onClick={() => {
            // 저장 시 삭제된 종목의 orphan 비중값 제거
            onUpdate({
              ...draft,
              stockHoldings: Object.fromEntries(
                Object.entries(draft.stockHoldings).filter(([t]) => activeStockTickers.has(t))
              ),
              cryptoHoldings: Object.fromEntries(
                Object.entries(draft.cryptoHoldings).filter(([t]) => activeCryptoTickers.has(t))
              ),
            });
          }}>
            <Save size={14} />
            저장
          </Button>
        }
      />

      {!validation.valid && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{validation.message}</span>
        </div>
      )}

      {/* 최상위 카테고리 */}
      <SectionCard title="최상위 카테고리 목표 비중">
        <WeightBar current={topTotal} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {([
            { key: 'cash',       label: '현금' },
            { key: 'stock',      label: '주식' },
            { key: 'gold',       label: '금' },
            { key: 'crypto',     label: '가상화폐' },
            ...(includesFixed ? [{ key: 'fixedAsset', label: '고정자산' }] : []),
          ] as const).map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min="0" max="100" step="1"
                  value={draft[key as 'cash' | 'stock' | 'gold' | 'crypto' | 'fixedAsset'] || ''}
                  onChange={(e) => setTop(key as 'cash' | 'stock' | 'gold' | 'crypto' | 'fixedAsset', e.target.value)}
                  className={`flex-1 ${inputCls}`}
                />
                <span className="text-sm text-slate-400">%</span>
              </div>
            </div>
          ))}
        </div>
        <SumStatus total={topTotal} />
      </SectionCard>

      {/* 주식 종목별 */}
      <SectionCard
        title="주식 내 종목별 목표 비중"
        description={`최종 포트폴리오 비중 = 주식 목표 비중(${draft.stock}%) × 종목 내 비중`}
      >
        <WeightBar current={stockTotal} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
          {settings.stockTickers.map((t) => {
            const w = draft.stockHoldings[t.ticker] ?? 0;
            const portfolioWeight = ((draft.stock * w) / 100).toFixed(1);
            return (
              <div key={t.id}>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {t.name}
                  <span className="text-slate-400 ml-1 font-mono">{t.ticker}</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" min="0" max="100" step="1"
                    value={w || ''}
                    onChange={(e) => setStockWeight(t.ticker, e.target.value)}
                    placeholder="0"
                    className={`flex-1 ${inputCls} py-1.5`}
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">전체 {portfolioWeight}%</p>
              </div>
            );
          })}
        </div>
        <SumStatus total={stockTotal} />
      </SectionCard>

      {/* 가상화폐 종목별 */}
      <SectionCard
        title="가상화폐 내 코인별 목표 비중"
        description={`최종 포트폴리오 비중 = 가상화폐 목표 비중(${draft.crypto}%) × 코인 내 비중`}
      >
        <WeightBar current={cryptoTotal} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {settings.cryptoTickers.map((t) => {
            const w = draft.cryptoHoldings[t.ticker] ?? 0;
            const portfolioWeight = ((draft.crypto * w) / 100).toFixed(1);
            return (
              <div key={t.id}>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {t.name}
                  <span className="text-slate-400 ml-1 font-mono">{t.ticker}</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" min="0" max="100" step="1"
                    value={w || ''}
                    onChange={(e) => setCryptoWeight(t.ticker, e.target.value)}
                    placeholder="0"
                    className={`flex-1 ${inputCls} py-1.5`}
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">전체 {portfolioWeight}%</p>
              </div>
            );
          })}
        </div>
        <SumStatus total={cryptoTotal} />
      </SectionCard>
    </div>
  );
}
