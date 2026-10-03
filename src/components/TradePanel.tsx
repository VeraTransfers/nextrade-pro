import React, { useState, useEffect, useMemo } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { MARKETS, getAsset } from '../utils/marketData';
import { formatCurrency } from '../utils/constants';
import { Chart } from './Chart';

interface TradePanelProps {
  selectedAssetId?: string;
  onAssetSelect?: (id: string) => void;
}

export const TradePanel: React.FC<TradePanelProps> = ({ selectedAssetId, onAssetSelect }) => {
  const { currentUser, state, buyAsset, sellAsset } = useFinancial();
  const [localSelectedAsset, setLocalSelectedAsset] = useState(MARKETS[0].id);
  const selectedAsset = selectedAssetId || localSelectedAsset;
  const [quantity, setQuantity] = useState(1);
  const [isBuying, setIsBuying] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generate real-looking random data for the chart based on the asset
  const [chartData, setChartData] = useState<{day: string, value: number}[]>([]);
  
  useEffect(() => {
    const assetObj = getAsset(selectedAsset);
    if (!assetObj) return;
    
    const basePrice = assetObj.currentPrice;
    const volatility = assetObj.category === 'CRYPTO' ? 0.05 : 0.015;
    const newData = [];
    let currentVal = basePrice * (1 - volatility * 3);
    
    for (let i = 24; i >= 0; i--) {
      const change = currentVal * (Math.random() * volatility * 2 - volatility);
      currentVal += change;
      newData.push({
        day: `${i}h ago`,
        value: Number(currentVal.toFixed(2))
      });
    }
    // ensure last point is exactly current price
    newData[newData.length - 1].value = basePrice;
    newData[newData.length - 1].day = 'Now';
    
    setChartData(newData);
  }, [selectedAsset]);

  if (!currentUser) return null;
  
  const account = state.accounts[currentUser.id];
  const portfolio = state.portfolios[currentUser.id] || [];
  const pos = portfolio.find(p => p.assetId === selectedAsset);
  const asset = getAsset(selectedAsset);

  if (!asset || !account) return null;

  const cost = quantity * asset.currentPrice;

  return (
    <div className="card glass-panel">
      <h2>Mercados y Operaciones</h2>
      <div className="trade-grid">
        <div className="asset-selector">
          {errorMsg && <div className="alert alert-danger mb-4" style={{ color: 'var(--red)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--red)' }}>{errorMsg}</div>}
          <select 
            className="form-control" 
            value={selectedAsset} 
            onChange={(e) => {
              if (onAssetSelect) onAssetSelect(e.target.value);
              else setLocalSelectedAsset(e.target.value);
              setErrorMsg(null);
            }}
          >
            {MARKETS.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.symbol}) - {formatCurrency(a.currentPrice)}</option>
            ))}
          </select>
        </div>
        
        <div className="chart-wrapper mt-4 mb-4" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px' }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Gráfico en tiempo real - 24h</h4>
          <Chart data={chartData} />
        </div>
        
        <div className="trade-info mt-4">
          <p>Precio Actual: <strong>{formatCurrency(asset.currentPrice)}</strong></p>
          <p>Variación 24h: <strong className={asset.change24h >= 0 ? 'text-green' : 'text-danger'}>{asset.change24h}%</strong></p>
          <p>Posees: <strong>{pos ? pos.quantity : 0} unidades</strong></p>
          <p>Saldo Disponible: <strong>{formatCurrency(account.balance)}</strong></p>
        </div>

        <div className="trade-actions mt-4">
          <div className="form-group">
            <label>Cantidad a operar:</label>
            <input 
              type="number" 
              className="form-control" 
              value={quantity} 
              onChange={e => setQuantity(Number(e.target.value))} 
              min="0.01" step="0.01"
            />
          </div>
          <p className="mt-4">Total: <strong>{formatCurrency(cost)}</strong></p>
          <div className="button-grid mt-4">
            <button 
              className="btn btn-success" 
              onClick={async () => {
                setErrorMsg(null);
                setIsBuying(true);
                try {
                  await buyAsset(currentUser.id, selectedAsset, quantity);
                } catch (err: any) {
                  setErrorMsg(err.message || 'Error al comprar');
                } finally {
                  setIsBuying(false);
                }
              }}
              disabled={isBuying || isSelling || cost > account.balance || quantity <= 0}
            >
              {isBuying ? 'Procesando...' : 'Comprar'}
            </button>
            <button 
              className="btn btn-danger" 
              onClick={async () => {
                setErrorMsg(null);
                setIsSelling(true);
                try {
                  await sellAsset(currentUser.id, selectedAsset, quantity);
                } catch (err: any) {
                  setErrorMsg(err.message || 'Error al vender');
                } finally {
                  setIsSelling(false);
                }
              }}
              disabled={isBuying || isSelling || !pos || pos.quantity < quantity || quantity <= 0}
            >
              {isSelling ? 'Procesando...' : 'Vender'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
