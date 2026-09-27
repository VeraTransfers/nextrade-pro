import React, { useState } from 'react';
import { useFinancial } from './context/FinancialContext';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';
import { LandingPage } from './components/LandingPage';

function App() {
  const { currentUser, setCurrentUser } = useFinancial();
  const [view, setView] = useState<'landing' | 'login' | 'register'>('landing');

  if (!currentUser) {
    if (view === 'landing') {
      return (
        <div className="app-bg-wrapper">
          <LandingPage onNavigate={setView} />
        </div>
      );
    }
    
    return (
      <div className="app-bg-wrapper">
        <Login 
          initialIsRegister={view === 'register'} 
          onBack={() => setView('landing')} 
        />
      </div>
    );
  }

  return (
    <>
      <nav className="main-nav glass-panel">
        <div className="nav-brand">NexTrade Pro</div>
        <div className="nav-user">
          <span>{currentUser.name} ({currentUser.role})</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrentUser(null)} style={{marginLeft: 10, padding: '0.4rem 0.8rem'}}>Salir</button>
        </div>
      </nav>
      {currentUser.role === 'ADMIN' ? <AdminDashboard /> : <UserDashboard />}
    </>
  );
}

export default App;
