import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FinancialProvider } from './context/FinancialContext.tsx';
import { MarketProvider } from './context/MarketContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MarketProvider>
      <FinancialProvider>
        <App />
      </FinancialProvider>
    </MarketProvider>
  </React.StrictMode>,
)
