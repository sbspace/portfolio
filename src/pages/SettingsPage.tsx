import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { RefreshCw, Zap, FolderOpen, FolderX, FolderCheck } from 'lucide-react';
import type {
  AppSettings,
  StockTickerConfig,
  CryptoTickerConfig,
  StockMarket,
  PriceData,
} from '@/types';
import { formatDate, formatKrw, formatManWon } from '@/utils/formatting';
import type { HistoryFolder } from '@/hooks/useHistoryFolder';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { PageHeader } from '@/components/ui/PageHeader';

interface Props {
  settings: AppSettings;
  prices: PriceData | null;
  loading: boolean;
  onUpdate: (settings: AppSettings) => void;
  onSyncHoldings: (stocks: StockTickerConfig[], crypto: CryptoTickerConfig[]) => void;
  onFetchPrices: () => void;
  onForceRefresh: () => void;
  historyFolder: HistoryFolder;
}

export function SettingsPage({
  settings,
  prices,
  loading,
  onUpdate,
  onSyncHoldings,
  onFetchPrices,
  onForceRefresh,
  historyFolder,
}: Props) {
  const [tab, setTab] = useState<'provider' | 'stock' | 'crypto'>('provider');

  const [newStockTicker,   setNewStockTicker]   = useState('');
  const [newStockName,     setNewStockName]     = useState('');
  const [newStockMarket,   setNewStockMarket]   = useState<StockMarket>('domestic');
  const [newStockExchange, setNewStockExchange] = useState<'KOSPI' | 'KOSDAQ'>('KOSPI');
  const [editingStock,     setEditingStock]     = useState<string | null>(null);
  const [editStockData,    setEditStockData]    = useState<Partial<StockTickerConfig>>({});
  const [editStockExchange, setEditStockExchange] = useState<'KOSPI' | 'KOSDAQ'>('KOSPI');

  const inferExchange = (yahooTicker?: string): 'KOSPI' | 'KOSDAQ' =>
    yahooTicker?.endsWith('.KQ') ? 'KOSDAQ' : 'KOSPI';

  const [newCryptoTicker, setNewCryptoTicker] = useState('');
  const [newCryptoName,   setNewCryptoName]   = useState('');
  const [editingCrypto,   setEditingCrypto]   = useState<string | null>(null);
  const [editCryptoData,  setEditCryptoData]  = useState<Partial<CryptoTickerConfig>>({});

  const updateAndSync = (s: AppSettings) => {
    onUpdate(s);
    onSyncHoldings(s.stockTickers, s.cryptoTickers);
  };

  const toggleProvider = () => {
    onUpdate({ ...settings, priceProviderType: settings.priceProviderType === 'mock' ? 'real' : 'mock' });
  };

  const updateGoldManual = (value: string) => {
    onUpdate({ ...settings, goldManualPricePerGram: parseInt(value) || 0 });
  };

  const addStock = () => {
    if (!newStockTicker.trim() || !newStockName.trim()) return;
    const t = newStockTicker.trim().toUpperCase();
    const yahooTicker =
      newStockMarket === 'domestic'
        ? `${t}.${newStockExchange === 'KOSPI' ? 'KS' : 'KQ'}`
        : undefined;
    updateAndSync({
      ...settings,
      stockTickers: [...settings.stockTickers, { id: uuidv4(), ticker: t, name: newStockName.trim(), market: newStockMarket, yahooTicker }],
    });
    setNewStockTicker(''); setNewStockName(''); setNewStockExchange('KOSPI');
  };

  const deleteStock = (id: string) => {
    if (!confirm('이 종목을 삭제할까요?')) return;
    updateAndSync({ ...settings, stockTickers: settings.stockTickers.filter((t) => t.id !== id) });
  };

  const saveEditStock = (id: string) => {
    updateAndSync({
      ...settings,
      stockTickers: settings.stockTickers.map((t) => (t.id === id ? { ...t, ...editStockData } : t)),
    });
    setEditingStock(null);
  };

  const addCrypto = () => {
    if (!newCryptoTicker.trim() || !newCryptoName.trim()) return;
    updateAndSync({
      ...settings,
      cryptoTickers: [...settings.cryptoTickers, { id: uuidv4(), ticker: newCryptoTicker.trim().toUpperCase(), name: newCryptoName.trim() }],
    });
    setNewCryptoTicker(''); setNewCryptoName('');
  };

  const deleteCrypto = (id: string) => {
    if (!confirm('이 코인을 삭제할까요?')) return;
    updateAndSync({ ...settings, cryptoTickers: settings.cryptoTickers.filter((t) => t.id !== id) });
  };

  const saveEditCrypto = (id: string) => {
    updateAndSync({
      ...settings,
      cryptoTickers: settings.cryptoTickers.map((t) => (t.id === id ? { ...t, ...editCryptoData } : t)),
    });
    setEditingCrypto(null);
  };

  const inputCls = 'border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent';

  return (
    <div className="space-y-5">
      <PageHeader title="설정" />

      {/* 탭 */}
      <div className="flex rounded-lg border border-slate-200 overflow-hidden w-fit">
        {([
          { key: 'provider', label: '가격 Provider' },
          { key: 'stock',    label: '주식 종목' },
          { key: 'crypto',   label: '가상화폐 종목' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2 text-sm font-medium transition-colors ${
              tab === key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Provider 탭 ─────────────────────────────────────── */}
      {tab === 'provider' && (
        <div className="space-y-4">
          <SectionCard title="가격 데이터 Provider">
            <div className="flex items-center gap-4 mb-5">
              <button
                onClick={toggleProvider}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                  settings.priceProviderType === 'real' ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    settings.priceProviderType === 'real' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {settings.priceProviderType === 'real' ? '실시간 가격 (Real)' : 'Mock 가격 (테스트용)'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {settings.priceProviderType === 'real'
                    ? 'Yahoo Finance + 업비트 API 사용. npm run dev 로컬 실행 필요.'
                    : '고정 테스트 가격 사용. 인터넷 연결 불필요.'}
                </p>
              </div>
            </div>

            {settings.priceProviderType === 'real' && (
              <div className="bg-indigo-50 rounded-lg p-3 text-xs text-indigo-700 mb-5 space-y-0.5">
                <p className="font-semibold mb-1.5 flex items-center gap-1"><Zap size={12} /> 실시간 가격 소스</p>
                <p>• <strong>국내/미국 주식 + USD/KRW + 금(GC=F)</strong> → Yahoo Finance (Vite 프록시)</p>
                <p>• <strong>가상화폐</strong> → 업비트 공개 API (직접 호출)</p>
                <p>• <strong>캐시 TTL</strong> → 5분</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="secondary" onClick={onFetchPrices} disabled={loading}>
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                {loading ? '조회 중…' : '가격 새로고침'}
              </Button>
              <Button variant="ghost" onClick={onForceRefresh} disabled={loading} className="text-amber-600 hover:bg-amber-50 hover:text-amber-700">
                캐시 무시하고 강제 새로고침
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="금 수동 가격 (Fallback)" description="금(GC=F) API 조회 실패 시 이 가격을 사용합니다.">
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="number" min="0"
                value={settings.goldManualPricePerGram || ''}
                onChange={(e) => updateGoldManual(e.target.value)}
                className={`flex-1 ${inputCls}`}
                placeholder="130000"
              />
              <span className="text-sm text-slate-500">원/g</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">현재: {formatKrw(settings.goldManualPricePerGram)}/g</p>
          </SectionCard>

          {/* 히스토리 폴더 */}
          <SectionCard title="스냅샷 히스토리 폴더" description="스냅샷 저장 시 CSV·PNG 파일을 자동으로 저장할 로컬 폴더를 지정합니다.">
            {historyFolder.isSupported ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  {historyFolder.folderName ? (
                    <>
                      <FolderCheck size={18} className="text-emerald-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-700 flex-1 truncate">
                        {historyFolder.folderName}
                      </span>
                    </>
                  ) : (
                    <>
                      <FolderOpen size={18} className="text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-400">지정된 폴더 없음 (저장 시 브라우저 다운로드로 대체)</span>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={historyFolder.pickFolder}>
                    <FolderOpen size={14} />
                    {historyFolder.folderName ? '폴더 변경' : '폴더 선택'}
                  </Button>
                  {historyFolder.folderName && (
                    <Button variant="ghost" onClick={historyFolder.clearFolder} className="text-slate-500">
                      <FolderX size={14} />
                      폴더 해제
                    </Button>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  첫 저장 시 브라우저에서 폴더 접근 권한을 요청합니다. 브라우저 재시작 후에는 자동으로 재승인이 필요할 수 있습니다.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                이 브라우저는 File System Access API를 지원하지 않습니다. Chrome 또는 Edge를 사용하면 폴더 직접 저장이 가능합니다.
              </p>
            )}
          </SectionCard>

          {prices && (
            <SectionCard title="현재 가격 상태">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'USD/KRW',    value: `${prices.usdKrw.toLocaleString('ko-KR')}원` },
                  { label: '금 현물',    value: `${formatManWon(prices.goldPerGram / 10000)}만원/g` },
                  { label: '데이터 출처', value: prices.source === 'realtime' ? '실시간' : prices.source === 'cached' ? '캐시' : prices.source === 'fallback' ? '부분실패' : 'Mock' },
                  { label: '마지막 조회', value: formatDate(prices.fetchedAt) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className="text-sm font-semibold text-slate-700 tabular-nums">{value}</p>
                  </div>
                ))}
              </div>
              {prices.errors.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">
                    조회 실패 항목 ({prices.errors.length}건)
                  </p>
                  <ul className="text-xs text-amber-600 space-y-0.5">
                    {prices.errors.map((e, i) => <li key={i}>• {e}</li>)}
                  </ul>
                </div>
              )}
            </SectionCard>
          )}
        </div>
      )}

      {/* ── 주식 종목 탭 ─────────────────────────────────────── */}
      {tab === 'stock' && (
        <SectionCard title="주식 종목 관리">
          {/* 추가 폼 */}
          <div className="flex gap-2 mb-6 flex-wrap items-center">
            <input value={newStockTicker} onChange={(e) => setNewStockTicker(e.target.value)}
              placeholder="티커 (예: 005930)" className={`${inputCls} w-36`} />
            <input value={newStockName} onChange={(e) => setNewStockName(e.target.value)}
              placeholder="종목명 (예: 삼성전자)" className={`${inputCls} flex-1 min-w-32`} />
            <select value={newStockMarket} onChange={(e) => setNewStockMarket(e.target.value as StockMarket)}
              className={inputCls}>
              <option value="domestic">국내주식</option>
              <option value="us">미국주식</option>
            </select>
            {newStockMarket === 'domestic' && (
              <select value={newStockExchange} onChange={(e) => setNewStockExchange(e.target.value as 'KOSPI' | 'KOSDAQ')}
                className={inputCls}>
                <option value="KOSPI">KOSPI</option>
                <option value="KOSDAQ">KOSDAQ</option>
              </select>
            )}
            <Button onClick={addStock}>추가</Button>
          </div>

          {(['domestic', 'us'] as const).map((market) => (
            <div key={market} className="mb-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {market === 'domestic' ? '국내주식' : '미국주식'}
              </p>
              <div className="space-y-0.5">
                {settings.stockTickers.filter((t) => t.market === market).map((t) =>
                  editingStock === t.id ? (
                    <div key={t.id} className="flex gap-2 py-1 items-center flex-wrap bg-slate-50 rounded-lg px-3">
                      <input value={editStockData.ticker ?? ''} onChange={(e) => {
                        const tk = e.target.value;
                        setEditStockData((d) => {
                          const mkt = d.market ?? 'domestic';
                          const suffix = editStockExchange === 'KOSPI' ? 'KS' : 'KQ';
                          return mkt === 'domestic'
                            ? { ...d, ticker: tk, yahooTicker: `${tk}.${suffix}` }
                            : { ...d, ticker: tk };
                        });
                      }} className="border border-slate-200 rounded-lg px-2 py-1 text-sm w-28" />
                      <input value={editStockData.name ?? ''} onChange={(e) => setEditStockData((d) => ({ ...d, name: e.target.value }))}
                        className="border border-slate-200 rounded-lg px-2 py-1 text-sm flex-1 min-w-24" />
                      <select value={editStockData.market ?? 'domestic'} onChange={(e) => {
                        const mkt = e.target.value as StockMarket;
                        setEditStockData((d) => {
                          if (mkt === 'domestic') {
                            const suffix = editStockExchange === 'KOSPI' ? 'KS' : 'KQ';
                            return { ...d, market: mkt, yahooTicker: `${d.ticker}.${suffix}` };
                          }
                          return { ...d, market: mkt, yahooTicker: undefined };
                        });
                      }} className="border border-slate-200 rounded-lg px-2 py-1 text-sm">
                        <option value="domestic">국내</option>
                        <option value="us">미국</option>
                      </select>
                      {(editStockData.market ?? 'domestic') === 'domestic' && (
                        <select value={editStockExchange} onChange={(e) => {
                          const ex = e.target.value as 'KOSPI' | 'KOSDAQ';
                          setEditStockExchange(ex);
                          setEditStockData((d) => ({ ...d, yahooTicker: `${d.ticker}.${ex === 'KOSPI' ? 'KS' : 'KQ'}` }));
                        }} className="border border-slate-200 rounded-lg px-2 py-1 text-sm">
                          <option value="KOSPI">KOSPI</option>
                          <option value="KOSDAQ">KOSDAQ</option>
                        </select>
                      )}
                      <Button size="xs" onClick={() => saveEditStock(t.id)}>저장</Button>
                      <Button size="xs" variant="ghost" onClick={() => setEditingStock(null)}>취소</Button>
                    </div>
                  ) : (
                    <div key={t.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <span className="text-sm font-mono text-slate-500 w-24 flex-shrink-0">{t.ticker}</span>
                      <span className="text-sm text-slate-700 flex-1">{t.name}</span>
                      {t.market === 'domestic' && (
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${
                          inferExchange(t.yahooTicker) === 'KOSDAQ'
                            ? 'bg-violet-50 text-violet-600'
                            : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          {inferExchange(t.yahooTicker)}
                        </span>
                      )}
                      <Button size="xs" variant="ghost" onClick={() => {
                        setEditingStock(t.id);
                        setEditStockData({ ticker: t.ticker, name: t.name, market: t.market, yahooTicker: t.yahooTicker });
                        setEditStockExchange(inferExchange(t.yahooTicker));
                      }}>수정</Button>
                      <Button size="xs" variant="danger" onClick={() => deleteStock(t.id)}>삭제</Button>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {/* ── 가상화폐 탭 ─────────────────────────────────────── */}
      {tab === 'crypto' && (
        <SectionCard title="가상화폐 종목 관리" description="업비트 기준 KRW 마켓 티커를 입력하세요 (예: BTC, ETH)">
          <div className="flex gap-2 mb-6 flex-wrap">
            <input value={newCryptoTicker} onChange={(e) => setNewCryptoTicker(e.target.value)}
              placeholder="티커 (예: BTC)" className={`${inputCls} w-28`} />
            <input value={newCryptoName} onChange={(e) => setNewCryptoName(e.target.value)}
              placeholder="코인명 (예: Bitcoin)" className={`${inputCls} flex-1 min-w-32`} />
            <Button onClick={addCrypto}>추가</Button>
          </div>

          <div className="space-y-0.5">
            {settings.cryptoTickers.map((t) =>
              editingCrypto === t.id ? (
                <div key={t.id} className="flex gap-2 py-1 items-center bg-slate-50 rounded-lg px-3">
                  <input value={editCryptoData.ticker ?? ''} onChange={(e) => setEditCryptoData((d) => ({ ...d, ticker: e.target.value }))}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-sm w-24" />
                  <input value={editCryptoData.name ?? ''} onChange={(e) => setEditCryptoData((d) => ({ ...d, name: e.target.value }))}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-sm flex-1" />
                  <Button size="xs" onClick={() => saveEditCrypto(t.id)}>저장</Button>
                  <Button size="xs" variant="ghost" onClick={() => setEditingCrypto(null)}>취소</Button>
                </div>
              ) : (
                <div key={t.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-mono text-slate-500 w-16 flex-shrink-0">{t.ticker}</span>
                  <span className="text-sm text-slate-700 flex-1">{t.name}</span>
                  <Button size="xs" variant="ghost" onClick={() => { setEditingCrypto(t.id); setEditCryptoData({ ticker: t.ticker, name: t.name }); }}>수정</Button>
                  <Button size="xs" variant="danger" onClick={() => deleteCrypto(t.id)}>삭제</Button>
                </div>
              )
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
