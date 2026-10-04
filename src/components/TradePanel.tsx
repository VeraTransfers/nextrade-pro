import React, { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { useMarketData } from '../context/MarketContext';
import { formatCurrency } from '../utils/constants';
import { Chart } from './Chart';

interface TradePanelProps {
  selectedAssetId?: string;
  onAssetSelect?: (id: string) => void;
}

export const TradePanel: React.FC<TradePanelProps> = ({ selectedAssetId, onAssetSelect }) => {
  const { currentUser, state, buyAsset, sellAsset } = useFinancial();
  const { marketData } = useMarketData();
  const availableAssets = Object.values(marketData.assets);
  
  const [localSelectedAsset, setLocalSelectedAsset] = useState(availableAssets[0]?.id || 'AAPL');
  const selectedAsset = selectedAssetId || localSelectedAsset;
  
  // quantity string to avoid weird 0 behavior when backspacing
  const [quantityStr, setQuantityStr] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Confirmation state
  const [confirmTrade, setConfirmTrade] = useState<{type: 'BUY' | 'SELL', qty: number, price: number, total: number} | null>(null);

  if (!currentUser) return null;
  
  const account = state.accounts[currentUser.id];
  const portfolio = state.portfolios[currentUser.id] || [];
  const pos = portfolio.find(p => p.assetId === selectedAsset);
  const asset = marketData.assets[selectedAsset];
  const chartData = marketData.history[selectedAsset] || [];

  if (!asset || !account) return null;

  const quantity = parseFloat(quantityStr);
  const isValidQuantity = !isNaN(quantity) && quantity > 0 && isFinite(quantity);
  const cost = isValidQuantity ? quantity * asset.currentPrice : 0;

  const handlePreSubmit = (type: 'BUY' | 'SELL') => {
    setErrorMsg(null);
    if (!isValidQuantity) {
      setErrorMsg('Por favor, ingresa una cantidad válida mayor a 0.');
      return;
    }
    
    if (type === 'BUY') {
      if (cost > account.balance) {
        setErrorMsg('Saldo insuficiente para realizar esta compra.');
        return;
      }
    } else {
      if (!pos || pos.quantity < quantity) {
        setErrorMsg('No tienes suficientes unidades para realizar esta venta.');
        return;
      }
    }

    setConfirmTrade({
      type,
      qty: quantity,
      price: asset.currentPrice,
      total: cost
    });
  };

  const executeTrade = async () => {
    if (!confirmTrade) return;
    setIsProcessing(true);
    setErrorMsg(null);
    
    try {
      if (confirmTrade.type === 'BUY') {
        await buyAsset(currentUser.id, selectedAsset, confirmTrade.qty, confirmTrade.price);
      } else {
        await sellAsset(currentUser.id, selectedAsset, confirmTrade.qty, confirmTrade.price);
      }
      // Reset form
      setQuantityStr('1');
      setConfirmTrade(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error al procesar la operación.');
    } finally {
      setIsProcessing(false);
      setConfirmTrade(null);
    }
  };

  return (
    <div className="card glass-panel" style={{ position: 'relative' }}>
      {confirmTrade && (
        <div className="modal-overlay" style={{ position: 'absolute', borderRadius: '8px' }}>
          <div className="modal-content" style={{ maxWidth: '400px', width: '90%', padding: '1.5rem', margin: 'auto' }}>
            <h3 style={{ marginTop: 0, color: 'var(--cyan)' }}>Confirmar Operación</h3>
            <p style={{ margin: '1rem 0' }}>Estás a punto de <strong>{confirmTrade.type === 'BUY' ? 'COMPRAR' : 'VENDER'}</strong>:</p>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Activo</span>
                <strong>{asset.name} ({asset.symbol})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cantidad</span>
                <strong>{confirmTrade.qty}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Precio</span>
                <strong>{formatCurrency(confirmTrade.price)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Estimado</span>
                <strong style={{ fontSize: '1.2rem', color: confirmTrade.type === 'BUY' ? 'var(--red)' : 'var(--green)' }}>
                  {confirmTrade.type === 'BUY' ? '-' : '+'}{formatCurrency(confirmTrade.total)}
                </strong>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }} 
                onClick={() => setConfirmTrade(null)}
                disabled={isProcessing}
              >
                Cancelar
              </button>
              <button 
                className={`btn ${confirmTrade.type === 'BUY' ? 'btn-success' : 'btn-danger'}`} 
                style={{ flex: 1 }} 
                onClick={executeTrade}
                disabled={isProcessing}
              >
                {isProcessing ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            {availableAssets.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.symbol}) - {formatCurrency(a.currentPrice)}</option>
            ))}
          </select>
        </div>
        
        <div className="chart-wrapper mt-4 mb-4" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px' }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Rendimiento - 24h</h4>
          <Chart data={chartData} />
        </div>
        
        <div className="trade-info mt-4">
          <p>Precio Actual: <strong style={{ fontSize: '1.2rem' }}>{formatCurrency(asset.currentPrice)}</strong></p>
          <p>Variación 24h: <strong className={asset.change24h >= 0 ? 'text-green' : 'text-danger'}>{asset.change24h >= 0 ? '↑' : '↓'} {asset.change24h}%</strong></p>
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <p>Saldo Disponible: <strong style={{ color: 'var(--cyan)' }}>{formatCurrency(account.balance)}</strong></p>
            <p>Unidades en Cartera: <strong>{pos ? pos.quantity : 0}</strong></p>
          </div>
        </div>

        <div className="trade-actions mt-4">
          <div className="form-group">
            <label>Cantidad a operar:</label>
            <input 
              type="number" 
              className="form-control" 
              value={quantityStr} 
              onChange={e => setQuantityStr(e.target.value)} 
              min="0.01" step="0.01"
              placeholder="0.00"
            />
          </div>
          <p className="mt-4" style={{ fontSize: '1.1rem' }}>Valor Estimado: <strong>{formatCurrency(cost)}</strong></p>
          <div className="button-grid mt-4">
            <button 
              className="btn btn-success" 
              onClick={() => handlePreSubmit('BUY')}
              disabled={isProcessing || confirmTrade !== null || !isValidQuantity || cost > account.balance}
            >
              Comprar
            </button>
            <button 
              className="btn btn-danger" 
              onClick={() => handlePreSubmit('SELL')}
              disabled={isProcessing || confirmTrade !== null || !isValidQuantity || !pos || pos.quantity < quantity}
            >
              Vender
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
