import { v4 as uuidv4 } from 'uuid';
import type {
  AppState,
  PersonAssets,
  TargetWeights,
  AppSettings,
  StockTickerConfig,
  CryptoTickerConfig,
} from '@/types';

// Yahoo Finance 티커 기준:
//   KOSPI 종목: {ticker}.KS  (삼성전자, SK하이닉스)
//   KOSDAQ 종목: {ticker}.KQ (파두, 미코)
//   미국주식: 티커 그대로

export const DEFAULT_STOCK_TICKERS: StockTickerConfig[] = [
  { id: uuidv4(), ticker: '000660', name: 'SK하이닉스',  market: 'domestic', yahooTicker: '000660.KS' },
  { id: uuidv4(), ticker: '059090', name: '미코',        market: 'domestic', yahooTicker: '059090.KQ' },
  { id: uuidv4(), ticker: '005930', name: '삼성전자',    market: 'domestic', yahooTicker: '005930.KS' },
  { id: uuidv4(), ticker: '440110', name: '파두',        market: 'domestic', yahooTicker: '440110.KQ' },
  { id: uuidv4(), ticker: 'TSLA',   name: 'Tesla',       market: 'us' },
  { id: uuidv4(), ticker: 'SPCX',   name: 'SPCX',        market: 'us' },
  { id: uuidv4(), ticker: 'RKLB',   name: 'Rocket Lab',  market: 'us' },
  { id: uuidv4(), ticker: 'QLD',    name: 'QLD',          market: 'us' },
  { id: uuidv4(), ticker: 'MRVL',   name: 'Marvell Tech', market: 'us' },
  { id: uuidv4(), ticker: 'IREN',   name: 'Iris Energy',  market: 'us' },
  { id: uuidv4(), ticker: 'INTC',   name: 'Intel',        market: 'us' },
  { id: uuidv4(), ticker: 'INFQ',   name: 'INFQ',         market: 'us' },
  { id: uuidv4(), ticker: 'CRCL',   name: 'CRCL',         market: 'us' },
  { id: uuidv4(), ticker: 'CBRS',   name: 'CBRS',         market: 'us' },
];

export const DEFAULT_CRYPTO_TICKERS: CryptoTickerConfig[] = [
  { id: uuidv4(), ticker: 'BTC',  name: 'Bitcoin'  },
  { id: uuidv4(), ticker: 'ETH',  name: 'Ethereum' },
  { id: uuidv4(), ticker: 'SOL',  name: 'Solana'   },
  { id: uuidv4(), ticker: 'DOGE', name: 'Dogecoin' },
];

function makeEmptyPersonAssets(
  owner: 'beomseok' | 'seyeon',
  stockTickers: StockTickerConfig[],
  cryptoTickers: CryptoTickerConfig[]
): PersonAssets {
  return {
    owner,
    cash: { liquid: 0, illiquid: 0 },
    stocks: stockTickers.map((t) => ({
      id: t.id,
      ticker: t.ticker,
      name: t.name,
      market: t.market,
      quantity: 0,
    })),
    gold: { grams: 0 },
    crypto: cryptoTickers.map((t) => ({
      id: t.id,
      ticker: t.ticker,
      name: t.name,
      quantity: 0,
    })),
    fixedAsset: { deposit: 0, pension: 0, depositIncluded: false, pensionIncluded: false },
  };
}

export const DEFAULT_TARGET_WEIGHTS: TargetWeights = {
  cash: 20,
  stock: 50,
  gold: 10,
  crypto: 20,
  fixedAsset: 0,
  stockHoldings: {},
  cryptoHoldings: {},
};

export const DEFAULT_SETTINGS: AppSettings = {
  stockTickers: DEFAULT_STOCK_TICKERS,
  cryptoTickers: DEFAULT_CRYPTO_TICKERS,
  priceProviderType: 'real',
  goldManualPricePerGram: 130000,
};

export function makeDefaultAppState(): AppState {
  const { stockTickers, cryptoTickers } = DEFAULT_SETTINGS;
  return {
    beomseokAssets: makeEmptyPersonAssets('beomseok', stockTickers, cryptoTickers),
    seyeonAssets: makeEmptyPersonAssets('seyeon', stockTickers, cryptoTickers),
    targetWeights: DEFAULT_TARGET_WEIGHTS,
    snapshots: [],
    memo: '',
    memos: [],
    datedMemos: {},
    memoTitles: {},
    settings: DEFAULT_SETTINGS,
  };
}

export function makeEmptyPersonAssetsFromConfig(
  owner: 'beomseok' | 'seyeon',
  stockTickers: StockTickerConfig[],
  cryptoTickers: CryptoTickerConfig[]
): PersonAssets {
  return makeEmptyPersonAssets(owner, stockTickers, cryptoTickers);
}
