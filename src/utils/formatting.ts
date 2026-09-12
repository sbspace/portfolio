// 내부 계산은 원(KRW) 단위, 표시는 만원/억원 단위
import type { StockMarket } from '@/types';

export function formatKrw(won: number): string {
  if (Math.abs(won) >= 1_0000_0000) {
    return `${(won / 1_0000_0000).toFixed(2)}억원`;
  }
  if (Math.abs(won) >= 10000) {
    return `${Math.round(won / 10000).toLocaleString('ko-KR')}만원`;
  }
  return `${won.toLocaleString('ko-KR')}원`;
}

export function formatManWon(value: number, decimals = 1): string {
  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatKrwDetail(won: number): string {
  return `${won.toLocaleString('ko-KR')}원`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatGap(won: number): string {
  const sign = won >= 0 ? '+' : '';
  return `${sign}${formatKrw(won)}`;
}

export function formatPercentGap(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

// 만원 단위 입력값 → 원화로 변환
export function manWonToWon(manWon: number): number {
  return manWon * 10000;
}

// 원화 → 만원 단위로 변환 (입력 필드용)
export function wonToManWon(won: number): number {
  return won / 10000;
}

export function formatQuantity(qty: number, decimals = 4): string {
  if (Number.isInteger(qty)) return qty.toLocaleString('ko-KR');
  return qty.toFixed(decimals);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 주식 단가 포맷
 * - 국내주식: "7.8만원" (1만원 이상) 또는 "9,800원"
 * - 미국주식: "$182.34 / 25.1만원"
 */
export function formatStockPrice(
  priceKrw: number,
  market: StockMarket,
  priceUsd?: number
): string {
  if (market === 'us' && priceUsd !== undefined) {
    const krwStr =
      priceKrw >= 10_000
        ? `${formatManWon(priceKrw / 10_000)}만원`
        : `${Math.round(priceKrw).toLocaleString('ko-KR')}원`;
    return `$${priceUsd.toFixed(2)} / ${krwStr}`;
  }
  // 국내주식
  if (priceKrw >= 1_0000_0000) return `${(priceKrw / 1_0000_0000).toFixed(2)}억원`;
  if (priceKrw >= 10_000) return `${formatManWon(priceKrw / 10_000)}만원`;
  return `${Math.round(priceKrw).toLocaleString('ko-KR')}원`;
}

/**
 * 가상화폐 단가 포맷 (너무 긴 숫자는 단위 축약)
 * 예: 135,000,000원 → "1.35억원", 95,000원 → "9.5만원", 300원 → "300원"
 */
export function formatCryptoPrice(priceKrw: number): string {
  if (priceKrw >= 1_0000_0000) return `${(priceKrw / 1_0000_0000).toFixed(2)}억원`;
  if (priceKrw >= 10_000) return `${formatManWon(priceKrw / 10_000)}만원`;
  if (priceKrw >= 1_000) return `${(priceKrw / 1_000).toFixed(1)}천원`;
  return `${Math.round(priceKrw).toLocaleString('ko-KR')}원`;
}
