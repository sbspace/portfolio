import type { PriceData, PriceProvider, StockTickerConfig, CryptoTickerConfig, FetchPricesOptions } from '@/types';

const MOCK_STOCK_PRICES: Record<string, number> = {
  // 국내주식 (원)
  '000660': 3000000, // SK하이닉스
  '059090': 8500,    // 미코
  '005930': 58000,   // 삼성전자
  '440110': 12000,   // 파두
  // 미국주식 (USD)
  TSLA: 245.5,
  SPCX: 18.2,
  RKLB: 22.8,
  QLD: 112.3,
  MRVL: 98.7,
  IREN: 9.4,
  INTC: 21.3,
  INFQ: 15.0,
  CRCL: 8.5,
  CBRS: 11.2,
};

const MOCK_CRYPTO_PRICES: Record<string, number> = {
  BTC: 135_000_000,
  ETH:   5_200_000,
  SOL:     280_000,
  DOGE:        580,
};

const MOCK_USD_KRW = 1380;
const MOCK_GOLD_PER_GRAM = 130_000;

export const mockPriceProvider: PriceProvider = {
  async fetchPrices(
    stockTickers: StockTickerConfig[],
    cryptoTickers: CryptoTickerConfig[],
    _options?: FetchPricesOptions
  ): Promise<PriceData> {
    await new Promise((r) => setTimeout(r, 300)); // 네트워크 지연 시뮬레이션

    const stocks: Record<string, number> = {};
    for (const t of stockTickers) {
      stocks[t.ticker] = MOCK_STOCK_PRICES[t.ticker] ?? 0;
    }

    const crypto: Record<string, number> = {};
    for (const t of cryptoTickers) {
      crypto[t.ticker] = MOCK_CRYPTO_PRICES[t.ticker] ?? 0;
    }

    return {
      usdKrw: MOCK_USD_KRW,
      stocks,
      goldPerGram: MOCK_GOLD_PER_GRAM,
      crypto,
      fetchedAt: new Date().toISOString(),
      source: 'mock',
      errors: [],
    };
  },
};
