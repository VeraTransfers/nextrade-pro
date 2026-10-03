import React, { useMemo } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { formatCurrency } from '../utils/constants';
import { getAsset } from '../utils/marketData';
import { Chart } from './Chart';

export const DashboardSummary: React.FC = () => {
  const { currentUser, state } = useFinancial();
  if (!currentUser) return null;

  const account = state.accounts[currentUser.id];
  if (!account) return null;

  const portfolio = state.portfolios[currentUser.id] || [];
  
  // Calculate total portfolio value
  const portfolioValue = portfolio.reduce((acc, pos) => {
    const asset = getAsset(pos.assetId);
    if (!asset) return acc;
    return acc + (pos.quantity * asset.currentPrice);
  }, 0);

  const totalValue = account.balance + portfolioValue;

  const performanceData = useMemo(() => {
    const data = [];
    const targetValue = totalValue > 0 ? totalValue : 1000; 
    let currentVal = targetValue * 0.75; // Simulate 25% growth over 30 days
    const step = (targetValue - currentVal) / 30;
    
    for (let i = 30; i >= 0; i--) {
      // Add random noise but keep the trend generally upward
      const noise = (Math.random() - 0.2) * (targetValue * 0.015);
      currentVal += step + noise;
      data.push({
        day: i === 0 ? 'Hoy' : `Hace ${i}d`,
        value: Number(currentVal.toFixed(2))
      });
    }
    // Ensure the last point matches the exact current value
    data[data.length - 1].value = Number(targetValue.toFixed(2));
    return data;
  }, [totalValue]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="stat-card glass-panel" style={{ gridColumn: '1 / -1', padding: '2rem' }}>
          <h3 className="stat-label">Balance Total (Cuenta + Portafolio)</h3>
          <div className="stat-value text-cyan" style={{ fontSize: '3rem', margin: '0.5rem 0' }}>{formatCurrency(totalValue)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--green)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold' }}>↑ +24.5%</span>
            <span className="text-muted">Rendimiento mensual</span>
          </div>
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
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>Crecimiento del Portafolio (30 días)</h3>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Actualizado en tiempo real</span>
        </div>
        <div style={{ flex: 1, minHeight: '300px', width: '100%', marginLeft: '-15px' }}>
          <Chart data={performanceData} />
        </div>
      </div>

    </div>
  );
};
