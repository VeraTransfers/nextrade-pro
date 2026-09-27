import React, { useState } from 'react';
import { DashboardSummary } from './DashboardSummary';
import { TradePanel } from './TradePanel';
import { PortfolioPanel } from './PortfolioPanel';
import { HistoryPanel } from './HistoryPanel';
import { useFinancial } from '../context/FinancialContext';
import { MARKETS } from '../utils/marketData';

export const UserDashboard: React.FC = () => {
  const { currentUser, state, requestWithdrawal } = useFinancial();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!currentUser) return null;
  const account = state.accounts[currentUser.id];

  const handleWithdraw = async () => {
    setErrorMsg(null);
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Monto inválido');
      return;
    }

    setIsWithdrawing(true);
    try {
      await requestWithdrawal(currentUser.id, amt);
      setWithdrawAmount('');
      alert('Solicitud de retiro enviada');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el retiro');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="dashboard-container">
      <DashboardSummary />
      
      <div className="dashboard-grid mt-4">
        <TradePanel />
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
                  value={withdrawAmount} 
                  onChange={e => {
                    setWithdrawAmount(e.target.value);
                    setErrorMsg(null);
                  }} 
                  placeholder="Cantidad a retirar"
                />
                <button 
                  className="btn btn-primary full-width" 
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                >
                  {isWithdrawing ? 'Procesando...' : 'Solicitar Retiro'}
                </button>
              </div>
            )}
          </div>
          
          <div className="card glass-panel mb-4">
            <h2>Mercados Disponibles</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              Instrumentos habilitados en la plataforma.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {MARKETS.map(asset => (
                <div key={asset.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                  <strong>{asset.symbol}</strong>
                  <span style={{ color: 'var(--text-muted)' }}>{asset.name}</span>
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
