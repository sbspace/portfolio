import { useEffect, useRef, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw, Save, AlertCircle, CheckCircle2, FolderOpen } from 'lucide-react';
import type { AppState, ViewFilter, PriceData } from '@/types';
import { calcCombinedPortfolio, calcSinglePersonPortfolio } from '@/utils/portfolio';
import { formatKrw, formatManWon, formatPercent, formatStockPrice, formatCryptoPrice } from '@/utils/formatting';
import { captureElementToBlob, generateSnapshotCsv, makeFilename, triggerDownload } from '@/utils/exportFiles';
import type { HistoryFolder } from '@/hooks/useHistoryFolder';
import { PortfolioPieChart } from '@/components/dashboard/PortfolioPieChart';
import { CategorySummaryTable } from '@/components/dashboard/CategorySummaryTable';
import { PriceStatusBar } from '@/components/dashboard/PriceStatusBar';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { PageHeader } from '@/components/ui/PageHeader';

interface Props {
  appState: AppState;
  prices: PriceData | null;
  loading: boolean;
  error: string | null;
  viewFilter: ViewFilter;
  onViewFilterChange: (f: ViewFilter) => void;
  historyFolder: HistoryFolder;
  onFetchPrices: () => void;
  onForceRefresh: () => void;
  onSaveSnapshot: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'done' | 'error';

const FALLBACK_PRICES: PriceData = {
  usdKrw: 1380,
  stocks: {},
  goldPerGram: 130000,
  crypto: {},
  fetchedAt: new Date().toISOString(),
  source: 'mock',
  errors: [],
};

const US_STOCK_COLORS  = ['#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
const DOM_STOCK_COLORS = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
const CRYPTO_COLORS    = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

export function DashboardPage({
  appState,
  prices,
  loading,
  error,
  viewFilter,
  onViewFilterChange,
  onFetchPrices,
  onForceRefresh,
  onSaveSnapshot,
  historyFolder,
}: Props) {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    onFetchPrices();
  }, []);

  const activePrices = prices ?? FALLBACK_PRICES;

  const portfolio =
    viewFilter === 'combined'
      ? calcCombinedPortfolio(appState.beomseokAssets, appState.seyeonAssets, activePrices)
      : viewFilter === 'beomseok'
      ? calcSinglePersonPortfolio(appState.beomseokAssets, activePrices)
      : calcSinglePersonPortfolio(appState.seyeonAssets, activePrices);

  const activeStocks = portfolio.stockHoldings.filter((h) => h.quantity > 0);
  const usStocks = activeStocks.filter((h) => h.market === 'us').sort((a, b) => b.valueKrw - a.valueKrw);
  const domStocks = activeStocks.filter((h) => h.market === 'domestic').sort((a, b) => b.valueKrw - a.valueKrw);
  const totalStockKrw = portfolio.categoryValues.stock;
  const usStockKrw  = usStocks.reduce((s, h) => s + h.valueKrw, 0);
  const domStockKrw = domStocks.reduce((s, h) => s + h.valueKrw, 0);
  const usRatio  = totalStockKrw > 0 ? (usStockKrw / totalStockKrw) * 100 : 0;
  const domRatio = totalStockKrw > 0 ? (domStockKrw / totalStockKrw) * 100 : 0;

  const activeCrypto = portfolio.cryptoHoldings
    .filter((h) => h.quantity > 0)
    .sort((a, b) => b.valueKrw - a.valueKrw);

  const stockChartData = [
    ...usStocks.map((h, i)  => ({ name: h.name, value: h.valueKrw, color: US_STOCK_COLORS[i  % US_STOCK_COLORS.length] })),
    ...domStocks.map((h, i) => ({ name: h.name, value: h.valueKrw, color: DOM_STOCK_COLORS[i % DOM_STOCK_COLORS.length] })),
  ].filter((d) => d.value > 0);

  const cryptoChartData = activeCrypto
    .filter((h) => h.valueKrw > 0)
    .map((h, i) => ({ name: h.name, value: h.valueKrw, color: CRYPTO_COLORS[i % CRYPTO_COLORS.length] }));

  const ownerLabel =
    viewFilter === 'combined' ? '범석 + 세연' : viewFilter === 'beomseok' ? '범석' : '세연';

  const handleSaveWithExport = async () => {
    if (!prices) return;
    setSaveStatus('saving');
    setSaveMsg('저장 중…');

    // 1. LocalStorage 스냅샷 저장
    onSaveSnapshot();

    const now = new Date();
    const csvFilename = makeFilename('csv', now);
    const pngFilename = makeFilename('png', now);
    const csvContent  = generateSnapshotCsv(portfolio, now.toISOString());

    try {
      // 2. PNG 캡처
      let pngBlob: Blob | null = null;
      if (dashboardRef.current) {
        try {
          pngBlob = await captureElementToBlob(dashboardRef.current);
        } catch (e) {
          console.warn('[export] 스크린샷 실패:', e);
        }
      }

      // 3. 히스토리 폴더 저장 or 다운로드 fallback
      let savedToFolder = false;
      if (historyFolder.folderName) {
        const csvOk = await historyFolder.saveToFolder(csvFilename, csvContent);
        const pngOk = pngBlob ? await historyFolder.saveToFolder(pngFilename, pngBlob, 'image/png') : true;
        savedToFolder = csvOk && pngOk;
        if (!savedToFolder) {
          // 권한 거부 등 — fallback
          triggerDownload(csvContent, csvFilename);
          if (pngBlob) triggerDownload(pngBlob, pngFilename);
        }
      } else {
        // 폴더 미설정 — 브라우저 다운로드
        triggerDownload(csvContent, csvFilename);
        if (pngBlob) triggerDownload(pngBlob, pngFilename);
      }

      setSaveStatus('done');
      setSaveMsg(
        savedToFolder
          ? `"${historyFolder.folderName}" 폴더에 CSV·PNG 저장 완료`
          : 'LocalStorage 저장 완료 (CSV·PNG 다운로드)'
      );
    } catch (e) {
      console.error('[export] 저장 실패:', e);
      setSaveStatus('error');
      setSaveMsg('파일 내보내기 실패');
    }

    setTimeout(() => setSaveStatus('idle'), 4000);
  };

  const SubChartLegend = ({ data, total }: { data: typeof stockChartData; total: number }) => (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
          <span className="text-xs text-slate-500 truncate">{d.name}</span>
          <span className="text-xs font-semibold text-slate-700 ml-auto tabular-nums">
            {total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div ref={dashboardRef} className="space-y-5">
      <PageHeader
        title="포트폴리오 대시보드"
        action={
          <div className="flex min-w-0 w-full max-w-full items-center gap-2 flex-wrap justify-start md:w-auto md:justify-end">
            {/* 뷰 필터 */}
            <div className="flex flex-shrink-0 rounded-lg border border-slate-200 overflow-hidden">
              {(['combined', 'beomseok', 'seyeon'] as ViewFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => onViewFilterChange(f)}
                  className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    viewFilter === f
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f === 'combined' ? '합산' : f === 'beomseok' ? '범석' : '세연'}
                </button>
              ))}
            </div>
            <Button className="whitespace-nowrap" variant="secondary" size="sm" onClick={onFetchPrices} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              {loading ? '조회 중…' : '새로고침'}
            </Button>
            <Button
              size="sm"
              className="whitespace-nowrap"
              onClick={handleSaveWithExport}
              disabled={!prices || loading || saveStatus === 'saving'}
            >
              <Save size={13} />
              {saveStatus === 'saving' ? '저장 중…' : '스냅샷 저장'}
            </Button>
          </div>
        }
      />

      {/* 저장 결과 토스트 */}
      {saveStatus !== 'idle' && (
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm transition-all ${
          saveStatus === 'done'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : saveStatus === 'error'
            ? 'bg-rose-50 border border-rose-200 text-rose-700'
            : 'bg-slate-50 border border-slate-200 text-slate-600'
        }`}>
          {saveStatus === 'done' && <CheckCircle2 size={15} className="flex-shrink-0" />}
          {saveStatus === 'error' && <AlertCircle size={15} className="flex-shrink-0" />}
          <span>{saveMsg}</span>
          {!historyFolder.folderName && saveStatus === 'done' && (
            <button
              onClick={historyFolder.pickFolder}
              className="ml-auto text-xs underline underline-offset-2 flex items-center gap-1 hover:no-underline"
            >
              <FolderOpen size={12} />
              폴더 지정하기
            </button>
          )}
        </div>
      )}

      {/* 에러 배너 */}
      {error && (
        <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>가격 조회 오류: {error}</span>
        </div>
      )}

      {!prices && !loading && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm">
          가격 데이터가 없습니다. '새로고침'을 눌러 조회하세요.
          {appState.settings.priceProviderType === 'real' && (
            <span className="ml-1">
              (실시간 가격은 <code className="bg-amber-100 px-1 rounded">npm run dev</code> 로컬 실행 시에만 동작합니다)
            </span>
          )}
        </div>
      )}

      {/* 가격 상태 */}
      {prices && (
        <div className="bg-white rounded-xl px-4 py-3 border border-slate-100 shadow-sm">
          <PriceStatusBar prices={prices} />
        </div>
      )}

      {/* 총자산 카드 + 하위 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 총자산 - 다크 카드 */}
        <div className="bg-slate-900 rounded-xl p-5 text-white shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-3">{ownerLabel}</p>
          {portfolio.totalKrwWithFixed > portfolio.totalKrw ? (
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-end md:gap-5">
              <div>
                <p className="text-slate-400 text-xs mb-1">포트폴리오</p>
                <p className="text-2xl font-bold tracking-tight tabular-nums">
                  {formatKrw(portfolio.totalKrw)}
                </p>
              </div>
              <div className="w-full border-t border-slate-700 pt-3 md:w-auto md:border-l md:border-t-0 md:pb-0.5 md:pl-5 md:pt-0">
                <p className="text-slate-500 text-xs mb-1">고정자산 포함</p>
                <p className="text-lg font-semibold text-slate-300 tabular-nums">
                  {formatKrw(portfolio.totalKrwWithFixed)}
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-slate-400 text-xs mb-1">총자산</p>
              <p className="text-2xl font-bold tracking-tight tabular-nums">
                {formatKrw(portfolio.totalKrw)}
              </p>
            </>
          )}
        </div>

        {/* 현금 카드 */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-400 mb-2">현금</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums">
            {formatKrw(portfolio.categoryValues.cash)}
          </p>
          <p className="text-xs text-slate-400 mt-2 tabular-nums">
            유동 {formatKrw(portfolio.cashLiquidKrw)} · 비유동 {formatKrw(portfolio.cashIlliquidKrw)}
          </p>
        </div>

        {/* 투자자산 카드 */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-400 mb-2">투자 자산</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums">
            {formatKrw(
              portfolio.categoryValues.stock +
                portfolio.categoryValues.gold +
                portfolio.categoryValues.crypto
            )}
          </p>
          <p className="text-xs text-slate-400 mt-2 tabular-nums">
            주식 {formatKrw(portfolio.categoryValues.stock)} · 금 {formatKrw(portfolio.categoryValues.gold)} · 코인 {formatKrw(portfolio.categoryValues.crypto)}
          </p>
        </div>
      </div>

      {/* 파이차트 + 요약 테이블 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="자산 배분 현황">
          <PortfolioPieChart
            categoryValues={portfolio.categoryValues}
            includesFixed={portfolio.includesFixedAsset}
            totalKrw={portfolio.totalKrw}
          />
        </SectionCard>
        <SectionCard title="카테고리별 현황">
          <CategorySummaryTable portfolio={portfolio} targetWeights={appState.targetWeights} />
        </SectionCard>
      </div>

      {/* 종목별 서브 파이차트 */}
      {(stockChartData.length > 0 || cryptoChartData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {stockChartData.length > 0 && (
            <SectionCard
              title="주식 종목별 비중"
              description={[
                usStocks.length > 0 ? `해외 ${formatPercent(usRatio)}` : '',
                domStocks.length > 0 ? `국내 ${formatPercent(domRatio)}` : '',
              ].filter(Boolean).join(' / ')}
            >
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stockChartData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={32}
                    paddingAngle={1}
                  >
                    {stockChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
                    formatter={(v: number) => [formatKrw(v), '']}
                    labelFormatter={(_, payload) => payload?.[0]?.name ?? ''}
                  />
                </PieChart>
              </ResponsiveContainer>
              <SubChartLegend data={stockChartData} total={totalStockKrw} />
            </SectionCard>
          )}

          {cryptoChartData.length > 0 && (
            <SectionCard title="가상화폐 종목별 비중">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={cryptoChartData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={32}
                    paddingAngle={1}
                  >
                    {cryptoChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
                    formatter={(v: number) => [formatKrw(v), '']}
                    labelFormatter={(_, payload) => payload?.[0]?.name ?? ''}
                  />
                </PieChart>
              </ResponsiveContainer>
              <SubChartLegend
                data={cryptoChartData}
                total={portfolio.categoryValues.crypto}
              />
            </SectionCard>
          )}
        </div>
      )}

      {/* 보유 현황 테이블 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {activeStocks.length > 0 && (
          <SectionCard
            title="주식 보유 현황"
            description={totalStockKrw > 0 ? `해외 ${formatPercent(usRatio)} / 국내 ${formatPercent(domRatio)}` : undefined}
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-medium text-slate-400 uppercase tracking-wide border-b border-slate-100">
                    <th className="text-left px-5 py-3">종목</th>
                    <th className="text-right px-3 py-3">수량</th>
                    <th className="text-right px-3 py-3">단가</th>
                    <th className="text-right px-3 py-3">평가액</th>
                    <th className="text-right px-5 py-3">비중</th>
                  </tr>
                </thead>
                <tbody>
                  {usStocks.length > 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 pt-3 pb-1">
                        <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">해외주식</span>
                      </td>
                    </tr>
                  )}
                  {usStocks.map((h) => (
                    <tr key={h.id} className="border-t border-slate-50 hover:bg-emerald-50/30 transition-colors">
                      <td className="px-5 py-2.5">
                        <span className="font-medium text-slate-800">{h.name}</span>
                        <span className="text-slate-400 ml-1.5 text-xs">{h.ticker}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-600 tabular-nums">{h.quantity}</td>
                      <td className="px-3 py-2.5 text-right text-slate-400 text-xs tabular-nums">
                        {formatStockPrice(h.priceKrw, 'us', h.priceUsd)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-800 tabular-nums">
                        {formatKrw(h.valueKrw)}
                      </td>
                      <td className="px-5 py-2.5 text-right text-xs text-slate-400 tabular-nums">
                        {portfolio.totalKrw > 0 ? formatPercent((h.valueKrw / portfolio.totalKrw) * 100) : '-'}
                      </td>
                    </tr>
                  ))}
                  {domStocks.length > 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 pt-3 pb-1">
                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">국내주식</span>
                      </td>
                    </tr>
                  )}
                  {domStocks.map((h) => (
                    <tr key={h.id} className="border-t border-slate-50 hover:bg-indigo-50/30 transition-colors">
                      <td className="px-5 py-2.5">
                        <span className="font-medium text-slate-800">{h.name}</span>
                        <span className="text-slate-400 ml-1.5 text-xs">{h.ticker}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-600 tabular-nums">{h.quantity}</td>
                      <td className="px-3 py-2.5 text-right text-slate-400 text-xs tabular-nums">
                        {formatStockPrice(h.priceKrw, 'domestic')}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-800 tabular-nums">
                        {formatKrw(h.valueKrw)}
                      </td>
                      <td className="px-5 py-2.5 text-right text-xs text-slate-400 tabular-nums">
                        {portfolio.totalKrw > 0 ? formatPercent((h.valueKrw / portfolio.totalKrw) * 100) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {activeCrypto.length > 0 && (
          <SectionCard title="가상화폐 보유 현황" noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-medium text-slate-400 uppercase tracking-wide border-b border-slate-100">
                    <th className="text-left px-5 py-3">코인</th>
                    <th className="text-right px-3 py-3">수량</th>
                    <th className="text-right px-3 py-3">단가</th>
                    <th className="text-right px-3 py-3">평가액</th>
                    <th className="text-right px-5 py-3">비중</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCrypto.map((h) => (
                    <tr key={h.id} className="border-t border-slate-50 hover:bg-violet-50/30 transition-colors">
                      <td className="px-5 py-2.5">
                        <span className="font-medium text-slate-800">{h.name}</span>
                        <span className="text-slate-400 ml-1.5 text-xs">{h.ticker}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-600 tabular-nums">
                        {h.quantity.toFixed(4)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-400 text-xs tabular-nums">
                        {formatCryptoPrice(h.priceKrw)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-800 tabular-nums">
                        {formatKrw(h.valueKrw)}
                      </td>
                      <td className="px-5 py-2.5 text-right text-xs text-slate-400 tabular-nums">
                        {portfolio.totalKrw > 0 ? formatPercent((h.valueKrw / portfolio.totalKrw) * 100) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}
      </div>

      {/* 금 + 환율 정보 */}
      {prices && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'USD/KRW',  value: `${prices.usdKrw.toLocaleString('ko-KR')}원` },
            { label: '금 현물',  value: `${formatManWon(prices.goldPerGram / 10000)}만원/g` },
            { label: '내 금 보유', value: formatKrw(portfolio.goldValueKrw) },
            {
              label: '가격 제공',
              value: prices.source === 'mock' ? 'Mock' : prices.source === 'realtime' ? '실시간' : prices.source === 'cached' ? '캐시' : '부분 실패',
            },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className="text-sm font-semibold text-slate-700 tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      )}

      {prices && prices.source !== 'mock' && (
        <div className="text-right">
          <button
            onClick={onForceRefresh}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-indigo-500 underline underline-offset-2 transition-colors"
          >
            캐시 무시하고 강제 새로고침
          </button>
        </div>
      )}
    </div>
  );
}
