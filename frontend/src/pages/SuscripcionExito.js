import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { sincronizarSuscripcion } from '../services/api';

const CHECK_ANIM = `
@keyframes draw-circle {
  from { stroke-dashoffset: 220; }
  to   { stroke-dashoffset: 0; }
}
@keyframes draw-check {
  from { stroke-dashoffset: 80; }
  to   { stroke-dashoffset: 0; }
}
@keyframes fade-glow {
  0%   { opacity: 0; transform: scale(0.85); }
  60%  { opacity: 1; transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}
`;

function AnimatedCheck() {
  return (
    <>
      <style>{CHECK_ANIM}</style>
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none"
        style={{ animation: 'fade-glow 0.4s ease forwards', display: 'block', margin: '0 auto 16px' }}>
        <circle cx="40" cy="40" r="34"
          stroke="#C9A84C" strokeWidth="3" fill="none"
          strokeDasharray="220" strokeDashoffset="220"
          strokeLinecap="round"
          style={{ animation: 'draw-circle 0.6s ease 0.1s forwards' }}
        />
        <circle cx="40" cy="40" r="34"
          stroke="rgba(201,168,76,0.12)" strokeWidth="1" fill="none"
        />
        <polyline points="24,41 35,52 56,30"
          stroke="#C9A84C" strokeWidth="3.5" fill="none"
          strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="80" strokeDashoffset="80"
          style={{ animation: 'draw-check 0.4s ease 0.55s forwards' }}
        />
      </svg>
    </>
  );
}

export default function SuscripcionExito() {
  const [params] = useSearchParams();
  const sincronizado = useRef(false);
  const [sincronizando, setSincronizando] = useState(true);
  const [sincronizadoOk, setSincronizadoOk] = useState(false);

  useEffect(() => {
    if (sincronizado.current) return;
    sincronizado.current = true;
    const session_id = params.get('session_id');
    const sync = async () => {
      let activado = false;
      // Reintentar hasta 8 veces con 8s de espera — cubre cold start de Render (~60s)
      for (let i = 0; i < 8; i++) {
        try {
          if (session_id) {
            const res = await sincronizarSuscripcion(session_id);
            if (res.data?.ok && ['activa', 'trial'].includes(res.data?.estado)) {
              activado = true;
              break;
            }
          }
        } catch { /* continuar reintentando */ }
        if (i < 7) await new Promise(r => setTimeout(r, 8000));
      }
      setSincronizadoOk(activado);
      setSincronizando(false);
      // Por si quedó algún token de sesión anterior
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    };
    sync();
  }, [params]);

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0A', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        maxWidth: 420, width: '100%', background: '#111',
        border: '1px solid rgba(201,168,76,0.2)', borderRadius: 18,
        overflow: 'hidden', textAlign: 'center',
      }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #C9A84C 40%, #e8c96a 60%, transparent)' }} />
        <div style={{ padding: '40px 32px' }}>
          {sincronizando ? (
            <>
              <div style={{ width: 56, height: 56, margin: '0 auto 20px', borderRadius: '50%', border: '3px solid rgba(201,168,76,0.2)', borderTop: '3px solid #C9A84C', animation: 'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ color: '#aaa', fontSize: 15, margin: '0 0 6px' }}>Activando tu plan...</p>
              <p style={{ color: '#555', fontSize: 12, margin: 0 }}>Esto puede tardar hasta un minuto si el servidor está iniciando.</p>
            </>
          ) : (
            <>
              <AnimatedCheck />
              <h1 style={{
                fontFamily: "'Bebas Neue'", fontSize: 32, letterSpacing: '0.06em',
                color: '#C9A84C', margin: '0 0 12px',
              }}>
                Pago exitoso
              </h1>
              <p style={{ color: '#aaa', fontSize: 15, margin: '0 0 8px', lineHeight: 1.6 }}>
                Tu suscripción quedó activada.{!sincronizadoOk && ' Si el estado no se actualiza, usá el botón ↻ Ya pagué en la sección Cuenta.'}
              </p>
              <div style={{
                background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)',
                borderRadius: 12, padding: '14px 16px', margin: '0 0 24px', textAlign: 'left',
              }}>
                <p style={{ color: '#C9A84C', fontSize: 13, fontWeight: 700, margin: '0 0 6px' }}>
                  Último paso: verificá tu email
                </p>
                <p style={{ color: '#aaa', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                  Te enviamos un email de activación. Hacé clic en el enlace y después iniciá sesión para acceder a tu panel.
                </p>
              </div>
              <Link
                to="/login"
                className="btn-gold"
                style={{ display: 'inline-block', padding: '13px 32px', fontSize: 15, textDecoration: 'none' }}
              >
                Ir al login →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
