import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { MARKETS } from '../utils/marketData';
import { Asset } from '../types';

export interface MarketHistoryPoint {
  day: string;
  value: number;
}

export interface MarketState {
  assets: Record<string, Asset>;
  history: Record<string, MarketHistoryPoint[]>;
}

interface MarketContextType {
  marketData: MarketState;
}

const MarketContext = createContext<MarketContextType | null>(null);

const generateInitialHistory = (basePrice: number, volatility: number) => {
  const data: MarketHistoryPoint[] = [];
  let currentVal = basePrice * (1 - volatility * 3);
  
  for (let i = 24; i >= 1; i--) {
    const change = currentVal * (Math.random() * volatility * 2 - volatility);
    currentVal += change;
    if (currentVal < 0.01) currentVal = 0.01; // Prevent negative or zero prices
    data.push({
      day: `${i}h`,
      value: Number(currentVal.toFixed(2))
    });
  }
  
  data.push({
    day: 'Ahora',
    value: Number(basePrice.toFixed(2))
  });
  
  return data;
};

export const MarketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [marketData, setMarketData] = useState<MarketState>(() => {
    const initialAssets: Record<string, Asset> = {};
    const initialHistory: Record<string, MarketHistoryPoint[]> = {};
    
    MARKETS.forEach(asset => {
      initialAssets[asset.id] = { ...asset };
      const volatility = asset.category === 'CRYPTO' ? 0.05 : 0.015;
      initialHistory[asset.id] = generateInitialHistory(asset.currentPrice, volatility);
    });
    
    return { assets: initialAssets, history: initialHistory };
  });

  // Centralized price simulation engine
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => {
        const newAssets = { ...prev.assets };
        const newHistory = { ...prev.history };
        
        Object.keys(newAssets).forEach(id => {
          const asset = newAssets[id];
          const volatility = asset.category === 'CRYPTO' ? 0.03 : 0.01;
          
          // Calculate realistic random walk
          const changePercent = (Math.random() * volatility * 2) - volatility;
          let newPrice = asset.currentPrice * (1 + changePercent);
          
          // Floor price to avoid negatives or zero
          if (newPrice < 0.01) newPrice = 0.01;
          
          // Update 24h change logic
          const historyPoints = newHistory[id];
          const price24hAgo = historyPoints[0].value;
          const newChange24h = ((newPrice - price24hAgo) / price24hAgo) * 100;
          
          newAssets[id] = {
            ...asset,
            currentPrice: Number(newPrice.toFixed(2)),
            change24h: Number(newChange24h.toFixed(2))
          };
          
          // Update history (shift and push)
          const updatedPoints = [...historyPoints.slice(1)];
          updatedPoints[updatedPoints.length - 1].day = '1h';
          updatedPoints.push({
            day: 'Ahora',
            value: Number(newPrice.toFixed(2))
          });
          
          newHistory[id] = updatedPoints;
        });
        
        return { assets: newAssets, history: newHistory };
      });
    }, 15000); // Update every 15 seconds centrally
    
    return () => clearInterval(interval);
  }, []);

  return (
    <MarketContext.Provider value={{ marketData }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarketData = () => {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarketData must be used within MarketProvider");
  return ctx;
};
