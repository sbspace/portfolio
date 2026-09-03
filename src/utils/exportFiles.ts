import html2canvas from 'html2canvas';
import type { PortfolioCalculation } from '@/types';

export function makeFilename(ext: 'csv' | 'png', date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const s = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `portfolio_${s}.${ext}`;
}

export async function captureElementToBlob(el: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(el, {
    scale: 1.5,
    useCORS: true,
    logging: false,
    backgroundColor: '#f8fafc',
    allowTaint: false,
  });
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null'))),
      'image/png'
    );
  });
}

export function generateSnapshotCsv(portfolio: PortfolioCalculation, createdAt: string): string {
  const date = new Date(createdAt).toLocaleString('ko-KR');

  const rows: (string | number)[][] = [
    ['포트폴리오 스냅샷'],
    ['날짜', date],
    ['총자산(원)', portfolio.totalKrw],
    ...(portfolio.totalKrwWithFixed > portfolio.totalKrw
      ? [['고정자산 포함 총자산(원)', portfolio.totalKrwWithFixed]]
      : []),
    [],
    ['카테고리별 현황'],
    ['카테고리', '평가액(원)', '비중(%)'],
    ['현금', portfolio.categoryValues.cash, portfolio.categoryWeights.cash.toFixed(2)],
    ['주식', portfolio.categoryValues.stock, portfolio.categoryWeights.stock.toFixed(2)],
    ['금', portfolio.categoryValues.gold, portfolio.categoryWeights.gold.toFixed(2)],
    ['가상화폐', portfolio.categoryValues.crypto, portfolio.categoryWeights.crypto.toFixed(2)],
    ...(portfolio.includesFixedAsset
      ? [['고정자산', portfolio.categoryValues.fixedAsset, portfolio.categoryWeights.fixedAsset.toFixed(2)]]
      : []),
    [],
    ['주식 종목별'],
    ['종목명', '시장', '수량', '단가(원)', '평가액(원)', '포트폴리오 비중(%)'],
    ...portfolio.stockHoldings
      .filter((h) => h.quantity > 0)
      .sort((a, b) => b.valueKrw - a.valueKrw)
      .map((h) => [
        h.name,
        h.market === 'us' ? '미국' : '국내',
        h.quantity,
        Math.round(h.priceKrw),
        h.valueKrw,
        portfolio.totalKrw > 0 ? ((h.valueKrw / portfolio.totalKrw) * 100).toFixed(2) : '0',
      ]),
    [],
    ['가상화폐 종목별'],
    ['코인명', '수량', '단가(원)', '평가액(원)', '포트폴리오 비중(%)'],
    ...portfolio.cryptoHoldings
      .filter((h) => h.quantity > 0)
      .sort((a, b) => b.valueKrw - a.valueKrw)
      .map((h) => [
        h.name,
        h.quantity,
        Math.round(h.priceKrw),
        h.valueKrw,
        portfolio.totalKrw > 0 ? ((h.valueKrw / portfolio.totalKrw) * 100).toFixed(2) : '0',
      ]),
  ];

  // UTF-8 BOM for Excel 한글 호환
  return '﻿' + rows.map((r) => r.join(',')).join('\r\n');
}

export function triggerDownload(content: Blob | string, filename: string, mimeType?: string): void {
  const blob =
    typeof content === 'string'
      ? new Blob([content], { type: mimeType ?? 'text/csv;charset=utf-8;' })
      : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
