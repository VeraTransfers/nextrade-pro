import React, { useMemo, useState, useEffect } from 'react';
import { useMarketData } from '../context/MarketContext';
import { Chart } from './Chart';
import { formatCurrency } from '../utils/constants';

interface MarketExplorerProps {
  category: string;
  onNavigate: (view: 'login' | 'register' | 'landing') => void;
}

export const MarketExplorer: React.FC<MarketExplorerProps> = ({ category, onNavigate }) => {
  const { marketData } = useMarketData();
  const [range, setRange] = useState<'1D' | '1W' | '1M'>('1D');

  const assetsInCategory = useMemo(() => {
    return Object.values(marketData.assets).filter(
      a => a.category.toLowerCase() === category.toLowerCase()
    );
  }, [marketData.assets, category]);

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(
    assetsInCategory.length > 0 ? assetsInCategory[0].id : null
  );

  useEffect(() => {
    if (assetsInCategory.length > 0 && (!selectedAssetId || !assetsInCategory.find(a => a.id === selectedAssetId))) {
      setSelectedAssetId(assetsInCategory[0].id);
    }
  }, [category, assetsInCategory, selectedAssetId]);

  const selectedAsset = selectedAssetId ? marketData.assets[selectedAssetId] : null;
  
  const rawChartData = selectedAssetId ? marketData.history[selectedAssetId] || [] : [];
  const chartData = useMemo(() => {
    if (!rawChartData.length) return [];
    if (range === '1D') return rawChartData.slice(-24); // Assuming hourly data
    if (range === '1W') return rawChartData; // Let's say we have weekly data
    return rawChartData; // Fallback
  }, [rawChartData, range]);

  const getCategoryName = (cat: string) => {
    const map: Record<string, string> = {
      'stocks': 'Acciones',
      'crypto': 'Criptomonedas',
      'gold': 'Oro',
      'oil': 'Petróleo',
      'coffee': 'Café'
    };
    return map[cat.toLowerCase()] || cat;
  };

  const getCategoryInfo = (cat: string) => {
    const map: Record<string, string> = {
      'stocks': 'Explora las principales acciones del mercado global. Invierte en las empresas tecnológicas más grandes con liquidez inmediata.',
      'crypto': 'El mercado de criptomonedas opera 24/7. Alta volatilidad y grandes oportunidades en activos digitales descentralizados.',
      'gold': 'El oro es tradicionalmente considerado un activo refugio. Monitorea su cotización frente a la incertidumbre del mercado.',
      'oil': 'El petróleo WTI es uno de los commodities más negociados. Su precio es sensible a eventos geopolíticos y macroeconómicos.',
      'coffee': 'El café es una de las materias primas agrícolas más importantes. Su precio depende de condiciones climáticas y la oferta global.'
    };
    return map[cat.toLowerCase()] || 'Información del mercado no disponible.';
  };

  if (!selectedAsset) {
    return (
      <div className="landing-container">
        <div style={{ marginTop: '5rem', textAlign: 'center' }}>
          <h2>Categoría no encontrada</h2>
          <button className="btn btn-secondary mt-4" onClick={() => onNavigate('landing')}>Volver a inicio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-container">
      <div className="landing-content" style={{ marginTop: '2rem' }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
          <button className="btn-back" onClick={() => onNavigate('landing')} style={{ marginBottom: 0 }}>
            &larr; Volver a Mercados
          </button>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <h2 style={{ margin: 0 }}>{getCategoryName(category)}</h2>
        </div>

        {/* Asset Selector Tabs */}
        {assetsInCategory.length > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {assetsInCategory.map(asset => (
              <button 
                key={asset.id}
                className={`btn ${selectedAssetId === asset.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedAssetId(asset.id)}
                style={{ whiteSpace: 'nowrap' }}
              >
                {asset.symbol}
              </button>
            ))}
          </div>
        )}

        <div className="card glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
            <div>
              <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2.5rem' }}>
                {selectedAsset.name} <span style={{ color: 'var(--cyan)' }}>— {selectedAsset.symbol}</span>
              </h1>
              <div style={{ marginTop: '1.5rem' }}>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1rem' }}>Precio actual</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <strong style={{ fontSize: '3rem', color: 'var(--text-main)' }}>{formatCurrency(selectedAsset.currentPrice)}</strong>
                  <span style={{ padding: '0.5rem 1rem', background: selectedAsset.change24h >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: selectedAsset.change24h >= 0 ? 'var(--green)' : 'var(--red)', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {selectedAsset.change24h >= 0 ? '↑' : '↓'} {selectedAsset.change24h}%
                  </span>
                </div>
              </div>
            </div>

            {/* Range Selector */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.25rem' }}>
              {(['1D', '1W', '1M'] as const).map(r => (
                <button 
                  key={r}
                  onClick={() => setRange(r)}
                  style={{
                    background: range === r ? 'var(--cyan)' : 'transparent',
                    color: range === r ? '#000' : 'var(--text-muted)',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: '400px', margin: '2rem -15px 0 -15px' }}>
            <Chart data={chartData} />
          </div>
        </div>

        {/* Information Section */}
        <div className="card glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--text-main)' }}>Información del mercado</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.6, marginTop: '1rem' }}>
            {getCategoryInfo(category)}
          </p>
        </div>

        {/* CTA Section */}
        <div className="card glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(0,0,0,0.2))' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>¿Quieres probar una operación?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '2rem' }}>
            Crea tu cuenta y explora las operaciones disponibles en CapitalTrade Pro.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-large" onClick={() => onNavigate('register')} style={{ maxWidth: '300px' }}>
              Comenzar a Invertir
            </button>
            <button className="btn btn-secondary btn-large" onClick={() => onNavigate('login')} style={{ maxWidth: '200px' }}>
              Iniciar sesión
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
