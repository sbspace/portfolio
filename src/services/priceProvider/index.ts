import type { PriceProvider, PriceProviderType } from '@/types';
import { mockPriceProvider } from './mockProvider';
import { RealPriceProvider } from './realProvider';

export function getPriceProvider(type: PriceProviderType): PriceProvider {
  if (type === 'real') return new RealPriceProvider();
  return mockPriceProvider;
}

export { mockPriceProvider } from './mockProvider';
export { RealPriceProvider } from './realProvider';
export { priceCache } from './cache';
