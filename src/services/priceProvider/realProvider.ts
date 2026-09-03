import type {
  PriceProvider,
  PriceData,
  StockTickerConfig,
  CryptoTickerConfig,
  FetchPricesOptions,
  PriceSource,
} from '@/types';
import { priceCache } from './cache';
import { fetchYahooParallel, resolveYahooTicker } from './yahoo';
import { fetchUpbitPrices } from './upbit';

const GOLD_OZ_PER_GRAM = 31.1035; // 트로이온스 → 그램 변환
const DEFAULT_USD_KRW = 1380;
const DEFAULT_GOLD_PER_GRAM = 130_000;

const KEY_USDKRW = 'fx:usdkrw';
const KEY_GOLD = 'gold:krw_per_gram';
const stockKey = (t: string) => `stock:${t}`;
const cryptoKey = (t: string) => `crypto:${t}`;

export class RealPriceProvider implements PriceProvider {
  async fetchPrices(
    stockTickers: StockTickerConfig[],
    cryptoTickers: CryptoTickerConfig[],
    options: FetchPricesOptions = {}
  ): Promise<PriceData> {
    const errors: string[] = [];
    let madeApiCall = false;

    // ── 1. 주식 + USD/KRW + 금 (Yahoo Finance 병렬) ─────────────────────
    // USDKRW 신선도를 배치 전체의 기준으로 사용
    const yahooNeedsRefresh =
      !priceCache.isFresh(KEY_USDKRW) ||
      stockTickers.some((s) => !priceCache.isFresh(stockKey(s.ticker)));

    let usdKrw = priceCache.getLast(KEY_USDKRW) ?? DEFAULT_USD_KRW;
    let goldPerGram = priceCache.getLast(KEY_GOLD) ?? options.goldManualPricePerGram ?? DEFAULT_GOLD_PER_GRAM;
    const stockPrices: Record<string, number> = {};

    if (yahooNeedsRefresh) {
      madeApiCall = true;
      const yahooTickerMap: Record<string, string> = {}; // yahooTicker -> appTicker
      const yahooTickers: string[] = [];

      for (const s of stockTickers) {
        const yt = resolveYahooTicker(s);
        yahooTickerMap[yt] = s.ticker;
        yahooTickers.push(yt);
      }
      yahooTickers.push('KRW=X', 'GC=F');

      const { prices: yahooResult, errors: yahooErrors } = await fetchYahooParallel(yahooTickers);

      // USD/KRW
      if (yahooResult['KRW=X']) {
        usdKrw = yahooResult['KRW=X'];
        priceCache.set(KEY_USDKRW, usdKrw);
      } else {
        errors.push(
          `USD/KRW 조회 실패 (${yahooErrors['KRW=X'] ?? ''}) — ${usdKrw.toFixed(0)}원 사용`
        );
      }

      // 금 (GC=F USD/oz → KRW/g)
      if (yahooResult['GC=F']) {
        goldPerGram = Math.round((yahooResult['GC=F'] * usdKrw) / GOLD_OZ_PER_GRAM);
        priceCache.set(KEY_GOLD, goldPerGram);
      } else {
        const fallback = priceCache.getLast(KEY_GOLD) ?? options.goldManualPricePerGram ?? DEFAULT_GOLD_PER_GRAM;
        goldPerGram = fallback;
        errors.push(
          `금(GC=F) 조회 실패 (${yahooErrors['GC=F'] ?? ''}) — ${(fallback / 10000).toFixed(1)}만원/g 사용`
        );
      }

      // 주식
      for (const s of stockTickers) {
        const yt = resolveYahooTicker(s);
        if (yahooResult[yt] !== undefined) {
          stockPrices[s.ticker] = yahooResult[yt];
          priceCache.set(stockKey(s.ticker), yahooResult[yt]);
        } else {
          const last = priceCache.getLast(stockKey(s.ticker));
          stockPrices[s.ticker] = last ?? 0;
          errors.push(
            `${s.name}(${s.ticker}) 조회 실패 (${yahooErrors[yt] ?? ''})${last ? ' — 마지막 가격 사용' : ''}`
          );
        }
      }
    } else {
      // 캐시에서 읽기
      for (const s of stockTickers) {
        stockPrices[s.ticker] = priceCache.getLast(stockKey(s.ticker)) ?? 0;
      }
    }

    // ── 2. 가상화폐 (업비트 배치) ─────────────────────────────────────────
    const cryptoNeedsRefresh =
      cryptoTickers.length > 0 &&
      cryptoTickers.some((c) => !priceCache.isFresh(cryptoKey(c.ticker)));

    const cryptoPrices: Record<string, number> = {};

    if (cryptoNeedsRefresh) {
      madeApiCall = true;
      try {
        const upbitResult = await fetchUpbitPrices(cryptoTickers.map((c) => c.ticker));
        for (const c of cryptoTickers) {
          const price = upbitResult[c.ticker];
          if (typeof price === 'number' && price > 0) {
            cryptoPrices[c.ticker] = price;
            priceCache.set(cryptoKey(c.ticker), price);
          } else {
            const last = priceCache.getLast(cryptoKey(c.ticker));
            cryptoPrices[c.ticker] = last ?? 0;
            errors.push(`${c.name}(${c.ticker}) 업비트 조회 실패${last ? ' — 마지막 가격 사용' : ''}`);
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`업비트 연결 오류: ${msg}`);
        for (const c of cryptoTickers) {
          cryptoPrices[c.ticker] = priceCache.getLast(cryptoKey(c.ticker)) ?? 0;
        }
      }
    } else {
      for (const c of cryptoTickers) {
        cryptoPrices[c.ticker] = priceCache.getLast(cryptoKey(c.ticker)) ?? 0;
      }
    }

    // ── 3. PriceSource 결정 ───────────────────────────────────────────────
    let source: PriceSource;
    if (!madeApiCall) {
      source = 'cached';
    } else if (errors.length === 0) {
      source = 'realtime';
    } else {
      source = 'fallback';
    }

    return {
      usdKrw,
      stocks: stockPrices,
      goldPerGram,
      crypto: cryptoPrices,
      fetchedAt: new Date().toISOString(),
      source,
      errors,
    };
  }
}
