import { Asset } from '../types';

export const MARKETS: Asset[] = [
  { id: 'AAPL', symbol: 'AAPL', name: 'Apple Inc.', category: 'STOCKS', currentPrice: 175.50, change24h: 1.2 },
  { id: 'TSLA', symbol: 'TSLA', name: 'Tesla Inc.', category: 'STOCKS', currentPrice: 210.20, change24h: -2.5 },
  { id: 'MSFT', symbol: 'MSFT', name: 'Microsoft Corp.', category: 'STOCKS', currentPrice: 330.10, change24h: 0.8 },
  { id: 'BTC', symbol: 'BTC', name: 'Bitcoin', category: 'CRYPTO', currentPrice: 65000, change24h: 3.4 },
  { id: 'ETH', symbol: 'ETH', name: 'Ethereum', category: 'CRYPTO', currentPrice: 3400, change24h: 2.1 },
  { id: 'GOLD', symbol: 'XAU', name: 'Gold', category: 'GOLD', currentPrice: 2050, change24h: 0.5 },
  { id: 'OIL', symbol: 'WTI', name: 'Crude Oil', category: 'OIL', currentPrice: 82.30, change24h: -1.1 },
  { id: 'COFFEE', symbol: 'KC', name: 'Coffee C', category: 'COFFEE', currentPrice: 195.40, change24h: 2.8 },
];

export const getAsset = (id: string): Asset | undefined => MARKETS.find(a => a.id === id);
