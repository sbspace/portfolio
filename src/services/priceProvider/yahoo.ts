// Yahoo Finance v8/chart API — 개별 티커 병렬 조회
// v7/quote는 인증(Unauthorized) 오류로 사용 불가 → v8/chart 사용
// 개발: Vite proxy /api/yahoo → https://query1.finance.yahoo.com

const YAHOO_BASE = '/api/yahoo';
const TIMEOUT_MS = 10_000;

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: { regularMarketPrice?: number };
    }>;
    error?: { code: string; description: string } | null;
  };
}

/** 단일 티커 조회 (v8/chart) */
export async function fetchYahooSingle(yahooTicker: string): Promise<number> {
  const url = `${YAHOO_BASE}/v8/finance/chart/${encodeURIComponent(yahooTicker)}?interval=1d&range=1d`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json: YahooChartResponse = await res.json();
  const apiError = json?.chart?.error;
  if (apiError) throw new Error(`Yahoo API: ${apiError.description}`);

  const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (typeof price !== 'number') throw new Error(`${yahooTicker}: 가격 데이터 없음`);
  return price;
}

/** 여러 티커를 병렬로 조회. 실패 항목은 { ticker, error } 형태로 반환. */
export async function fetchYahooParallel(
  yahooTickers: string[]
): Promise<{ prices: Record<string, number>; errors: Record<string, string> }> {
  const results = await Promise.allSettled(
    yahooTickers.map((t) => fetchYahooSingle(t).then((price) => ({ ticker: t, price })))
  );

  const prices: Record<string, number> = {};
  const errors: Record<string, string> = {};

  for (const r of results) {
    if (r.status === 'fulfilled') {
      prices[r.value.ticker] = r.value.price;
    } else {
      const ticker = yahooTickers[results.indexOf(r)];
      errors[ticker] = r.reason instanceof Error ? r.reason.message : String(r.reason);
    }
  }
  return { prices, errors };
}

/** StockTickerConfig에서 Yahoo Finance 티커 결정 */
export function resolveYahooTicker(stock: {
  ticker: string;
  market: 'domestic' | 'us';
  yahooTicker?: string;
}): string {
  if (stock.yahooTicker) return stock.yahooTicker;
  return stock.market === 'us' ? stock.ticker : `${stock.ticker}.KS`;
}
