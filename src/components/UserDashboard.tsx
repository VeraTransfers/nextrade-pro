import React, { useState } from 'react';
import { DashboardSummary } from './DashboardSummary';
import { TradePanel } from './TradePanel';
import { PortfolioPanel } from './PortfolioPanel';
import { HistoryPanel } from './HistoryPanel';
import { useFinancial } from '../context/FinancialContext';
import { MARKETS } from '../utils/marketData';
import { formatCurrency } from '../utils/constants';

export const UserDashboard: React.FC = () => {
  const { currentUser, state, requestWithdrawal } = useFinancial();
  const [withdrawAmountStr, setWithdrawAmountStr] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string>(MARKETS[0].id);
  const [confirmWithdrawal, setConfirmWithdrawal] = useState<number | null>(null);

  if (!currentUser) return null;
  const account = state.accounts[currentUser.id];

  const withdrawAmount = parseFloat(withdrawAmountStr);
  const isValidWithdrawal = !isNaN(withdrawAmount) && withdrawAmount > 0 && isFinite(withdrawAmount);

  const handlePreSubmit = () => {
    setErrorMsg(null);
    if (!isValidWithdrawal) {
      setErrorMsg('Por favor ingresa un monto válido mayor a 0.');
      return;
    }
    if (withdrawAmount > account.balance) {
      setErrorMsg('Fondos insuficientes para realizar el retiro.');
      return;
    }
    setConfirmWithdrawal(withdrawAmount);
  };

  const executeWithdraw = async () => {
    if (!confirmWithdrawal) return;
    setErrorMsg(null);
    setIsWithdrawing(true);
    try {
      await requestWithdrawal(currentUser.id, confirmWithdrawal);
      setWithdrawAmountStr('');
      setConfirmWithdrawal(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el retiro');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ position: 'relative' }}>
      
      {confirmWithdrawal !== null && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '400px', width: '90%', padding: '1.5rem', margin: 'auto', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--cyan)' }}>Confirmar Retiro</h3>
            <p style={{ margin: '1rem 0' }}>Estás a punto de solicitar un retiro de fondos hacia tu cuenta verificada.</p>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Monto a retirar</span>
                <strong>{formatCurrency(confirmWithdrawal)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Saldo Disponible</span>
                <strong>{formatCurrency(account.balance)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Saldo Restante</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--cyan)' }}>
                  {formatCurrency(account.balance - confirmWithdrawal)}
                </strong>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }} 
                onClick={() => setConfirmWithdrawal(null)}
                disabled={isWithdrawing}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }} 
                onClick={executeWithdraw}
                disabled={isWithdrawing}
              >
                {isWithdrawing ? 'Procesando...' : 'Confirmar Retiro'}
              </button>
            </div>
          </div>
        </div>
      )}

      <DashboardSummary />
      
      <div className="dashboard-grid mt-4">
        <TradePanel selectedAssetId={selectedAsset} onAssetSelect={setSelectedAsset} />
        <div className="side-panels">
          <div className="card glass-panel mb-4">
            <h2>Retiros de Fondos Internos</h2>
            {account?.blockWithdrawals ? (
              <p className="text-danger">Tus retiros están temporalmente bloqueados por el administrador.</p>
            ) : (
              <div>
                {errorMsg && <div className="alert alert-danger mb-4" style={{ color: 'var(--red)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--red)' }}>{errorMsg}</div>}
                <input 
                  type="number" 
                  className="form-control mb-4" 
                  value={withdrawAmountStr} 
                  onChange={e => {
                    setWithdrawAmountStr(e.target.value);
                    setErrorMsg(null);
                  }} 
                  placeholder="Cantidad a retirar"
                  min="0.01" step="0.01"
                />
                <button 
                  className="btn btn-primary full-width" 
                  onClick={handlePreSubmit}
                  disabled={isWithdrawing || !isValidWithdrawal || withdrawAmount > account.balance}
                >
                  Solicitar Retiro
                </button>
              </div>
            )}
          </div>
          
          <div className="card glass-panel mb-4">
            <h2>Mercados Disponibles</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              Instrumentos habilitados en la plataforma.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {MARKETS.map(asset => (
                <div key={asset.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem', background: selectedAsset === asset.id ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255,255,255,0.03)', borderRadius: '8px', border: selectedAsset === asset.id ? '1px solid var(--cyan)' : '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 242, 254, 0.1)'; e.currentTarget.style.borderColor = 'var(--cyan)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = selectedAsset === asset.id ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = selectedAsset === asset.id ? 'var(--cyan)' : 'rgba(255,255,255,0.05)'; }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ color: 'var(--cyan)', fontSize: '1.1rem' }}>{asset.symbol}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{asset.name}</span>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => { setSelectedAsset(asset.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Operar</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <PortfolioPanel />
      </div>
      
      <div className="mt-4">
        <HistoryPanel />
      </div>
    </div>
  );
};
