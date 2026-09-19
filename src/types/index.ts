// ============================================================
// Core domain types
// ============================================================

export type Owner = 'beomseok' | 'seyeon';
export type ViewFilter = Owner | 'combined';
export type AssetCategory = 'cash' | 'stock' | 'gold' | 'crypto' | 'fixedAsset';
export type StockMarket = 'domestic' | 'us';
export type Page = 'dashboard' | 'input' | 'target' | 'rebalancing' | 'history' | 'memo' | 'settings';
export type PriceProviderType = 'mock' | 'real';
export type PriceSource = 'mock' | 'realtime' | 'cached' | 'fallback';

// ============================================================
// Asset holding types (입력값)
// ============================================================

export interface CashAsset {
  liquid: number;    // 유동 현금 (만원 단위 입력값)
  illiquid: number;  // 비유동 현금 (만원 단위 입력값)
}

export interface StockHolding {
  id: string;
  ticker: string;
  name: string;
  market: StockMarket;
  quantity: number;
  manualPrice?: number; // 가격 조회 실패 시 수동 입력 (원화)
}

export interface GoldAsset {
  grams: number; // 보유 그램
}

export interface CryptoHolding {
  id: string;
  ticker: string;
  name: string;
  quantity: number; // 소수점 4자리까지
  manualPrice?: number; // 가격 조회 실패 시 수동 입력 (원화)
}

export interface FixedAsset {
  deposit: number;          // 전세자금 (만원)
  pension: number;          // 개인연금 (만원)
  depositIncluded: boolean; // 전세자금 포트폴리오 포함
  pensionIncluded: boolean; // 개인연금 포트폴리오 포함
}

export interface PersonAssets {
  owner: Owner;
  cash: CashAsset;
  stocks: StockHolding[];
  gold: GoldAsset;
  crypto: CryptoHolding[];
  fixedAsset: FixedAsset;
}

// ============================================================
// Price data (가격 공급자)
// ============================================================

export interface PriceData {
  usdKrw: number;
  stocks: Record<string, number>; // ticker -> 가격 (국내: 원, 미국: USD)
  goldPerGram: number;            // 원/g
  crypto: Record<string, number>; // ticker -> 원화
  fetchedAt: string;
  source: PriceSource;            // 데이터 출처
  errors: string[];               // 조회 실패 항목 (fallback 사용 시 메시지)
}

// ============================================================
// Target weight (목표 비중)
// ============================================================

export interface TargetWeights {
  cash: number;
  stock: number;
  gold: number;
  crypto: number;
  fixedAsset: number;
  stockHoldings: Record<string, number>; // ticker -> 주식 내 비중 (%)
  cryptoHoldings: Record<string, number>; // ticker -> 가상화폐 내 비중 (%)
}

// ============================================================
// Calculated / derived types
// ============================================================

export interface CategoryValues {
  cash: number;
  stock: number;
  gold: number;
  crypto: number;
  fixedAsset: number;
}

export interface HoldingValue {
  id: string;
  ticker: string;
  name: string;
  valueKrw: number;
  quantity: number;
  priceKrw: number;
  market?: StockMarket; // 주식 전용
  priceUsd?: number;    // 미국주식 원래 USD 단가
}

export interface PortfolioCalculation {
  totalKrw: number;            // 포트폴리오 기준 총자산 (포함 설정된 고정자산만)
  totalKrwWithFixed: number;   // 고정자산 전체 포함 총자산
  categoryValues: CategoryValues;
  categoryWeights: CategoryValues;
  stockHoldings: HoldingValue[];
  cryptoHoldings: HoldingValue[];
  goldValueKrw: number;
  cashLiquidKrw: number;
  cashIlliquidKrw: number;
  fixedDepositKrw: number;
  fixedPensionKrw: number;
  includesFixedAsset: boolean;    // depositIncluded || pensionIncluded
  includesFixedDeposit: boolean;
  includesFixedPension: boolean;
}

export interface RebalancingRow {
  label: string;
  ticker?: string;
  currentValueKrw: number;
  currentWeight: number;
  targetWeight: number;
  weightGap: number;
  targetValueKrw: number;
  valueGap: number;
  level: 'category' | 'sub' | 'holding';
  category: AssetCategory;
}

// ============================================================
// Snapshot (이력)
// ============================================================

export interface Snapshot {
  id: string;
  createdAt: string;
  label?: string;
  beomseokAssets: PersonAssets;
  seyeonAssets: PersonAssets;
  prices: PriceData;
  targetWeights: TargetWeights;
  portfolio: PortfolioCalculation;
}

// ============================================================
// App-level state
// ============================================================

export interface AppState {
  beomseokAssets: PersonAssets;
  seyeonAssets: PersonAssets;
  targetWeights: TargetWeights;
  snapshots: Snapshot[];
  memo: string;
  datedMemos: Record<string, string>;
  memoTitles: Record<string, string>; // 날짜 키 또는 날짜 없는 기존 메모의 legacy 키
  settings: AppSettings;
}

export interface AppSettings {
  stockTickers: StockTickerConfig[];
  cryptoTickers: CryptoTickerConfig[];
  priceProviderType: PriceProviderType;
  goldManualPricePerGram: number; // 금 수동 입력 가격 (원/g), API 실패 시 fallback
}

export interface StockTickerConfig {
  id: string;
  ticker: string;      // 앱 내부 티커 (예: '000660', 'TSLA')
  name: string;
  market: StockMarket;
  yahooTicker?: string; // Yahoo Finance 티커 (예: '000660.KS', '440110.KQ')
}

export interface CryptoTickerConfig {
  id: string;
  ticker: string; // 업비트 기준 (BTC, ETH...)
  name: string;
}

// ============================================================
// Price provider interface (교체 가능한 인터페이스)
// ============================================================

export interface FetchPricesOptions {
  goldManualPricePerGram?: number; // 금 API 실패 시 fallback
}

export interface PriceProvider {
  fetchPrices(
    stockTickers: StockTickerConfig[],
    cryptoTickers: CryptoTickerConfig[],
    options?: FetchPricesOptions
  ): Promise<PriceData>;
}
