import React, { useState, useEffect } from 'react';
import { MARKETS } from '../utils/marketData';
import { Asset } from '../types';
import { Chart } from './Chart';
import { formatCurrency } from '../utils/constants';

interface LandingPageProps {
  onNavigate: (view: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [chartData, setChartData] = useState<{day: string, value: number}[]>([]);

  useEffect(() => {
    if (!previewAsset) return;
    
    const basePrice = previewAsset.currentPrice;
    const volatility = previewAsset.category === 'CRYPTO' ? 0.05 : 0.015;
    const newData = [];
    let currentVal = basePrice * (1 - volatility * 3);
    
    for (let i = 24; i >= 0; i--) {
      const change = currentVal * (Math.random() * volatility * 2 - volatility);
      currentVal += change;
      newData.push({
        day: `${i}h`,
        value: Number(currentVal.toFixed(2))
      });
    }
    newData[newData.length - 1].value = basePrice;
    newData[newData.length - 1].day = 'Ahora';
    
    setChartData(newData);
  }, [previewAsset]);

  return (
    <div className="landing-container">
      {previewAsset && (
        <div className="modal-overlay" onClick={() => setPreviewAsset(null)} style={{ zIndex: 1000 }}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: 'var(--cyan)' }}>{previewAsset.name} ({previewAsset.symbol})</h2>
              <button onClick={() => setPreviewAsset(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '2rem' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Precio en vivo</p>
                <strong style={{ fontSize: '2rem', color: 'var(--text-main)' }}>{formatCurrency(previewAsset.currentPrice)}</strong>
              </div>
              <div>
                <span style={{ padding: '0.4rem 0.8rem', background: previewAsset.change24h >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: previewAsset.change24h >= 0 ? 'var(--green)' : 'var(--red)', borderRadius: '6px', fontWeight: 'bold' }}>
                  {previewAsset.change24h >= 0 ? '↑' : '↓'} {previewAsset.change24h}% (24h)
                </span>
              </div>
            </div>

            <div style={{ height: '300px', margin: '0 -15px 2rem -15px' }}>
              <Chart data={chartData} />
            </div>

            <button className="btn btn-primary btn-large full-width" onClick={() => onNavigate('register')} style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              Regístrate para Operar {previewAsset.symbol}
            </button>
          </div>
        </div>
      )}

      <div className="landing-content">
        
        {/* HERO SECTION */}
        <div className="hero-section glass-panel">
          <h1 className="hero-title">CapitalTrade</h1>
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
              <div className="market-symbols" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {MARKETS.filter(m => m.category === 'STOCKS').map((m, i, arr) => (
                  <span key={m.id} className="symbol-badge">{m.symbol}</span>
                ))}
              </div>
              <button className="market-action-btn" onClick={() => setPreviewAsset(MARKETS.find(m => m.category === 'STOCKS') || null)}>Explorar Mercado</button>
            </div>
            
            <div className="market-card glass-panel">
              <div className="market-icon">₿</div>
              <h4>Criptomonedas</h4>
              <div className="market-symbols" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {MARKETS.filter(m => m.category === 'CRYPTO').map((m, i, arr) => (
                  <span key={m.id} className="symbol-badge">{m.symbol}</span>
                ))}
              </div>
              <button className="market-action-btn" onClick={() => setPreviewAsset(MARKETS.find(m => m.category === 'CRYPTO') || null)}>Explorar Mercado</button>
            </div>

            <div className="market-card glass-panel">
              <div className="market-icon">🪙</div>
              <h4>Oro</h4>
              <div className="market-symbols" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {MARKETS.filter(m => m.category === 'GOLD').map((m, i, arr) => (
                  <span key={m.id} className="symbol-badge">{m.symbol}</span>
                ))}
              </div>
              <button className="market-action-btn" onClick={() => setPreviewAsset(MARKETS.find(m => m.category === 'GOLD') || null)}>Explorar Mercado</button>
            </div>

            <div className="market-card glass-panel">
              <div className="market-icon">🛢️</div>
              <h4>Petróleo</h4>
              <div className="market-symbols" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {MARKETS.filter(m => m.category === 'OIL').map((m, i, arr) => (
                  <span key={m.id} className="symbol-badge">{m.symbol}</span>
                ))}
              </div>
              <button className="market-action-btn" onClick={() => setPreviewAsset(MARKETS.find(m => m.category === 'OIL') || null)}>Explorar Mercado</button>
            </div>

            <div className="market-card glass-panel">
              <div className="market-icon">☕</div>
              <h4>Café</h4>
              <div className="market-symbols" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {MARKETS.filter(m => m.category === 'COFFEE').map((m, i, arr) => (
                  <span key={m.id} className="symbol-badge">{m.symbol}</span>
                ))}
              </div>
              <button className="market-action-btn" onClick={() => setPreviewAsset(MARKETS.find(m => m.category === 'COFFEE') || null)}>Explorar Mercado</button>
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
