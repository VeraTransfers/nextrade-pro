import React, { useState, useEffect, useRef } from 'react';
import { useFinancial } from './context/FinancialContext';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';
import { LandingPage } from './components/LandingPage';

function App() {
  const { currentUser, setCurrentUser } = useFinancial();
  const [view, setView] = useState<'landing' | 'login' | 'register'>('landing');
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      if (bgRef.current) {
        // Calculate movement (opposite to mouse direction for a deeper parallax effect)
        const x = (e.clientX / window.innerWidth - 0.5) * -40; 
        const y = (e.clientY / window.innerHeight - 0.5) * -40;
        
        // Use requestAnimationFrame for smooth performance
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
          if (bgRef.current) {
            bgRef.current.style.transform = `translate(${x}px, ${y}px) scale(1.1)`;
          }
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const renderContent = () => {
    if (!currentUser) {
      if (view === 'landing') return <LandingPage onNavigate={setView} />;
      return <Login initialIsRegister={view === 'register'} onBack={() => setView('landing')} />;
    }
    
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
        <nav className="main-nav glass-panel">
          <div className="nav-brand">CapitalTrade</div>
          <div className="nav-user">
            <span>{currentUser.name} ({currentUser.role})</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentUser(null)} style={{marginLeft: 10, padding: '0.4rem 0.8rem'}}>Salir</button>
          </div>
        </nav>
        {currentUser.role === 'ADMIN' ? <AdminDashboard /> : <UserDashboard />}
      </div>
    );
  };

  return (
    <div className="app-bg-wrapper">
      <div className="interactive-bg" ref={bgRef}></div>
      <div className="app-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
