import React from 'react';
import { useFinancial } from '../context/FinancialContext';
import { useMarketData } from '../context/MarketContext';
import { formatCurrency } from '../utils/constants';

export const PortfolioPanel: React.FC = () => {
  const { currentUser, state } = useFinancial();
  const { marketData } = useMarketData();
  
  if (!currentUser) return null;

  const portfolio = state.portfolios[currentUser.id] || [];

  return (
    <div className="card glass-panel">
      <h2>Portafolio de Inversión</h2>
      {portfolio.length === 0 ? (
        <p className="text-muted">No tienes posiciones abiertas actualmente.</p>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Activo</th>
                <th>Cantidad</th>
                <th>Precio Entrada</th>
                <th>Precio Actual</th>
                <th>Valor Actual</th>
                <th>P/L ($)</th>
                <th>P/L (%)</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map(pos => {
                const asset = marketData.assets[pos.assetId];
                if (!asset) return null;
                const currentValue = pos.quantity * asset.currentPrice;
                const pl = currentValue - pos.investedAmount;
                const plPercent = (pl / pos.investedAmount) * 100;
                
                return (
                  <tr key={pos.assetId}>
                    <td data-label="Activo">{asset.name} ({asset.symbol})</td>
                    <td data-label="Cantidad">{pos.quantity.toFixed(4)}</td>
                    <td data-label="Precio Entrada">{formatCurrency(pos.entryPrice)}</td>
                    <td data-label="Precio Actual">{formatCurrency(asset.currentPrice)}</td>
                    <td data-label="Valor Actual">{formatCurrency(currentValue)}</td>
                    <td data-label="P/L ($)" className={pl >= 0 ? 'text-green' : 'text-danger'}>{formatCurrency(pl)}</td>
                    <td data-label="P/L (%)" className={pl >= 0 ? 'text-green' : 'text-danger'}>{plPercent.toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
