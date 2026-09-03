// 업비트 공개 API — CORS 허용, 프록시 불필요
// https://docs.upbit.com/reference/ticker%ED%98%84%EC%9E%AC%EA%B0%80-%EC%A0%95%EB%B3%B4

const UPBIT_BASE = 'https://api.upbit.com';
const TIMEOUT_MS = 8_000;

interface UpbitTickerItem {
  market: string;      // 'KRW-BTC'
  trade_price: number; // 현재가 (원)
}

/**
 * 업비트에서 여러 코인의 현재 원화 가격을 조회합니다.
 * @param tickers - ['BTC', 'ETH', ...]
 * @returns Record<ticker, 원화가격>
 */
export async function fetchUpbitPrices(
  tickers: string[]
): Promise<Record<string, number>> {
  if (tickers.length === 0) return {};

  const markets = tickers.map((t) => `KRW-${t}`).join(',');
  const url = `${UPBIT_BASE}/v1/ticker?markets=${encodeURIComponent(markets)}`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`업비트 API 오류: HTTP ${res.status}`);
  }

  const data: UpbitTickerItem[] = await res.json();

  const result: Record<string, number> = {};
  for (const item of data) {
    const ticker = item.market.replace('KRW-', '');
    result[ticker] = item.trade_price;
  }
  return result;
}
