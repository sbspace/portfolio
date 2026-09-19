import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, PersonAssets, TargetWeights, PriceData, Owner, Snapshot, AppSettings, StockTickerConfig, CryptoTickerConfig } from '@/types';
import {
  hasStoredState,
  loadRemoteState,
  loadState,
  saveRemoteState,
  saveState,
} from '@/services/storage';
import { calcCombinedPortfolio } from '@/utils/portfolio';
import { makeEmptyPersonAssetsFromConfig } from '@/data/defaults';

export function usePortfolio() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [remoteReady, setRemoteReady] = useState(false);
  const initialStateRef = useRef(state);
  const hadLocalStateRef = useRef(hasStoredState());

  useEffect(() => {
    let cancelled = false;

    async function hydrateFromRemote() {
      try {
        const remoteState = await loadRemoteState();
        if (cancelled) return;

        if (remoteState) {
          saveState(remoteState);
          setState(remoteState);
        } else {
          await saveRemoteState(initialStateRef.current);
          if (cancelled) return;
          if (hadLocalStateRef.current) {
            console.info('[storage] LocalStorage state migrated to D1');
          }
        }

        setRemoteReady(true);
      } catch (error) {
        console.warn('[storage] D1 unavailable; using LocalStorage only', error);
      }
    }

    void hydrateFromRemote();
    return () => {
      cancelled = true;
    };
  }, []);

  // LocalStorage remains the immediate cache and offline fallback.
  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (!remoteReady) return;

    const timeoutId = window.setTimeout(() => {
      void saveRemoteState(state).catch((error) => {
        console.warn('[storage] D1 save failed; state remains in LocalStorage', error);
      });
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [state, remoteReady]);

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

  const addMemo = useCallback(() => {
    const id = uuidv4();
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      memos: [{ id, title: '', content: '', createdAt: now, updatedAt: now }, ...s.memos],
    }));
    return id;
  }, []);

  const updateMemo = useCallback((id: string, patch: { title?: string; content?: string }) => {
    const now = new Date().toISOString();
    setState((s) => ({ ...s, memos: s.memos.map((memo) => {
      if (memo.id !== id ||
          ((patch.title === undefined || patch.title === memo.title) &&
           (patch.content === undefined || patch.content === memo.content))) return memo;
      return { ...memo, ...patch, updatedAt: now };
    }) }));
  }, []);

  const deleteMemo = useCallback((id: string) => {
    setState((s) => ({ ...s, memos: s.memos.filter((memo) => memo.id !== id) }));
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
    updateMemo,
    addMemo,
    deleteMemo,
    saveSnapshot,
    deleteSnapshot,
    syncHoldingsToTickers,
    resetPersonAssets,
  };
}
