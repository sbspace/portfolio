import { useEffect, useState } from 'react';
import { CheckCircle2, Download, RotateCcw, Save } from 'lucide-react';
import type { PersonAssets, Owner, AppSettings, Snapshot } from '@/types';
import { formatKrw } from '@/utils/formatting';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { PageHeader } from '@/components/ui/PageHeader';

interface Props {
  beomseokAssets: PersonAssets;
  seyeonAssets: PersonAssets;
  settings: AppSettings;
  snapshots: Snapshot[];
  onUpdateBeomseok: (assets: PersonAssets) => void;
  onUpdateSeyeon: (assets: PersonAssets) => void;
}

export function AssetInputPage({
  beomseokAssets,
  seyeonAssets,
  snapshots,
  onUpdateBeomseok,
  onUpdateSeyeon,
}: Props) {
  const [selectedOwner, setSelectedOwner] = useState<Owner>('beomseok');
  const [beomseokDraft, setBeomseokDraft] = useState<PersonAssets>(beomseokAssets);
  const [seyeonDraft, setSeyeonDraft] = useState<PersonAssets>(seyeonAssets);
  const [savedOwner, setSavedOwner] = useState<Owner | null>(null);

  useEffect(() => setBeomseokDraft(beomseokAssets), [beomseokAssets]);
  useEffect(() => setSeyeonDraft(seyeonAssets), [seyeonAssets]);

  const assets  = selectedOwner === 'beomseok' ? beomseokDraft : seyeonDraft;
  const onUpdate = selectedOwner === 'beomseok' ? onUpdateBeomseok : onUpdateSeyeon;
  const setAssets = selectedOwner === 'beomseok' ? setBeomseokDraft : setSeyeonDraft;
  const ownerLabel = selectedOwner === 'beomseok' ? '범석' : '세연';
  const updateDraft = (nextAssets: PersonAssets) => {
    setAssets(nextAssets);
    setSavedOwner(null);
  };

  const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

  const loadLatestSnapshot = () => {
    if (!latestSnapshot) return;
    const snap =
      selectedOwner === 'beomseok'
        ? latestSnapshot.beomseokAssets
        : latestSnapshot.seyeonAssets;
    const fa = snap.fixedAsset as unknown as Record<string, unknown>;
    const oldInclude = (fa['includeInPortfolio'] as boolean) ?? false;
    updateDraft({
      ...snap,
      fixedAsset: {
        deposit:         (fa['deposit']         as number)  ?? 0,
        pension:         (fa['pension']         as number)  ?? 0,
        depositIncluded: (fa['depositIncluded'] as boolean) ?? oldInclude,
        pensionIncluded: (fa['pensionIncluded'] as boolean) ?? oldInclude,
      },
    });
  };

  const saveAssets = () => {
    onUpdate(assets);
    setSavedOwner(selectedOwner);
    window.setTimeout(() => setSavedOwner(null), 3000);
  };

  const resetAssets = () => {
    if (!window.confirm(`${ownerLabel}님의 모든 자산 입력값을 0으로 초기화할까요?\n저장 버튼을 눌러야 실제 데이터에 반영됩니다.`)) return;
    updateDraft({
      ...assets,
      cash: { liquid: 0, illiquid: 0 },
      stocks: assets.stocks.map((stock) => ({ ...stock, quantity: 0 })),
      gold: { grams: 0 },
      crypto: assets.crypto.map((coin) => ({ ...coin, quantity: 0 })),
      fixedAsset: { ...assets.fixedAsset, deposit: 0, pension: 0 },
    });
  };

  const updateCash        = (field: 'liquid' | 'illiquid', value: string) => {
    updateDraft({ ...assets, cash: { ...assets.cash, [field]: parseFloat(value) || 0 } });
  };
  const updateStockQty    = (id: string, value: string) => {
    updateDraft({ ...assets, stocks: assets.stocks.map((s) => (s.id === id ? { ...s, quantity: parseInt(value) || 0 } : s)) });
  };
  const updateGold        = (value: string) => {
    updateDraft({ ...assets, gold: { grams: parseFloat(value) || 0 } });
  };
  const updateCryptoQty   = (id: string, value: string) => {
    updateDraft({ ...assets, crypto: assets.crypto.map((c) => (c.id === id ? { ...c, quantity: parseFloat(value) || 0 } : c)) });
  };
  const updateFixedAmount = (field: 'deposit' | 'pension', value: string) => {
    updateDraft({ ...assets, fixedAsset: { ...assets.fixedAsset, [field]: parseFloat(value) || 0 } });
  };
  const updateFixedInclude = (field: 'depositIncluded' | 'pensionIncluded', value: boolean) => {
    updateDraft({ ...assets, fixedAsset: { ...assets.fixedAsset, [field]: value } });
  };

  const inputCls =
    'min-w-0 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent';

  return (
    <div className="space-y-5">
      <PageHeader
        title="자산 입력"
        action={
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
            {latestSnapshot && (
              <Button
                variant="secondary"
                size="sm"
                onClick={loadLatestSnapshot}
                title={`마지막 저장: ${new Date(latestSnapshot.createdAt).toLocaleString('ko-KR')}`}
              >
                <Download size={13} />
                최근 저장값 불러오기
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={resetAssets} className="whitespace-nowrap">
              <RotateCcw size={13} />
              초기화
            </Button>
            <Button size="sm" onClick={saveAssets} className="whitespace-nowrap">
              {savedOwner === selectedOwner ? <CheckCircle2 size={13} /> : <Save size={13} />}
              {savedOwner === selectedOwner ? '저장 완료' : '저장'}
            </Button>
            {/* 소유자 선택 */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              {(['beomseok', 'seyeon'] as Owner[]).map((o) => (
                <button
                  key={o}
                  onClick={() => setSelectedOwner(o)}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedOwner === o ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {o === 'beomseok' ? '범석' : '세연'}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {savedOwner === selectedOwner && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={15} className="flex-shrink-0" />
          {ownerLabel}님의 자산 입력값을 저장했습니다.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 현금 */}
        <SectionCard title="현금" description="단위: 만원">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-0.5">유동 현금</label>
              <p className="text-xs text-slate-400 mb-2">
                은행계좌, 증권계좌 예수금 등 바로 투자금으로 활용 가능한 돈
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0"
                  value={assets.cash.liquid || ''}
                  onChange={(e) => updateCash('liquid', e.target.value)}
                  placeholder="0"
                  className={`flex-1 ${inputCls}`}
                />
                <span className="text-sm text-slate-400 w-10">만원</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                = {formatKrw((assets.cash.liquid || 0) * 10000)}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-0.5">비유동 현금</label>
              <p className="text-xs text-slate-400 mb-2">
                청약통장, 청년도약계좌 등 만기가 길어 유동성이 낮은 돈
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0"
                  value={assets.cash.illiquid || ''}
                  onChange={(e) => updateCash('illiquid', e.target.value)}
                  placeholder="0"
                  className={`flex-1 ${inputCls}`}
                />
                <span className="text-sm text-slate-400 w-10">만원</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                = {formatKrw((assets.cash.illiquid || 0) * 10000)}
              </p>
            </div>
          </div>
        </SectionCard>

        {/* 금 */}
        <SectionCard title="금 (KRX 금현물)">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">보유 수량</label>
            <div className="flex items-center gap-2">
              <input
                type="number" min="0" step="0.01"
                value={assets.gold.grams || ''}
                onChange={(e) => updateGold(e.target.value)}
                placeholder="0"
                className={`flex-1 ${inputCls}`}
              />
              <span className="text-sm text-slate-400 w-6">g</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">현재 가격은 대시보드에서 확인하세요.</p>
          </div>
        </SectionCard>

        {/* 고정자산 */}
        <SectionCard title="고정자산" description="단위: 만원">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-600">전세자금</label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assets.fixedAsset.depositIncluded}
                    onChange={(e) => updateFixedInclude('depositIncluded', e.target.checked)}
                    className="rounded accent-indigo-600"
                  />
                  <span className="text-xs text-slate-500">포트폴리오 포함</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0"
                  value={assets.fixedAsset.deposit || ''}
                  onChange={(e) => updateFixedAmount('deposit', e.target.value)}
                  placeholder="0"
                  className={`flex-1 ${inputCls}`}
                />
                <span className="text-sm text-slate-400 w-10">만원</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                = {formatKrw((assets.fixedAsset.deposit || 0) * 10000)}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-600">개인연금</label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assets.fixedAsset.pensionIncluded}
                    onChange={(e) => updateFixedInclude('pensionIncluded', e.target.checked)}
                    className="rounded accent-indigo-600"
                  />
                  <span className="text-xs text-slate-500">포트폴리오 포함</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0"
                  value={assets.fixedAsset.pension || ''}
                  onChange={(e) => updateFixedAmount('pension', e.target.value)}
                  placeholder="0"
                  className={`flex-1 ${inputCls}`}
                />
                <span className="text-sm text-slate-400 w-10">만원</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                = {formatKrw((assets.fixedAsset.pension || 0) * 10000)}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* 주식 */}
      <SectionCard title="주식 보유 수량">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 pb-2 border-b border-slate-100">
              국내주식
            </p>
            <div className="space-y-2">
              {assets.stocks.filter((s) => s.market === 'domestic').map((stock) => (
                <div key={stock.id} className="flex items-center gap-2">
                  <span className="text-sm text-slate-700 w-28 truncate">{stock.name}</span>
                  <span className="text-xs text-slate-400 w-16 font-mono">{stock.ticker}</span>
                  <input
                    type="number" min="0"
                    value={stock.quantity || ''}
                    onChange={(e) => updateStockQty(stock.id, e.target.value)}
                    placeholder="0"
                    className={`flex-1 ${inputCls} py-1.5`}
                  />
                  <span className="text-xs text-slate-400 w-5">주</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 pb-2 border-b border-slate-100">
              미국주식
            </p>
            <div className="space-y-2">
              {assets.stocks.filter((s) => s.market === 'us').map((stock) => (
                <div key={stock.id} className="flex items-center gap-2">
                  <span className="text-sm text-slate-700 w-24 truncate">{stock.name}</span>
                  <span className="text-xs text-slate-400 w-12 font-mono">{stock.ticker}</span>
                  <input
                    type="number" min="0"
                    value={stock.quantity || ''}
                    onChange={(e) => updateStockQty(stock.id, e.target.value)}
                    placeholder="0"
                    className={`flex-1 ${inputCls} py-1.5`}
                  />
                  <span className="text-xs text-slate-400 w-5">주</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 가상화폐 */}
      <SectionCard title="가상화폐 보유 수량">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {assets.crypto.map((coin) => (
            <div key={coin.id}>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {coin.name}
                <span className="text-slate-400 ml-1 font-mono">{coin.ticker}</span>
              </label>
              <input
                type="number" min="0" step="0.0001"
                value={coin.quantity || ''}
                onChange={(e) => updateCryptoQty(coin.id, e.target.value)}
                placeholder="0.0000"
                className={`w-full ${inputCls}`}
              />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
