import React, { useState, useEffect } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { formatCurrency } from '../utils/constants';
import { supabase } from '../lib/supabase';

export const AdminDashboard: React.FC = () => {
  const { 
    state, 
    addCapital, 
    adjustAccount, 
    toggleWithdrawalBlock,
    updateWithdrawalStatus,
    resetState,
    currentUser
  } = useFinancial();

  const [selectedUser, setSelectedUser] = useState<string>('');
  const [capitalAmount, setCapitalAmount] = useState('');
  
  // Adjust result states
  const [adjustType, setAdjustType] = useState<'PROFIT' | 'LOSS'>('PROFIT');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustConcept, setAdjustConcept] = useState('');
  
  // Real DB state
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbAccounts, setDbAccounts] = useState<any[]>([]);
  const [dbWithdrawals, setDbWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Operation states
  const [isCrediting, setIsCrediting] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isApprovingWithdrawal, setIsApprovingWithdrawal] = useState<string | null>(null);
  const [isRejectingWithdrawal, setIsRejectingWithdrawal] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'USER');
      const { data: accounts } = await supabase.from('accounts').select('*');
      const { data: withdrawals } = await supabase.from('withdrawals').select('*');
      
      if (profiles) setDbUsers(profiles);
      if (accounts) setDbAccounts(accounts);
      if (withdrawals) setDbWithdrawals(withdrawals);
      
      if (profiles && profiles.length > 0 && !selectedUser) {
        setSelectedUser(profiles[0].id);
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchAdminData();
    }
  }, [currentUser]);

  const handleAddCapital = async (amtOverride?: number) => {
    setErrorMsg(null);
    const amt = amtOverride ?? parseFloat(capitalAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Monto inválido');
      return;
    }
    
    if (!window.confirm(`¿Estás seguro de que deseas acreditar ${formatCurrency(amt)} al usuario seleccionado?`)) return;

    setIsCrediting(true);
    try {
      await addCapital(selectedUser, amt);
      setCapitalAmount('');
      await fetchAdminData();
      alert('Capital acreditado exitosamente');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al acreditar capital');
    } finally {
      setIsCrediting(false);
    }
  };

  const handleAdjust = async () => {
    setErrorMsg(null);
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Monto de ajuste inválido');
      return;
    }
    if (!adjustConcept.trim()) {
      setErrorMsg('Debes ingresar un concepto');
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas registrar una ${adjustType === 'PROFIT' ? 'ganancia' : 'pérdida'} de ${formatCurrency(amount)} por concepto de "${adjustConcept}"?`)) return;

    setIsAdjusting(true);
    try {
      await adjustAccount(selectedUser, adjustType, amount, adjustConcept);
      setAdjustAmount('');
      setAdjustConcept('');
      await fetchAdminData();
      alert('Resultado registrado exitosamente');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar resultado');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleApprove = async (withdrawalId: string) => {
    setErrorMsg(null);
    if (!window.confirm('¿Aprobar esta solicitud de retiro? Los fondos serán descontados permanentemente del saldo.')) return;
    setIsApprovingWithdrawal(withdrawalId);
    try {
      await updateWithdrawalStatus(withdrawalId, 'APPROVED');
      await fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al aprobar');
    } finally {
      setIsApprovingWithdrawal(null);
    }
  };

  const handleReject = async (withdrawalId: string) => {
    setErrorMsg(null);
    const reason = prompt('Motivo del rechazo (Obligatorio):');
    if (!reason || reason.trim() === '') {
      return;
    }
    
    setIsRejectingWithdrawal(withdrawalId);
    try {
      await updateWithdrawalStatus(withdrawalId, 'REJECTED', reason.trim());
      await fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al rechazar');
    } finally {
      setIsRejectingWithdrawal(null);
    }
  };

  const account = dbAccounts.find(a => a.user_id === selectedUser);
  const pendingWithdrawals = dbWithdrawals.filter(w => w.status === 'PENDING' && w.user_id === selectedUser);

  return (
    <div className="dashboard-container">
      <div className="card glass-panel mb-4">
        <h2>Panel de Administración de Motor Financiero</h2>
        
        <div className="form-group mt-4" style={{maxWidth: 300}}>
          <label>Seleccionar Usuario a Administrar:</label>
          <select className="form-control" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
            {dbUsers.map(u => (
              <option key={u.id} value={u.id}>{u.full_name || u.username} ({u.email || u.username})</option>
            ))}
          </select>
        </div>
      </div>

      {account && (
        <div className="dashboard-grid">
          <div className="card glass-panel">
            <h3>Gestión de Capital</h3>
            <p>Saldo Actual: <strong>{formatCurrency(account.balance)}</strong></p>
            <div className="form-group mt-4">
              {errorMsg && <div className="alert alert-danger mb-4" style={{ color: 'var(--red)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--red)' }}>{errorMsg}</div>}
              <label>Acreditar Capital:</label>
              <input type="number" className="form-control mb-4" value={capitalAmount} onChange={e => setCapitalAmount(e.target.value)} />
              <div className="button-grid">
                <button className="btn btn-success" onClick={() => handleAddCapital(100)} disabled={isCrediting}>+$100</button>
                <button className="btn btn-success" onClick={() => handleAddCapital(500)} disabled={isCrediting}>+$500</button>
                <button className="btn btn-success" onClick={() => handleAddCapital(1000)} disabled={isCrediting}>+$1,000</button>
                <button className="btn btn-primary" onClick={() => handleAddCapital()} disabled={isCrediting || !capitalAmount || parseFloat(capitalAmount) <= 0}>
                  {isCrediting ? 'Procesando...' : 'Acreditar Custom'}
                </button>
              </div>
            </div>
          </div>

          <div className="card glass-panel">
            <h3>Registrar Resultado de Inversión</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Añade ganancias o pérdidas al historial del cliente.</p>
            <div className="form-group mt-4">
              {errorMsg && <div className="alert alert-danger mb-4" style={{ color: 'var(--red)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--red)' }}>{errorMsg}</div>}
              
              <label>Tipo de Resultado:</label>
              <select className="form-control mb-4" value={adjustType} onChange={e => setAdjustType(e.target.value as 'PROFIT' | 'LOSS')}>
                <option value="PROFIT">Ganancia (+)</option>
                <option value="LOSS">Pérdida (-)</option>
              </select>

              <label>Monto:</label>
              <input type="number" className="form-control mb-4" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="0.00" />
              
              <label>Concepto:</label>
              <input type="text" className="form-control mb-4" value={adjustConcept} onChange={e => setAdjustConcept(e.target.value)} placeholder="Ej. Rendimiento mensual" />
              
              <button 
                className={`btn full-width ${adjustType === 'PROFIT' ? 'btn-success' : 'btn-danger'}`} 
                onClick={handleAdjust}
                disabled={isAdjusting || !adjustAmount || !adjustConcept}
              >
                {isAdjusting ? 'Procesando...' : `Registrar ${adjustType === 'PROFIT' ? 'Ganancia' : 'Pérdida'}`}
              </button>
            </div>
          </div>

          <div className="card glass-panel">
            <h3>Control y Retiros</h3>
            <div className="mt-4">
              <p>Estado de Retiros: <strong>{account.blockWithdrawals ? 'BLOQUEADO' : 'PERMITIDO'}</strong></p>
              <button 
                className={`btn ${account.blockWithdrawals ? 'btn-success' : 'btn-danger'} full-width mt-4`}
                onClick={() => {
                  if (window.confirm(`¿Estás seguro de que deseas ${account.blockWithdrawals ? 'PERMITIR' : 'BLOQUEAR'} los retiros para este usuario?`)) {
                    toggleWithdrawalBlock(selectedUser, !account.blockWithdrawals);
                  }
                }}
              >
                {account.blockWithdrawals ? 'Permitir Retiros' : 'Bloquear Retiros'}
              </button>
            </div>
            
            <div className="mt-4 pt-4" style={{borderTop: '1px solid rgba(255,255,255,0.1)'}}>
              <h4>Solicitudes de Retiro Pendientes</h4>
              {pendingWithdrawals.length === 0 ? (
                <p className="text-muted">No hay retiros pendientes.</p>
              ) : (
                pendingWithdrawals.map(w => (
                  <div key={w.id} className="mt-4 p-4" style={{background: 'rgba(0,0,0,0.2)', borderRadius: 8}}>
                    <p>Monto: <strong>{formatCurrency(w.amount)}</strong></p>
                    <p>Fecha: {new Date(w.created_at).toLocaleString()}</p>
                    <div className="button-grid mt-4">
                      <button 
                        className="btn btn-success" 
                        onClick={() => handleApprove(w.id)}
                        disabled={isApprovingWithdrawal === w.id || isRejectingWithdrawal === w.id}
                      >
                        {isApprovingWithdrawal === w.id ? 'Aprobando...' : 'Aprobar'}
                      </button>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleReject(w.id)}
                        disabled={isApprovingWithdrawal === w.id || isRejectingWithdrawal === w.id}
                      >
                        {isRejectingWithdrawal === w.id ? 'Rechazando...' : 'Rechazar'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="card glass-panel border-danger">
            <h3>Peligro</h3>
            <p className="text-muted">Restablece toda la base de datos (Elimina todas las transacciones, usuarios extra y portafolios).</p>
            <button className="btn btn-danger full-width mt-4" onClick={() => {
              if (window.confirm('¿ESTÁS SEGURO? Esta acción es irreversible y eliminará todos los datos.')) {
                resetState();
              }
            }}>Factory Reset</button>
          </div>
        </div>
      )}
    </div>
  );
};
