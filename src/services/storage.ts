import type { AppState, AppSettings, StockTickerConfig, PersonAssets, FixedAsset } from '@/types';
import { makeDefaultAppState, DEFAULT_SETTINGS } from '@/data/defaults';

const STORAGE_KEY = 'portfolio_app_v1';

// 기본 티커에서 올바른 yahooTicker를 찾아 반환
const DEFAULT_YAHOO_MAP: Record<string, string> = Object.fromEntries(
  DEFAULT_SETTINGS.stockTickers
    .filter((t) => t.yahooTicker)
    .map((t) => [t.ticker, t.yahooTicker as string])
);

/** LocalStorage에 저장된 구버전 StockTickerConfig의 yahooTicker를 보정 */
function migrateStockTickers(stored: StockTickerConfig[]): StockTickerConfig[] {
  return stored.map((t) => {
    const correct = DEFAULT_YAHOO_MAP[t.ticker];
    if (correct && t.yahooTicker !== correct) {
      return { ...t, yahooTicker: correct };
    }
    return t;
  });
}

/** 구버전 FixedAsset.includeInPortfolio → depositIncluded/pensionIncluded 마이그레이션 */
function migrateFixedAsset(raw: Record<string, unknown>): FixedAsset {
  const oldInclude = (raw['includeInPortfolio'] as boolean) ?? false;
  return {
    deposit: (raw['deposit'] as number) ?? 0,
    pension: (raw['pension'] as number) ?? 0,
    depositIncluded: (raw['depositIncluded'] as boolean) ?? oldInclude,
    pensionIncluded: (raw['pensionIncluded'] as boolean) ?? oldInclude,
  };
}

/** PersonAssets 마이그레이션 (fixedAsset 포함) */
function migratePersonAssets(raw: unknown, defaults: PersonAssets): PersonAssets {
  if (!raw || typeof raw !== 'object') return defaults;
  const r = raw as Record<string, unknown>;
  return {
    ...defaults,
    ...(r as Partial<PersonAssets>),
    fixedAsset: migrateFixedAsset((r['fixedAsset'] as Record<string, unknown>) ?? {}),
  };
}

function migrateSettings(raw: Partial<AppSettings>): AppSettings {
  const storedTickers = raw.stockTickers ?? DEFAULT_SETTINGS.stockTickers;
  return {
    stockTickers: migrateStockTickers(storedTickers),
    cryptoTickers: raw.cryptoTickers ?? DEFAULT_SETTINGS.cryptoTickers,
    priceProviderType: raw.priceProviderType ?? 'real',
    goldManualPricePerGram: raw.goldManualPricePerGram ?? DEFAULT_SETTINGS.goldManualPricePerGram,
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeDefaultAppState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const defaults = makeDefaultAppState();
    return {
      beomseokAssets: migratePersonAssets(parsed.beomseokAssets, defaults.beomseokAssets),
      seyeonAssets:   migratePersonAssets(parsed.seyeonAssets,   defaults.seyeonAssets),
      targetWeights:  parsed.targetWeights  ?? defaults.targetWeights,
      snapshots:      parsed.snapshots      ?? [],
      settings:       migrateSettings((parsed.settings ?? {}) as Partial<AppSettings>),
    };
  } catch {
    return makeDefaultAppState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
