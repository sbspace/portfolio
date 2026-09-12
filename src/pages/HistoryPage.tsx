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
  { key: 'cash', label: '현금', color: '#818cf8' },
  { key: 'stock', label: '주식', color: '#34d399' },
  { key: 'gold', label: '금', color: '#fbbf24' },
  { key: 'crypto', label: '가상화폐', color: '#a78bfa' },
] as const;

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
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs min-w-[140px]">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
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
    date:   new Date(snap.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
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

  const totalValues = chartData.flatMap((d) => [d.portfolioTotal, d.totalWithFixed]);
  const totalMin = Math.min(...totalValues);
  const totalMax = Math.max(...totalValues);
  const totalPadding = Math.max((totalMax - totalMin) * 0.15, totalMax * 0.02, 1);
  const totalDomain: [number, number] = [
    Math.max(0, Math.floor(totalMin - totalPadding)),
    Math.ceil(totalMax + totalPadding),
  ];

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
      <SectionCard title="총자산 추이">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis
              tick={axisStyle}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${Number(v).toLocaleString('ko-KR')}만`}
              domain={totalDomain}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="circle"
              iconSize={8}
            />
            <Line
              type="monotone"
              dataKey="portfolioTotal"
              name="포트폴리오 금액"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#6366f1' }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="totalWithFixed"
              name="고정자산 전체 포함 총자산"
              stroke="#0f172a"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={{ r: 3, fill: '#0f172a' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* 카테고리별 추이 */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">카테고리별 추이</h2>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {CATEGORY_CHARTS.map(({ key, label, color }) => {
            const amountKey = `${key}Amount`;
            const weightKey = `${key}Weight`;
            return (
              <SectionCard key={key} title={`${label} 추이`}>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis
                      yAxisId="amount"
                      width={52}
                      tick={axisStyle}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${Number(v).toLocaleString('ko-KR')}만`}
                    />
                    <YAxis
                      yAxisId="weight"
                      orientation="right"
                      width={36}
                      tick={axisStyle}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 'auto']}
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
