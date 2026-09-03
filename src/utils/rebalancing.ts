import type { PortfolioCalculation, TargetWeights, RebalancingRow } from '@/types';

export function calcRebalancing(
  portfolio: PortfolioCalculation,
  target: TargetWeights
): RebalancingRow[] {
  const { totalKrw, categoryValues, categoryWeights, stockHoldings, cryptoHoldings, includesFixedAsset } = portfolio;
  const rows: RebalancingRow[] = [];

  const categories: Array<{
    key: keyof typeof categoryValues;
    label: string;
    targetWeight: number;
  }> = [
    { key: 'cash', label: '현금', targetWeight: target.cash },
    { key: 'stock', label: '주식', targetWeight: target.stock },
    { key: 'gold', label: '금', targetWeight: target.gold },
    { key: 'crypto', label: '가상화폐', targetWeight: target.crypto },
    ...(includesFixedAsset
      ? [{ key: 'fixedAsset' as const, label: '고정자산', targetWeight: target.fixedAsset }]
      : []),
  ];

  for (const cat of categories) {
    const currentValueKrw = categoryValues[cat.key];
    const currentWeight = categoryWeights[cat.key];
    const tw = cat.targetWeight;
    const targetValueKrw = (tw / 100) * totalKrw;
    const weightGap = currentWeight - tw;
    const valueGap = currentValueKrw - targetValueKrw;

    rows.push({
      label: cat.label,
      currentValueKrw,
      currentWeight,
      targetWeight: tw,
      weightGap,
      targetValueKrw,
      valueGap,
      level: 'category',
      category: cat.key,
    });

    // 주식 종목별
    if (cat.key === 'stock' && stockHoldings.length > 0) {
      const totalStockKrw = categoryValues.stock;
      for (const h of stockHoldings) {
        const stockInnerTarget = target.stockHoldings[h.ticker] ?? 0;
        // 포트폴리오 전체 대비 목표 비중
        const portfolioTarget = (tw * stockInnerTarget) / 100;
        const currentHoldingWeight = totalKrw > 0 ? (h.valueKrw / totalKrw) * 100 : 0;
        const currentInnerWeight = totalStockKrw > 0 ? (h.valueKrw / totalStockKrw) * 100 : 0;
        const targetHoldingValueKrw = (portfolioTarget / 100) * totalKrw;
        const wGap = currentInnerWeight - stockInnerTarget;
        const vGap = h.valueKrw - targetHoldingValueKrw;

        rows.push({
          label: `${h.name} (${h.ticker})`,
          ticker: h.ticker,
          currentValueKrw: h.valueKrw,
          currentWeight: currentHoldingWeight,
          targetWeight: portfolioTarget,
          weightGap: wGap,
          targetValueKrw: targetHoldingValueKrw,
          valueGap: vGap,
          level: 'holding',
          category: 'stock',
        });
      }
    }

    // 가상화폐 종목별
    if (cat.key === 'crypto' && cryptoHoldings.length > 0) {
      const totalCryptoKrw = categoryValues.crypto;
      for (const h of cryptoHoldings) {
        const cryptoInnerTarget = target.cryptoHoldings[h.ticker] ?? 0;
        const portfolioTarget = (tw * cryptoInnerTarget) / 100;
        const currentHoldingWeight = totalKrw > 0 ? (h.valueKrw / totalKrw) * 100 : 0;
        const currentInnerWeight = totalCryptoKrw > 0 ? (h.valueKrw / totalCryptoKrw) * 100 : 0;
        const targetHoldingValueKrw = (portfolioTarget / 100) * totalKrw;
        const wGap = currentInnerWeight - cryptoInnerTarget;
        const vGap = h.valueKrw - targetHoldingValueKrw;

        rows.push({
          label: `${h.name} (${h.ticker})`,
          ticker: h.ticker,
          currentValueKrw: h.valueKrw,
          currentWeight: currentHoldingWeight,
          targetWeight: portfolioTarget,
          weightGap: wGap,
          targetValueKrw: targetHoldingValueKrw,
          valueGap: vGap,
          level: 'holding',
          category: 'crypto',
        });
      }
    }
  }

  return rows;
}

export function validateTargetWeights(
  weights: TargetWeights,
  includesFixed: boolean
): { valid: boolean; message?: string } {
  const total = weights.cash + weights.stock + weights.gold + weights.crypto + (includesFixed ? weights.fixedAsset : 0);
  if (Math.abs(total - 100) > 0.01) {
    return { valid: false, message: `상위 카테고리 비중 합계가 ${total.toFixed(1)}%입니다 (100% 필요)` };
  }

  const stockTotal = Object.values(weights.stockHoldings).reduce((s, v) => s + v, 0);
  if (Object.keys(weights.stockHoldings).length > 0 && Math.abs(stockTotal - 100) > 0.01) {
    return { valid: false, message: `주식 종목별 비중 합계가 ${stockTotal.toFixed(1)}%입니다 (100% 필요)` };
  }

  const cryptoTotal = Object.values(weights.cryptoHoldings).reduce((s, v) => s + v, 0);
  if (Object.keys(weights.cryptoHoldings).length > 0 && Math.abs(cryptoTotal - 100) > 0.01) {
    return { valid: false, message: `가상화폐 종목별 비중 합계가 ${cryptoTotal.toFixed(1)}%입니다 (100% 필요)` };
  }

  return { valid: true };
}
