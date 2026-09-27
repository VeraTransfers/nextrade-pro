import React from 'react';
import { useFinancial } from '../context/FinancialContext';
import { formatCurrency } from '../utils/constants';

export const HistoryPanel: React.FC = () => {
  const { currentUser, state } = useFinancial();
  if (!currentUser) return null;

  const history = state.transactions
    .filter(tx => tx.userId === currentUser.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="card glass-panel">
      <h2>Historial de Transacciones</h2>
      {history.length === 0 ? (
        <p className="text-muted">No hay transacciones registradas.</p>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Saldo Anterior</th>
                <th>Nuevo Saldo</th>
              </tr>
            </thead>
            <tbody>
              {history.map(tx => (
                <tr key={tx.id}>
                  <td data-label="Fecha">{new Date(tx.date).toLocaleString()}</td>
                  <td data-label="Tipo"><span className={`badge badge-${tx.type.toLowerCase()}`}>{tx.type}</span></td>
                  <td data-label="Concepto">{tx.concept}</td>
                  <td data-label="Monto" className={tx.type === 'DEPOSIT' || tx.type === 'SELL' || tx.type === 'PROFIT' ? 'text-green' : 'text-danger'}>
                    {formatCurrency(tx.amount)}
                  </td>
                  <td data-label="Saldo Anterior">{formatCurrency(tx.previousBalance)}</td>
                  <td data-label="Nuevo Saldo">{formatCurrency(tx.newBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
