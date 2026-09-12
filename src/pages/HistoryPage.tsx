import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, Trash2 } from 'lucide-react';
import type { Snapshot } from '@/types';
import { formatKrw, formatDate } from '@/utils/formatting';
import { SectionCard } from '@/components/ui/SectionCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

interface Props {
  snapshots: Snapshot[];
  onDelete: (id: string) => void;
}

const CATEGORY_CHARTS = [
  { key: 'cash', label: '현금', color: '#818cf8', amountKey: 'cashAmount', weightKey: 'cashWeight' },
  { key: 'stock', label: '주식', color: '#34d399', amountKey: 'stockAmount', weightKey: 'stockWeight' },
  { key: 'gold', label: '금', color: '#fbbf24', amountKey: 'goldAmount', weightKey: 'goldWeight' },
  { key: 'crypto', label: '가상화폐', color: '#a78bfa', amountKey: 'cryptoAmount', weightKey: 'cryptoWeight' },
] as const;

const TOTAL_CHARTS = [
  { key: 'portfolioTotal', title: '포트폴리오 금액 추이', name: '포트폴리오 금액', color: '#6366f1' },
  { key: 'totalWithFixed', title: '고정자산 전체 포함 총자산 추이', name: '고정자산 전체 포함 총자산', color: '#0f172a' },
] as const;

function paddedDomain(
  values: number[],
  options: { min: number; max?: number; minPadding: number }
): [number, number] {
  const valueMin = Math.min(...values);
  const valueMax = Math.max(...values);
  const padding = Math.max(
    (valueMax - valueMin) * 0.12,
    Math.abs(valueMax) * 0.01,
    options.minPadding
  );
  return [
    Math.max(options.min, Math.floor((valueMin - padding) * 10) / 10),
    Math.min(options.max ?? Infinity, Math.ceil((valueMax + padding) * 10) / 10),
  ];
}

const formatAxisDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });

type TooltipPayload = {
  color?: string;
  dataKey?: string | number;
  name?: string | number;
  value?: number;
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs min-w-[140px]">
      <p className="font-semibold text-slate-700 mb-2">
        {typeof label === 'number' ? formatAxisDate(label) : label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-500">{entry.name}</span>
          <span className="ml-auto font-semibold text-slate-800 tabular-nums">
            {String(entry.dataKey).endsWith('Weight')
              ? `${(entry.value ?? 0).toFixed(1)}%`
              : `${Math.round(entry.value ?? 0).toLocaleString('ko-KR')}만원`}
          </span>
        </div>
      ))}
    </div>
  );
};

export function HistoryPage({ snapshots, onDelete }: Props) {
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const chartData = sorted.map((snap) => ({
    timestamp: new Date(snap.createdAt).getTime(),
    portfolioTotal: Math.round(snap.portfolio.totalKrw / 10000),
    totalWithFixed: Math.round((snap.portfolio.totalKrwWithFixed ?? snap.portfolio.totalKrw) / 10000),
    cashAmount: Math.round(snap.portfolio.categoryValues.cash / 10000),
    cashWeight: snap.portfolio.categoryWeights.cash,
    stockAmount: Math.round(snap.portfolio.categoryValues.stock / 10000),
    stockWeight: snap.portfolio.categoryWeights.stock,
    goldAmount: Math.round(snap.portfolio.categoryValues.gold / 10000),
    goldWeight: snap.portfolio.categoryWeights.gold,
    cryptoAmount: Math.round(snap.portfolio.categoryValues.crypto / 10000),
    cryptoWeight: snap.portfolio.categoryWeights.crypto,
  }));

  const axisStyle = { fontSize: 11, fill: '#94a3b8' };

  if (snapshots.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title="자산 이력" />
        <SectionCard>
          <EmptyState
            icon={<BarChart3 size={22} />}
            title="저장된 스냅샷이 없습니다"
            description="대시보드에서 스냅샷을 저장하면 여기에 자산 추이가 표시됩니다."
          />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="자산 이력" description={`총 ${snapshots.length}개 스냅샷`} />

      {/* 총자산 추이 */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">총자산 추이</h2>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {TOTAL_CHARTS.map(({ key, title, name, color }) => {
            const domain = paddedDomain(chartData.map((item) => item[key]), {
              min: 0,
              minPadding: 1,
            });
            return (
              <SectionCard key={key} title={title} className="min-w-0">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      scale="time"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={formatAxisDate}
                      tick={axisStyle}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      width={58}
                      tick={axisStyle}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${Number(v).toLocaleString('ko-KR')}만`}
                      domain={domain}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                    <Line
                      type="monotone"
                      dataKey={key}
                      name={name}
                      stroke={color}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: color }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </SectionCard>
            );
          })}
        </div>
      </div>

      {/* 카테고리별 추이 */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">카테고리별 추이</h2>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {CATEGORY_CHARTS.map(({ key, label, color, amountKey, weightKey }) => {
            const amountDomain = paddedDomain(chartData.map((item) => item[amountKey]), {
              min: 0,
              minPadding: 1,
            });
            const weightDomain = paddedDomain(chartData.map((item) => item[weightKey]), {
              min: 0,
              max: 100,
              minPadding: 0.5,
            });
            return (
              <SectionCard key={key} title={`${label} 추이`} className="min-w-0">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      scale="time"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={formatAxisDate}
                      tick={axisStyle}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="weight"
                      width={38}
                      tick={axisStyle}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                      domain={weightDomain}
                    />
                    <YAxis
                      yAxisId="amount"
                      orientation="right"
                      width={58}
                      tick={axisStyle}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${Number(v).toLocaleString('ko-KR')}만`}
                      domain={amountDomain}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                    <Line
                      yAxisId="amount"
                      type="monotone"
                      dataKey={amountKey}
                      name="금액"
                      stroke={color}
                      strokeWidth={2}
                      dot={{ r: 2.5, fill: color }}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      yAxisId="weight"
                      type="monotone"
                      dataKey={weightKey}
                      name="비중"
                      stroke="#475569"
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                      dot={{ r: 2, fill: '#475569' }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </SectionCard>
            );
          })}
        </div>
      </div>

      {/* 스냅샷 목록 */}
      <SectionCard title={`저장된 스냅샷 (${snapshots.length}개)`} noPadding>
        <div className="divide-y divide-slate-50">
          {[...sorted].reverse().map((snap) => (
            <div key={snap.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/60 transition-colors">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {snap.label ?? formatDate(snap.createdAt)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                  총자산 {formatKrw(snap.portfolio.totalKrw)} · 주식 {formatKrw(snap.portfolio.categoryValues.stock)} / 코인 {formatKrw(snap.portfolio.categoryValues.crypto)} / 현금 {formatKrw(snap.portfolio.categoryValues.cash)}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('이 스냅샷을 삭제할까요?')) onDelete(snap.id);
                }}
                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0 ml-3"
                title="삭제"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
