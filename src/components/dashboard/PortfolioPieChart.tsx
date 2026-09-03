import { PieChart, Pie, Cell, Tooltip, Legend, Label, ResponsiveContainer } from 'recharts';
import type { CategoryValues } from '@/types';
import { formatKrw } from '@/utils/formatting';

const COLORS: Record<string, string> = {
  현금:     '#818cf8',
  주식:     '#34d399',
  금:       '#fbbf24',
  가상화폐: '#a78bfa',
  고정자산: '#94a3b8',
};

interface Props {
  categoryValues: CategoryValues;
  includesFixed: boolean;
  totalKrw: number;
}

const makeLegendRenderer = (data: { name: string; value: number }[], totalKrw: number) =>
  function CustomLegend() {
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-1 text-xs">
        {data.map((entry) => {
          const pct = totalKrw > 0 ? ((entry.value / totalKrw) * 100).toFixed(1) : '0.0';
          const color = COLORS[entry.name] ?? '#94a3b8';
          return (
            <div key={entry.name} className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span>{entry.name}</span>
              <span className="font-semibold text-slate-700">{pct}%</span>
            </div>
          );
        })}
      </div>
    );
  };

export function PortfolioPieChart({ categoryValues, includesFixed, totalKrw }: Props) {
  const data = [
    { name: '현금',     value: categoryValues.cash },
    { name: '주식',     value: categoryValues.stock },
    { name: '금',       value: categoryValues.gold },
    { name: '가상화폐', value: categoryValues.crypto },
    ...(includesFixed ? [{ name: '고정자산', value: categoryValues.fixedAsset }] : []),
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        자산을 입력하면 차트가 표시됩니다
      </div>
    );
  }

  const LegendContent = makeLegendRenderer(data, totalKrw);

  const CenterLabel = ({ viewBox }: { viewBox?: { cx?: number; cy?: number } }) => {
    const cx = viewBox?.cx ?? 0;
    const cy = viewBox?.cy ?? 0;
    return (
      <>
        <text
          x={cx} y={cy - 7}
          textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 17, fontWeight: 700, fill: '#0f172a' }}
        >
          {formatKrw(totalKrw)}
        </text>
        <text
          x={cx} y={cy + 10}
          textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 10, fill: '#94a3b8' }}
        >
          포트폴리오
        </text>
      </>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={285}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="46%"
          innerRadius={62}
          outerRadius={98}
          paddingAngle={2}
          dataKey="value"
        >
          <Label content={<CenterLabel />} position="center" />
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
          formatter={(value: number) => [
            `${formatKrw(value)} (${totalKrw > 0 ? ((value / totalKrw) * 100).toFixed(1) : 0}%)`,
            '',
          ]}
        />
        <Legend content={<LegendContent />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
