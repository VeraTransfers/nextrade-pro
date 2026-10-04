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

  // Derive Max/Min from current chart data (simplification for visualization)
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map(d => d.value)) : selectedAsset?.currentPrice || 0;
  const minPrice = chartData.length > 0 ? Math.min(...chartData.map(d => d.value)) : selectedAsset?.currentPrice || 0;

  if (!selectedAsset) {
    return (
      <div className="dashboard-container">
        <div className="card glass-panel text-center" style={{ marginTop: '5rem', padding: '3rem' }}>
          <h2 className="text-danger">Categoría no encontrada</h2>
          <button className="btn btn-secondary mt-4" onClick={() => onNavigate('landing')}>Volver a inicio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ padding: '0 1rem' }}>
      
      {/* Header & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem 0' }}>
        <button className="btn-back" onClick={() => onNavigate('landing')} style={{ marginBottom: 0, opacity: 0.7 }}>
          &larr; VOLVER
        </button>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>MERCADOS</span>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span style={{ fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '1px' }}>{getCategoryName(category)}</span>
      </div>

      <div className="dashboard-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Main Terminal Area */}
        <div className="card glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Top Info Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }}>{selectedAsset.name}</h1>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '1rem' }}>{selectedAsset.symbol}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                <span className="metric-lg" style={{ fontSize: '3.5rem', lineHeight: 1 }}>{formatCurrency(selectedAsset.currentPrice)}</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: selectedAsset.change24h >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {selectedAsset.change24h >= 0 ? '+' : ''}{selectedAsset.change24h}%
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Variación (24H)</span>
                </div>
              </div>
            </div>

            {/* Asset Selector Tabs */}
            {assetsInCategory.length > 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignSelf: 'center' }}>
                {assetsInCategory.map(asset => (
                  <button 
                    key={asset.id}
                    onClick={() => setSelectedAssetId(asset.id)}
                    style={{ 
                      background: selectedAssetId === asset.id ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${selectedAssetId === asset.id ? 'var(--cyan)' : 'rgba(255,255,255,0.1)'}`,
                      color: selectedAssetId === asset.id ? 'var(--cyan)' : 'var(--text-muted)',
                      padding: '0.5rem 1.5rem',
                      borderRadius: '4px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {asset.symbol}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chart Controls */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', padding: '0.2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              {(['1D', '1W', '1M'] as const).map(r => (
                <button 
                  key={r}
                  onClick={() => setRange(r)}
                  style={{
                    background: range === r ? 'var(--secondary)' : 'transparent',
                    color: range === r ? 'var(--text-main)' : 'var(--text-muted)',
                    border: 'none',
                    padding: '0.4rem 1rem',
                    borderRadius: '3px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Area */}
          <div style={{ height: '450px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)', padding: '1rem', marginLeft: '-1rem', marginRight: '-1rem' }}>
            <Chart data={chartData} />
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem 1.5rem', borderRadius: '6px', borderLeft: '3px solid var(--cyan)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 600 }}>Precio Actual</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{formatCurrency(selectedAsset.currentPrice)}</p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem 1.5rem', borderRadius: '6px', borderLeft: `3px solid ${selectedAsset.change24h >= 0 ? 'var(--green)' : 'var(--red)'}` }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 600 }}>Variación</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: selectedAsset.change24h >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {selectedAsset.change24h >= 0 ? '+' : ''}{selectedAsset.change24h}%
              </p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem 1.5rem', borderRadius: '6px', borderLeft: '3px solid rgba(255,255,255,0.2)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 600 }}>Máximo ({range})</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{formatCurrency(maxPrice)}</p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem 1.5rem', borderRadius: '6px', borderLeft: '3px solid rgba(255,255,255,0.2)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 600 }}>Mínimo ({range})</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{formatCurrency(minPrice)}</p>
            </div>
          </div>
        </div>

        {/* Info & CTA Split */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <div className="card glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ color: 'var(--cyan)', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Información del activo</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
              {getCategoryInfo(category)}
            </p>
          </div>

          <div className="card glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(to right, rgba(14, 165, 233, 0.05), rgba(0,0,0,0.2))' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.3rem' }}>Ejecutar Operación</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Inicia sesión o crea una cuenta para operar con {selectedAsset.symbol} en tiempo real.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => onNavigate('register')} style={{ flex: 2, minWidth: '200px' }}>
                Comenzar a Invertir
              </button>
              <button className="btn btn-secondary" onClick={() => onNavigate('login')} style={{ flex: 1, minWidth: '150px' }}>
                Iniciar sesión
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
