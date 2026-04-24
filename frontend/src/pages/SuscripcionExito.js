import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sincronizarSuscripcion, forzarSyncSuscripcion } from '../services/api';

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
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sincronizado = useRef(false);
  const [sincronizando, setSincronizando] = useState(true);

  useEffect(() => {
    if (sincronizado.current) return;
    sincronizado.current = true;
    const session_id = params.get('session_id');
    const sync = async () => {
      // Intentar sincronizar hasta 3 veces con delay (cubre cold start de Render ~30s)
      for (let i = 0; i < 3; i++) {
        try {
          if (session_id) await sincronizarSuscripcion(session_id);
          await forzarSyncSuscripcion();
          break;
        } catch {
          if (i < 2) await new Promise(r => setTimeout(r, 5000));
        }
      }
      setSincronizando(false);
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
              <p style={{ color: '#aaa', fontSize: 15 }}>Activando tu plan...</p>
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
              <p style={{ color: '#aaa', fontSize: 15, margin: '0 0 28px', lineHeight: 1.6 }}>
                Tu suscripción quedó activada. Ya podés usar todas las funciones de tu plan.
              </p>
              <button
                onClick={() => navigate('/panel')}
                className="btn-gold"
                style={{ padding: '13px 32px', fontSize: 15 }}
              >
                Ir al Panel →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
