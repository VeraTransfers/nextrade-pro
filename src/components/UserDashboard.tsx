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
  const [selectedAsset, setSelectedAsset] = useState<string>(MARKETS[0].id);

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
