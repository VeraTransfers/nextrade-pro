import React, { useState } from 'react';
import { useMarketData } from '../context/MarketContext';
import { Asset } from '../types';
import { Chart } from './Chart';
import { formatCurrency } from '../utils/constants';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { marketData } = useMarketData();

  return (
    <div className="landing-container">


      <div className="landing-content">
        
        {/* HERO SECTION */}
        <div className="hero-section glass-panel">
          <h1 className="hero-title">CapitalTrade Pro</h1>
          <h2 className="hero-subtitle" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
            Explora y gestiona tu portafolio en los mercados financieros globales.
          </h2>
          <div className="hero-actions" style={{ marginTop: '2rem' }}>
            <button className="btn btn-primary btn-large" onClick={() => onNavigate('register')}>
              Comenzar a Invertir
            </button>
            <button className="btn btn-secondary btn-large" onClick={() => onNavigate('login')}>
              Iniciar sesión
            </button>
          </div>
        </div>

        {/* MARKETS SECTION */}
        <div className="markets-section">
          <h3 className="section-title">Mercados</h3>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>Accede a cotizaciones en tiempo real y gráficos avanzados.</p>
          <div className="market-grid">
            <div className="market-card glass-panel">
              <div className="market-icon">📈</div>
              <h4>Acciones</h4>
              <div className="market-symbols" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {Object.values(marketData.assets).filter(m => m.category === 'STOCKS').map(m => (
                  <span key={m.id} className="symbol-badge">{m.symbol}</span>
                ))}
              </div>
              <button className="market-action-btn" onClick={() => onNavigate('/markets/stocks')}>Explorar Mercado</button>
            </div>
            
            <div className="market-card glass-panel">
              <div className="market-icon">₿</div>
              <h4>Criptomonedas</h4>
              <div className="market-symbols" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {Object.values(marketData.assets).filter(m => m.category === 'CRYPTO').map(m => (
                  <span key={m.id} className="symbol-badge">{m.symbol}</span>
                ))}
              </div>
              <button className="market-action-btn" onClick={() => onNavigate('/markets/crypto')}>Explorar Mercado</button>
            </div>

            <div className="market-card glass-panel">
              <div className="market-icon">🪙</div>
              <h4>Oro</h4>
              <div className="market-symbols" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {Object.values(marketData.assets).filter(m => m.category === 'GOLD').map(m => (
                  <span key={m.id} className="symbol-badge">{m.symbol}</span>
                ))}
              </div>
              <button className="market-action-btn" onClick={() => onNavigate('/markets/gold')}>Explorar Mercado</button>
            </div>

            <div className="market-card glass-panel">
              <div className="market-icon">🛢️</div>
              <h4>Petróleo</h4>
              <div className="market-symbols" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {Object.values(marketData.assets).filter(m => m.category === 'OIL').map(m => (
                  <span key={m.id} className="symbol-badge">{m.symbol}</span>
                ))}
              </div>
              <button className="market-action-btn" onClick={() => onNavigate('/markets/oil')}>Explorar Mercado</button>
            </div>

            <div className="market-card glass-panel">
              <div className="market-icon">☕</div>
              <h4>Café</h4>
              <div className="market-symbols" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {Object.values(marketData.assets).filter(m => m.category === 'COFFEE').map(m => (
                  <span key={m.id} className="symbol-badge">{m.symbol}</span>
                ))}
              </div>
              <button className="market-action-btn" onClick={() => onNavigate('/markets/coffee')}>Explorar Mercado</button>
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
