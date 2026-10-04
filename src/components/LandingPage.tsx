import React, { useState } from 'react';
import { useMarketData } from '../context/MarketContext';
import { Asset } from '../types';
import { Chart } from './Chart';
import { formatCurrency } from '../utils/constants';

interface LandingPageProps {
  onNavigate: (view: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [previewAssetId, setPreviewAssetId] = useState<string | null>(null);
  const { marketData } = useMarketData();
  
  const previewAsset = previewAssetId ? marketData.assets[previewAssetId] : null;
  const chartData = previewAssetId ? marketData.history[previewAssetId] : [];

  return (
    <div className="landing-container">
      {previewAsset && (
        <div className="modal-overlay" onClick={() => setPreviewAssetId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', padding: '2rem', margin: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--cyan)' }}>{previewAsset.name} ({previewAsset.symbol})</h2>
              </div>
              <button onClick={() => setPreviewAssetId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'end', marginBottom: '2rem' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Precio en vivo</p>
                <strong style={{ fontSize: '2rem', color: 'var(--text-main)' }}>{formatCurrency(previewAsset.currentPrice)}</strong>
              </div>
              <div>
                <span style={{ padding: '0.4rem 0.8rem', background: previewAsset.change24h >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: previewAsset.change24h >= 0 ? 'var(--green)' : 'var(--red)', borderRadius: '6px', fontWeight: 'bold' }}>
                  {previewAsset.change24h >= 0 ? '↑' : '↓'} {previewAsset.change24h}% (24h)
                </span>
              </div>
            </div>

            <div style={{ height: '250px', margin: '0 -15px 2rem -15px' }}>
              <Chart data={chartData} />
            </div>

            <button className="btn btn-primary btn-large full-width" onClick={() => onNavigate('register')} style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              Abrir Cuenta de Inversión
            </button>
          </div>
        </div>
      )}

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
              <button className="market-action-btn" onClick={() => setPreviewAssetId(Object.values(marketData.assets).find(m => m.category === 'STOCKS')?.id || null)}>Explorar Mercado</button>
            </div>
            
            <div className="market-card glass-panel">
              <div className="market-icon">₿</div>
              <h4>Criptomonedas</h4>
              <div className="market-symbols" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {Object.values(marketData.assets).filter(m => m.category === 'CRYPTO').map(m => (
                  <span key={m.id} className="symbol-badge">{m.symbol}</span>
                ))}
              </div>
              <button className="market-action-btn" onClick={() => setPreviewAssetId(Object.values(marketData.assets).find(m => m.category === 'CRYPTO')?.id || null)}>Explorar Mercado</button>
            </div>

            <div className="market-card glass-panel">
              <div className="market-icon">🪙</div>
              <h4>Oro</h4>
              <div className="market-symbols" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {Object.values(marketData.assets).filter(m => m.category === 'GOLD').map(m => (
                  <span key={m.id} className="symbol-badge">{m.symbol}</span>
                ))}
              </div>
              <button className="market-action-btn" onClick={() => setPreviewAssetId(Object.values(marketData.assets).find(m => m.category === 'GOLD')?.id || null)}>Explorar Mercado</button>
            </div>

            <div className="market-card glass-panel">
              <div className="market-icon">🛢️</div>
              <h4>Petróleo</h4>
              <div className="market-symbols" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {Object.values(marketData.assets).filter(m => m.category === 'OIL').map(m => (
                  <span key={m.id} className="symbol-badge">{m.symbol}</span>
                ))}
              </div>
              <button className="market-action-btn" onClick={() => setPreviewAssetId(Object.values(marketData.assets).find(m => m.category === 'OIL')?.id || null)}>Explorar Mercado</button>
            </div>

            <div className="market-card glass-panel">
              <div className="market-icon">☕</div>
              <h4>Café</h4>
              <div className="market-symbols" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {Object.values(marketData.assets).filter(m => m.category === 'COFFEE').map(m => (
                  <span key={m.id} className="symbol-badge">{m.symbol}</span>
                ))}
              </div>
              <button className="market-action-btn" onClick={() => setPreviewAssetId(Object.values(marketData.assets).find(m => m.category === 'COFFEE')?.id || null)}>Explorar Mercado</button>
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
