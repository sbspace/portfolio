import type { AppState, AppSettings, StockTickerConfig, PersonAssets, FixedAsset } from '@/types';
import { makeDefaultAppState, DEFAULT_SETTINGS } from '@/data/defaults';
import { migrateMemos } from '@/utils/memos';

const STORAGE_KEY = 'portfolio_app_v1';
const STATE_API_URL = '/api/state';

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

export function normalizeState(raw: Partial<AppState>): AppState {
  const defaults = makeDefaultAppState();
  return {
    beomseokAssets: migratePersonAssets(raw.beomseokAssets, defaults.beomseokAssets),
    seyeonAssets: migratePersonAssets(raw.seyeonAssets, defaults.seyeonAssets),
    targetWeights: raw.targetWeights ?? defaults.targetWeights,
    snapshots: raw.snapshots ?? [],
    memo: typeof raw.memo === 'string' ? raw.memo : defaults.memo,
    memos: migrateMemos(raw),
    memoTitles: raw.memoTitles && typeof raw.memoTitles === 'object' && !Array.isArray(raw.memoTitles)
      ? Object.fromEntries(Object.entries(raw.memoTitles).filter(([key, title]) =>
          (key === 'legacy' || /^\d{4}-\d{2}-\d{2}$/.test(key)) && typeof title === 'string'))
      : {},
    datedMemos: raw.datedMemos && typeof raw.datedMemos === 'object' && !Array.isArray(raw.datedMemos)
      ? Object.fromEntries(Object.entries(raw.datedMemos).filter(([date, content]) =>
          /^\d{4}-\d{2}-\d{2}$/.test(date) && typeof content === 'string'))
      : {},
    settings: migrateSettings((raw.settings ?? {}) as Partial<AppSettings>),
  };
}

export function hasStoredState(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw) as Partial<AppState>) : makeDefaultAppState();
  } catch {
    return makeDefaultAppState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Leave room for other portfolio data when embedding images in the shared state.
export function checkMemoImageCapacity(imageHtml: string): void {
  const current = localStorage.getItem(STORAGE_KEY) ?? '';
  if (new Blob([current, imageHtml]).size > 1_000_000) {
    throw new Error('이미지를 저장할 공간이 부족합니다. 불필요한 메모 이미지를 지운 후 다시 시도해 주세요.');
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function loadRemoteState(): Promise<AppState | null> {
  const response = await fetch(STATE_API_URL, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`D1 load failed: HTTP ${response.status}`);

  return normalizeState((await response.json()) as Partial<AppState>);
}

export async function saveRemoteState(state: AppState): Promise<void> {
  const response = await fetch(STATE_API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });

  if (!response.ok) throw new Error(`D1 save failed: HTTP ${response.status}`);
}
