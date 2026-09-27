import React from 'react';
import { useFinancial } from '../context/FinancialContext';
import { formatCurrency } from '../utils/constants';
import { getAsset } from '../utils/marketData';

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

  return (
    <div className="stats-row">
      <div className="stat-card glass-panel">
        <h3 className="stat-label">Valor Total (Cuenta + Portafolio)</h3>
        <div className="stat-value text-cyan">{formatCurrency(totalValue)}</div>
      </div>
      <div className="stat-card glass-panel">
        <h3 className="stat-label">Saldo Disponible (Cash)</h3>
        <div className="stat-value text-cyan">{formatCurrency(account.balance)}</div>
      </div>
      <div className="stat-card glass-panel">
        <h3 className="stat-label">Capital Aportado Total</h3>
        <div className="stat-value">{formatCurrency(account.capital)}</div>
      </div>
      <div className="stat-card glass-panel">
        <h3 className="stat-label">Ganancias Acumuladas</h3>
        <div className="stat-value text-green">{formatCurrency(account.profit)}</div>
      </div>
      <div className="stat-card glass-panel">
        <h3 className="stat-label">Pérdidas Acumuladas</h3>
        <div className="stat-value text-danger">{formatCurrency(account.loss)}</div>
      </div>
    </div>
  );
};
