import React from 'react';
import { MARKETS } from '../utils/marketData';

interface LandingPageProps {
  onNavigate: (view: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="landing-container">
      <div className="landing-content">
        
        {/* HERO SECTION */}
        <div className="hero-section glass-panel">
          <h1 className="hero-title">NexTrade Pro</h1>
          <h2 className="hero-subtitle" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>Explora y gestiona tu portafolio financiero en un entorno digital.</h2>
          <div className="hero-actions" style={{ marginTop: '2rem' }}>
            <button className="btn btn-primary btn-large" onClick={() => onNavigate('register')}>
              Crear cuenta
            </button>
            <button className="btn btn-secondary btn-large" onClick={() => onNavigate('login')}>
              Iniciar sesión
            </button>
          </div>
        </div>

        {/* MARKETS SECTION */}
        <div className="markets-section">
          <h3 className="section-title">Mercados</h3>
          <div className="market-grid">
            <div className="market-card glass-panel">
              <div className="market-icon">📈</div>
              <h4>Acciones</h4>
              <div className="market-symbols" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                {MARKETS.filter(m => m.category === 'STOCKS').map((m, i, arr) => (
                  <span key={m.id} style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    {m.symbol}{i < arr.length - 1 ? ' · ' : ''}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="market-card glass-panel">
              <div className="market-icon">₿</div>
              <h4>Criptomonedas</h4>
              <div className="market-symbols" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                {MARKETS.filter(m => m.category === 'CRYPTO').map((m, i, arr) => (
                  <span key={m.id} style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    {m.symbol}{i < arr.length - 1 ? ' · ' : ''}
                  </span>
                ))}
              </div>
            </div>

            <div className="market-card glass-panel">
              <div className="market-icon">🪙</div>
              <h4>Oro</h4>
              <div className="market-symbols" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                {MARKETS.filter(m => m.category === 'GOLD').map((m, i, arr) => (
                  <span key={m.id} style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    {m.symbol}{i < arr.length - 1 ? ' · ' : ''}
                  </span>
                ))}
              </div>
            </div>

            <div className="market-card glass-panel">
              <div className="market-icon">🛢️</div>
              <h4>Petróleo</h4>
              <div className="market-symbols" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                {MARKETS.filter(m => m.category === 'OIL').map((m, i, arr) => (
                  <span key={m.id} style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    {m.symbol}{i < arr.length - 1 ? ' · ' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CAPABILITIES SECTION */}
        <div className="capabilities-section glass-panel">
          <ul className="capabilities-list">
            <li>Crear y gestionar una cuenta</li>
            <li>Consultar balance y capital</li>
            <li>Explorar mercados disponibles</li>
            <li>Abrir y cerrar posiciones</li>
            <li>Consultar ganancias y pérdidas</li>
            <li>Consultar historial de transacciones</li>
            <li>Gestionar solicitudes de retiro</li>
          </ul>
        </div>

      </div>
    </div>
  );
};
