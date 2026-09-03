import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, PersonAssets, TargetWeights, PriceData, Owner, Snapshot, AppSettings, StockTickerConfig, CryptoTickerConfig } from '@/types';
import { loadState, saveState } from '@/services/storage';
import { calcCombinedPortfolio } from '@/utils/portfolio';
import { makeEmptyPersonAssetsFromConfig } from '@/data/defaults';

export function usePortfolio() {
  const [state, setState] = useState<AppState>(() => loadState());

  // state가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateBeomseokAssets = useCallback((assets: PersonAssets) => {
    setState((s) => ({ ...s, beomseokAssets: assets }));
  }, []);

  const updateSeyeonAssets = useCallback((assets: PersonAssets) => {
    setState((s) => ({ ...s, seyeonAssets: assets }));
  }, []);

  const updateTargetWeights = useCallback((weights: TargetWeights) => {
    setState((s) => ({ ...s, targetWeights: weights }));
  }, []);

  const updateSettings = useCallback((settings: AppSettings) => {
    setState((s) => ({ ...s, settings }));
  }, []);

  const saveSnapshot = useCallback(
    (prices: PriceData, label?: string) => {
      setState((s) => {
        const portfolio = calcCombinedPortfolio(s.beomseokAssets, s.seyeonAssets, prices);
        const snapshot: Snapshot = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          label,
          beomseokAssets: s.beomseokAssets,
          seyeonAssets: s.seyeonAssets,
          prices,
          targetWeights: s.targetWeights,
          portfolio,
        };
        return { ...s, snapshots: [...s.snapshots, snapshot] };
      });
    },
    []
  );

  const deleteSnapshot = useCallback((id: string) => {
    setState((s) => ({ ...s, snapshots: s.snapshots.filter((snap) => snap.id !== id) }));
  }, []);

  // 티커 설정 변경 시 양측 자산의 holding 목록을 동기화
  const syncHoldingsToTickers = useCallback(
    (stockTickers: StockTickerConfig[], cryptoTickers: CryptoTickerConfig[]) => {
      setState((s) => {
        const syncPerson = (assets: PersonAssets): PersonAssets => {
          const newStocks = stockTickers.map((t) => {
            const existing = assets.stocks.find((st) => st.id === t.id);
            return existing
              ? { ...existing, ticker: t.ticker, name: t.name, market: t.market }
              : { id: t.id, ticker: t.ticker, name: t.name, market: t.market, quantity: 0 };
          });
          const newCrypto = cryptoTickers.map((t) => {
            const existing = assets.crypto.find((c) => c.id === t.id);
            return existing
              ? { ...existing, ticker: t.ticker, name: t.name }
              : { id: t.id, ticker: t.ticker, name: t.name, quantity: 0 };
          });
          return { ...assets, stocks: newStocks, crypto: newCrypto };
        };

        return {
          ...s,
          beomseokAssets: syncPerson(s.beomseokAssets),
          seyeonAssets: syncPerson(s.seyeonAssets),
        };
      });
    },
    []
  );

  const resetPersonAssets = useCallback(
    (owner: Owner) => {
      const empty = makeEmptyPersonAssetsFromConfig(
        owner,
        state.settings.stockTickers,
        state.settings.cryptoTickers
      );
      if (owner === 'beomseok') updateBeomseokAssets(empty);
      else updateSeyeonAssets(empty);
    },
    [state.settings, updateBeomseokAssets, updateSeyeonAssets]
  );

  return {
    state,
    updateBeomseokAssets,
    updateSeyeonAssets,
    updateTargetWeights,
    updateSettings,
    saveSnapshot,
    deleteSnapshot,
    syncHoldingsToTickers,
    resetPersonAssets,
  };
}
