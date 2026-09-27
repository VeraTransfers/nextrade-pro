import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FinancialProvider } from './context/FinancialContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FinancialProvider>
      <App />
    </FinancialProvider>
  </React.StrictMode>,
)
