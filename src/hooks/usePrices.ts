import { useState, useCallback, useRef } from 'react';
import type { PriceData, AppSettings } from '@/types';
import { getPriceProvider, priceCache } from '@/services/priceProvider';

interface UsePricesReturn {
  prices: PriceData | null;
  loading: boolean;
  error: string | null;
  fetchPrices: (settings: AppSettings) => Promise<PriceData | null>;
  forceRefresh: (settings: AppSettings) => Promise<PriceData | null>;
}

export function usePrices(): UsePricesReturn {
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 진행 중인 fetch를 추적해 중복 호출 방지
  const fetchingRef = useRef(false);

  const doFetch = useCallback(async (settings: AppSettings): Promise<PriceData | null> => {
    if (fetchingRef.current) return null;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const provider = getPriceProvider(settings.priceProviderType);
      const data = await provider.fetchPrices(
        settings.stockTickers,
        settings.cryptoTickers,
        { goldManualPricePerGram: settings.goldManualPricePerGram }
      );
      setPrices(data);
      // 일부 실패가 있어도 error state는 errors 배열로 표현 — hook error는 전체 실패만
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : '가격 조회 실패';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  const fetchPrices = useCallback(
    (settings: AppSettings) => doFetch(settings),
    [doFetch]
  );

  const forceRefresh = useCallback(
    (settings: AppSettings) => {
      priceCache.clear(); // TTL 무시하고 전부 새로 조회
      return doFetch(settings);
    },
    [doFetch]
  );

  return { prices, loading, error, fetchPrices, forceRefresh };
}
