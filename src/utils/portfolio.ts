import type {
  PersonAssets,
  PriceData,
  PortfolioCalculation,
  CategoryValues,
  HoldingValue,
} from '@/types';
import { manWonToWon } from './formatting';

function calcStockValueKrw(
  ticker: string,
  market: 'domestic' | 'us',
  quantity: number,
  prices: PriceData,
  manualPrice?: number
): number {
  if (quantity === 0) return 0;
  const price = prices.stocks[ticker] ?? manualPrice ?? 0;
  if (market === 'domestic') {
    return quantity * price;
  }
  return quantity * price * prices.usdKrw;
}

function calcCryptoValueKrw(
  ticker: string,
  quantity: number,
  prices: PriceData,
  manualPrice?: number
): number {
  if (quantity === 0) return 0;
  const price = prices.crypto[ticker] ?? manualPrice ?? 0;
  return quantity * price;
}

export function calcPersonPortfolio(
  assets: PersonAssets,
  prices: PriceData
): {
  cashLiquidKrw: number;
  cashIlliquidKrw: number;
  stockHoldings: HoldingValue[];
  goldValueKrw: number;
  cryptoHoldings: HoldingValue[];
  fixedDepositKrw: number;
  fixedPensionKrw: number;
} {
  const cashLiquidKrw = manWonToWon(assets.cash.liquid);
  const cashIlliquidKrw = manWonToWon(assets.cash.illiquid);

  const stockHoldings: HoldingValue[] = assets.stocks.map((s) => {
    const rawPrice = prices.stocks[s.ticker] ?? s.manualPrice ?? 0;
    const priceKrw =
      s.market === 'domestic' ? rawPrice : rawPrice * prices.usdKrw;
    const valueKrw = calcStockValueKrw(s.ticker, s.market, s.quantity, prices, s.manualPrice);
    return {
      id: s.id,
      ticker: s.ticker,
      name: s.name,
      valueKrw,
      quantity: s.quantity,
      priceKrw,
      market: s.market,
      priceUsd: s.market === 'us' ? rawPrice : undefined,
    };
  });

  const goldValueKrw = assets.gold.grams * prices.goldPerGram;

  const cryptoHoldings: HoldingValue[] = assets.crypto.map((c) => {
    const priceKrw = prices.crypto[c.ticker] ?? c.manualPrice ?? 0;
    const valueKrw = calcCryptoValueKrw(c.ticker, c.quantity, prices, c.manualPrice);
    return { id: c.id, ticker: c.ticker, name: c.name, valueKrw, quantity: c.quantity, priceKrw };
  });

  const fixedDepositKrw = manWonToWon(assets.fixedAsset.deposit);
  const fixedPensionKrw = manWonToWon(assets.fixedAsset.pension);

  return {
    cashLiquidKrw,
    cashIlliquidKrw,
    stockHoldings,
    goldValueKrw,
    cryptoHoldings,
    fixedDepositKrw,
    fixedPensionKrw,
  };
}

function mergeHoldings(a: HoldingValue[], b: HoldingValue[]): HoldingValue[] {
  const map = new Map<string, HoldingValue>();
  for (const h of [...a, ...b]) {
    const existing = map.get(h.id);
    if (existing) {
      map.set(h.id, {
        ...existing,
        quantity: existing.quantity + h.quantity,
        valueKrw: existing.valueKrw + h.valueKrw,
      });
    } else {
      map.set(h.id, { ...h });
    }
  }
  return Array.from(map.values());
}

export function calcCombinedPortfolio(
  beomseok: PersonAssets,
  seyeon: PersonAssets,
  prices: PriceData
): PortfolioCalculation {
  const b = calcPersonPortfolio(beomseok, prices);
  const s = calcPersonPortfolio(seyeon, prices);

  const cashLiquidKrw = b.cashLiquidKrw + s.cashLiquidKrw;
  const cashIlliquidKrw = b.cashIlliquidKrw + s.cashIlliquidKrw;
  const cashKrw = cashLiquidKrw + cashIlliquidKrw;

  const stockHoldings = mergeHoldings(b.stockHoldings, s.stockHoldings);
  const stockKrw = stockHoldings.reduce((sum, h) => sum + h.valueKrw, 0);

  const goldValueKrw = b.goldValueKrw + s.goldValueKrw;

  const cryptoHoldings = mergeHoldings(b.cryptoHoldings, s.cryptoHoldings);
  const cryptoKrw = cryptoHoldings.reduce((sum, h) => sum + h.valueKrw, 0);

  const fixedDepositKrw = b.fixedDepositKrw + s.fixedDepositKrw;
  const fixedPensionKrw = b.fixedPensionKrw + s.fixedPensionKrw;

  // 전세자금/개인연금 각각의 포함 여부
  const includesFixedDeposit =
    beomseok.fixedAsset.depositIncluded || seyeon.fixedAsset.depositIncluded;
  const includesFixedPension =
    beomseok.fixedAsset.pensionIncluded || seyeon.fixedAsset.pensionIncluded;
  const includesFixedAsset = includesFixedDeposit || includesFixedPension;

  // 포트폴리오에 포함할 고정자산 금액 (각 항목별 포함 여부 적용)
  const bDepositIncluded = beomseok.fixedAsset.depositIncluded ? b.fixedDepositKrw : 0;
  const sDepositIncluded = seyeon.fixedAsset.depositIncluded ? s.fixedDepositKrw : 0;
  const bPensionIncluded = beomseok.fixedAsset.pensionIncluded ? b.fixedPensionKrw : 0;
  const sPensionIncluded = seyeon.fixedAsset.pensionIncluded ? s.fixedPensionKrw : 0;
  const fixedIncludedKrw = bDepositIncluded + sDepositIncluded + bPensionIncluded + sPensionIncluded;

  const totalKrw = cashKrw + stockKrw + goldValueKrw + cryptoKrw + fixedIncludedKrw;
  const totalKrwWithFixed = cashKrw + stockKrw + goldValueKrw + cryptoKrw + fixedDepositKrw + fixedPensionKrw;

  const w = (v: number) => (totalKrw > 0 ? (v / totalKrw) * 100 : 0);

  const categoryValues: CategoryValues = {
    cash: cashKrw,
    stock: stockKrw,
    gold: goldValueKrw,
    crypto: cryptoKrw,
    fixedAsset: fixedIncludedKrw,
  };

  const categoryWeights: CategoryValues = {
    cash: w(cashKrw),
    stock: w(stockKrw),
    gold: w(goldValueKrw),
    crypto: w(cryptoKrw),
    fixedAsset: includesFixedAsset ? w(fixedIncludedKrw) : 0,
  };

  return {
    totalKrw,
    totalKrwWithFixed,
    categoryValues,
    categoryWeights,
    stockHoldings,
    cryptoHoldings,
    goldValueKrw,
    cashLiquidKrw,
    cashIlliquidKrw,
    fixedDepositKrw,
    fixedPensionKrw,
    includesFixedAsset,
    includesFixedDeposit,
    includesFixedPension,
  };
}

export function calcSinglePersonPortfolio(
  assets: PersonAssets,
  prices: PriceData
): PortfolioCalculation {
  const p = calcPersonPortfolio(assets, prices);

  const cashKrw = p.cashLiquidKrw + p.cashIlliquidKrw;
  const stockKrw = p.stockHoldings.reduce((sum, h) => sum + h.valueKrw, 0);
  const cryptoKrw = p.cryptoHoldings.reduce((sum, h) => sum + h.valueKrw, 0);

  const includesFixedDeposit = assets.fixedAsset.depositIncluded;
  const includesFixedPension = assets.fixedAsset.pensionIncluded;
  const includesFixedAsset = includesFixedDeposit || includesFixedPension;

  const fixedIncludedKrw =
    (includesFixedDeposit ? p.fixedDepositKrw : 0) +
    (includesFixedPension ? p.fixedPensionKrw : 0);

  const totalKrw = cashKrw + stockKrw + p.goldValueKrw + cryptoKrw + fixedIncludedKrw;
  const totalKrwWithFixed =
    cashKrw + stockKrw + p.goldValueKrw + cryptoKrw + p.fixedDepositKrw + p.fixedPensionKrw;

  const w = (v: number) => (totalKrw > 0 ? (v / totalKrw) * 100 : 0);

  const categoryValues: CategoryValues = {
    cash: cashKrw,
    stock: stockKrw,
    gold: p.goldValueKrw,
    crypto: cryptoKrw,
    fixedAsset: fixedIncludedKrw,
  };

  const categoryWeights: CategoryValues = {
    cash: w(cashKrw),
    stock: w(stockKrw),
    gold: w(p.goldValueKrw),
    crypto: w(cryptoKrw),
    fixedAsset: includesFixedAsset ? w(fixedIncludedKrw) : 0,
  };

  return {
    totalKrw,
    totalKrwWithFixed,
    categoryValues,
    categoryWeights,
    stockHoldings: p.stockHoldings,
    cryptoHoldings: p.cryptoHoldings,
    goldValueKrw: p.goldValueKrw,
    cashLiquidKrw: p.cashLiquidKrw,
    cashIlliquidKrw: p.cashIlliquidKrw,
    fixedDepositKrw: p.fixedDepositKrw,
    fixedPensionKrw: p.fixedPensionKrw,
    includesFixedAsset,
    includesFixedDeposit,
    includesFixedPension,
  };
}
