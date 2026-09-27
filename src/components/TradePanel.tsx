import React, { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { MARKETS, getAsset } from '../utils/marketData';
import { formatCurrency } from '../utils/constants';

export const TradePanel: React.FC = () => {
  const { currentUser, state, buyAsset, sellAsset } = useFinancial();
  const [selectedAsset, setSelectedAsset] = useState(MARKETS[0].id);
  const [quantity, setQuantity] = useState(1);
  const [isBuying, setIsBuying] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
              setSelectedAsset(e.target.value);
              setErrorMsg(null);
            }}
          >
            {MARKETS.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.symbol}) - {formatCurrency(a.currentPrice)}</option>
            ))}
          </select>
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
