import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verificarEmail } from '../services/api';

export default function VerificarEmail() {
  const [params] = useSearchParams();
  const [estado, setEstado] = useState('verificando'); // verificando | ok | error

  useEffect(() => {
    // Limpiar cualquier token temporal que haya quedado del onboarding
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    const token = params.get('token');
    if (!token) { setEstado('error'); return; }
    verificarEmail(token)
      .then(() => setEstado('ok'))
      .catch(() => setEstado('error'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0A', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        maxWidth: 420, width: '100%', background: '#111',
        border: '1px solid rgba(201,168,76,0.15)', borderRadius: 18,
        overflow: 'hidden', textAlign: 'center',
      }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #C9A84C 40%, #e8c96a 60%, transparent)' }} />
        <div style={{ padding: '40px 32px' }}>
          {estado === 'verificando' && (
            <>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8A8A8A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h2 style={{ color: '#F5F5F5', fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: '0.06em', margin: '0 0 8px' }}>
                Verificando...
              </h2>
              <p style={{ color: '#555', fontSize: 14, margin: 0 }}>Un momento por favor.</p>
            </>
          )}

          {estado === 'ok' && (
            <>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5L20 7" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ color: '#4ade80', fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: '0.06em', margin: '0 0 8px' }}>
                Email verificado
              </h2>
              <p style={{ color: '#aaa', fontSize: 14, margin: '0 0 24px' }}>
                Email verificado. Ya podés iniciar sesión y acceder a tu panel.
              </p>
              <Link
                to="/login"
                style={{
                  display: 'inline-block', background: '#C9A84C', color: '#0A0A0A',
                  padding: '12px 28px', borderRadius: 10, textDecoration: 'none',
                  fontWeight: 700, fontSize: 14,
                }}
              >
                Ir al login
              </Link>
            </>
          )}

          {estado === 'error' && (
            <>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E63946" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h2 style={{ color: '#E63946', fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: '0.06em', margin: '0 0 8px' }}>
                Link inválido
              </h2>
              <p style={{ color: '#aaa', fontSize: 14, margin: '0 0 24px' }}>
                Este link expiró o ya fue usado. Intentá ingresar para recibir un nuevo email de verificación.
              </p>
              <Link
                to="/login"
                style={{
                  display: 'inline-block', background: 'rgba(201,168,76,0.1)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  color: '#C9A84C', padding: '12px 28px', borderRadius: 10,
                  textDecoration: 'none', fontWeight: 700, fontSize: 14,
                }}
              >
                Volver al login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
