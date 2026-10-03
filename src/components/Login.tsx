import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  initialIsRegister?: boolean;
  onBack?: () => void;
}

export const Login: React.FC<LoginProps> = ({ initialIsRegister = false, onBack }) => {
  const [isRegister, setIsRegister] = useState(initialIsRegister);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        const trimmedName = name.trim();
        const trimmedEmail = email.trim();
        const trimmedUsername = username.trim();

        if (!trimmedUsername || !password || !trimmedName || !trimmedEmail || !confirmPassword) {
          setError('Todos los campos son obligatorios');
          return;
        }

        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          return;
        }

        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          setError('Formato de email inválido');
          return;
        }
        
        const { error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              username: trimmedUsername,
              full_name: trimmedName
            }
          }
        });

        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel">
        
        {onBack && (
          <button 
            type="button" 
            onClick={onBack}
            className="btn-back"
          >
            ← Volver al inicio
          </button>
        )}

        <h1 className="brand-title">CapitalTrade</h1>
        
        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <>
              <div className="form-group">
                <label>Nombre completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-control"
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label>Nombre de usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-control"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control"
                disabled={isLoading}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 0,
                  display: 'flex'
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="form-group">
              <label>Confirmar contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-control"
                  disabled={isLoading}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: 0,
                    display: 'flex'
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {error && <div className="error-message text-danger" style={{marginTop: 10}}>{error}</div>}
          
          <button type="submit" className="btn btn-primary full-width mt-4" disabled={isLoading}>
            {isLoading ? 'Procesando...' : (isRegister ? 'Crear cuenta' : 'Iniciar sesión')}
          </button>
        </form>

        <div className="mt-4 text-center">
          {isRegister ? (
            <p>
              ¿Ya tienes cuenta?{' '}
              <button 
                type="button"
                onClick={() => { setIsRegister(false); setError(''); }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  padding: 0, 
                  color: '#00a8ff', 
                  textDecoration: 'underline', 
                  cursor: 'pointer',
                  font: 'inherit'
                }}
              >
                Iniciar sesión
              </button>
            </p>
          ) : (
            <p>
              ¿No tienes cuenta?{' '}
              <button 
                type="button"
                onClick={() => { setIsRegister(true); setError(''); }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  padding: 0, 
                  color: '#00a8ff', 
                  textDecoration: 'underline', 
                  cursor: 'pointer',
                  font: 'inherit'
                }}
              >
                Regístrate aquí
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
