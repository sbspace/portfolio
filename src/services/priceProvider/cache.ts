const CACHE_TTL_MS = 5 * 60 * 1000; // 5분

interface CacheEntry {
  value: number;
  timestamp: number;
}

class PriceCacheStore {
  private entries = new Map<string, CacheEntry>();

  set(key: string, value: number): void {
    this.entries.set(key, { value, timestamp: Date.now() });
  }

  /** TTL 내 유효한 값. 만료됐으면 null. */
  getFresh(key: string): number | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
    return entry.value;
  }

  /** TTL 무시하고 마지막 값 반환. API 실패 시 fallback으로 사용. */
  getLast(key: string): number | null {
    return this.entries.get(key)?.value ?? null;
  }

  isFresh(key: string): boolean {
    const entry = this.entries.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp <= CACHE_TTL_MS;
  }

  getLastUpdatedAt(): Date | null {
    let latest = 0;
    for (const entry of this.entries.values()) {
      if (entry.timestamp > latest) latest = entry.timestamp;
    }
    return latest > 0 ? new Date(latest) : null;
  }

  /** 특정 키들이 모두 fresh 상태인지 확인 */
  allFresh(keys: string[]): boolean {
    return keys.length > 0 && keys.every((k) => this.isFresh(k));
  }

  /** 캐시 전체 삭제 (강제 새로고침용) */
  clear(): void {
    this.entries.clear();
  }
}

// 모듈 레벨 싱글톤 — 컴포넌트 리렌더링 사이에 유지됨
export const priceCache = new PriceCacheStore();
