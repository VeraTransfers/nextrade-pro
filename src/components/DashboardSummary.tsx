import React, { useMemo } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { useMarketData } from '../context/MarketContext';
import { formatCurrency } from '../utils/constants';
import { Chart } from './Chart';

export const DashboardSummary: React.FC = () => {
  const { currentUser, state } = useFinancial();
  const { marketData } = useMarketData();
  
  if (!currentUser) return null;

  const account = state.accounts[currentUser.id];
  if (!account) return null;

  const portfolio = state.portfolios[currentUser.id] || [];
  
  // Calculate total portfolio value safely
  const portfolioValue = portfolio.reduce((acc, pos) => {
    const asset = marketData.assets[pos.assetId];
    if (!asset) return acc;
    const value = pos.quantity * asset.currentPrice;
    return isNaN(value) ? acc : acc + value;
  }, 0);

  const totalValue = account.balance + portfolioValue;

  // Calculate 24h history assuming the current portfolio was held
  const performanceData = useMemo(() => {
    if (portfolio.length === 0) return [];
    
    // Check if we have history for the first asset to determine time points
    const sampleAssetId = portfolio[0].assetId;
    const sampleHistory = marketData.history[sampleAssetId];
    if (!sampleHistory || sampleHistory.length === 0) return [];

    return sampleHistory.map((point, index) => {
      // Sum the value of all positions at this historical point
      const historicalPortfolioValue = portfolio.reduce((acc, pos) => {
        const historyList = marketData.history[pos.assetId];
        if (!historyList || !historyList[index]) return acc;
        return acc + (pos.quantity * historyList[index].value);
      }, 0);
      
      // The total balance also includes the uninvested cash
      return {
        day: point.day,
        value: Number((account.balance + historicalPortfolioValue).toFixed(2))
      };
    });
  }, [portfolio, marketData.history, account.balance]);

  // Calculate 24h P&L simulation based on the chart
  const change24h = performanceData.length > 1 
    ? performanceData[performanceData.length - 1].value - performanceData[0].value 
    : 0;
  const change24hPercent = performanceData.length > 1 && performanceData[0].value > 0
    ? (change24h / performanceData[0].value) * 100
    : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="stat-card glass-panel" style={{ gridColumn: '1 / -1', padding: '2rem' }}>
          <h3 className="stat-label">Balance Total (Cuenta + Portafolio)</h3>
          <div className="stat-value text-cyan" style={{ fontSize: '3rem', margin: '0.5rem 0' }}>{formatCurrency(totalValue)}</div>
          {portfolio.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              <span style={{ background: change24hPercent >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: change24hPercent >= 0 ? 'var(--green)' : 'var(--red)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold' }}>
                {change24hPercent >= 0 ? '↑' : '↓'} {change24hPercent > 0 ? '+' : ''}{change24hPercent.toFixed(2)}%
              </span>
              <span className="text-muted">Rendimiento 24h</span>
            </div>
          )}
        </div>
        
        <div className="stat-card glass-panel">
          <h3 className="stat-label">Poder de Compra (Cash)</h3>
          <div className="stat-value text-cyan" style={{ fontSize: '1.5rem' }}>{formatCurrency(account.balance)}</div>
        </div>
        
        <div className="stat-card glass-panel">
          <h3 className="stat-label">Capital Aportado</h3>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(account.capital)}</div>
        </div>
        
        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--green)' }}>
          <h3 className="stat-label">Ganancias Realizadas</h3>
          <div className="stat-value text-green" style={{ fontSize: '1.5rem' }}>{formatCurrency(account.profit)}</div>
        </div>
        
        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--red)' }}>
          <h3 className="stat-label">Pérdidas Realizadas</h3>
          <div className="stat-value text-danger" style={{ fontSize: '1.5rem' }}>{formatCurrency(account.loss)}</div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>Evolución (24h)</h3>
        </div>
        <div style={{ flex: 1, minHeight: '300px', width: '100%', marginLeft: '-15px' }}>
          {portfolio.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
              <p>Adquiere activos para visualizar tu rendimiento.</p>
            </div>
          ) : (
            <Chart data={performanceData} />
          )}
        </div>
      </div>

    </div>
  );
};
