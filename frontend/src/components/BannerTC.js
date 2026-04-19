import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// Rutas públicas donde no se bloquea con el modal
const RUTAS_PUBLICAS = ['/login', '/terminos', '/privacidad', '/planes'];

export default function BannerTC() {
  const [visible, setVisible] = useState(false);
  const [leido, setLeido] = useState(false);
  const [aceptado, setAceptado] = useState(false);
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const yaAceptado = localStorage.getItem('tc_aceptado');
    const esPublica = RUTAS_PUBLICAS.includes(location.pathname);
    if (!yaAceptado && !esPublica) setVisible(true);
    else setVisible(false);
  }, [location.pathname]);

  // Detecta cuando el usuario llega al fondo del scroll
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setLeido(true);
  };

  const confirmar = () => {
    if (!aceptado) return;
    localStorage.setItem('tc_aceptado', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes tcFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes tcSlideUp {
          from { opacity: 0; transform: translateY(32px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes tcPulseGold {
          0%, 100% { opacity: 0.15; transform: scale(1);   }
          50%       { opacity: 0.3;  transform: scale(1.08); }
        }
        @keyframes tcPulseGold2 {
          0%, 100% { opacity: 0.1;  transform: scale(1);   }
          50%       { opacity: 0.22; transform: scale(1.06); }
        }
      `}</style>

    {/* Overlay con blur suave */}
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      fontFamily: "'DM Sans', sans-serif",
      animation: 'tcFadeIn 0.3s ease',
    }}>

      {/* Orbe dorado superior izquierda */}
      <div style={{
        position: 'fixed', top: '-10%', left: '-8%',
        width: 420, height: 420,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.22) 0%, transparent 70%)',
        animation: 'tcPulseGold 5s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Orbe dorado inferior derecha */}
      <div style={{
        position: 'fixed', bottom: '-12%', right: '-6%',
        width: 360, height: 360,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)',
        animation: 'tcPulseGold2 6s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Card del modal */}
      <div style={{
        background: 'rgba(14,14,14,0.92)',
        border: '1px solid rgba(201,168,76,0.35)',
        borderRadius: 20,
        width: '100%',
        maxWidth: 560,
        boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.08)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        overflow: 'hidden',
        animation: 'tcSlideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Header */}
        <div style={{
          padding: '24px 28px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 6px' }}>
            Antes de continuar
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F5F5F5', margin: 0 }}>
            Términos y Condiciones
          </h2>
          <p style={{ fontSize: 13, color: '#8A8A8A', margin: '6px 0 0' }}>
            Leé el contenido y aceptá para usar la plataforma.
          </p>
        </div>

        {/* Contenido scrolleable */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            padding: '20px 28px',
            overflowY: 'auto',
            flex: 1,
            fontSize: 13,
            color: '#9A9A9A',
            lineHeight: 1.7,
          }}
        >
          <p>
            <strong style={{ color: '#F5F5F5' }}>BarberSaaS</strong> es una plataforma de gestión de citas para barberías.
            Al usar este servicio aceptás cumplir con los términos completos.
          </p>

          <p style={{ marginTop: 14 }}>
            <strong style={{ color: '#F5F5F5' }}>Uso del servicio:</strong> La plataforma está destinada a propietarios de barberías y sus clientes.
            Está prohibido usarla para actividades ilegales, fraudulentas o que violen derechos de terceros.
            Nos reservamos el derecho de suspender cuentas que incumplan estas condiciones.
          </p>

          <p style={{ marginTop: 14 }}>
            <strong style={{ color: '#F5F5F5' }}>Datos personales:</strong> Recopilamos nombre, teléfono y correo para gestionar citas.
            No vendemos datos a terceros. Los datos se almacenan de forma segura y pueden ser eliminados a solicitud del usuario.
          </p>

          <p style={{ marginTop: 14 }}>
            <strong style={{ color: '#F5F5F5' }}>Pagos y suscripciones:</strong> Los cobros son gestionados por Stripe.
            Los planes se renuevan automáticamente. Podés cancelar en cualquier momento desde tu panel.
          </p>

          <p style={{ marginTop: 14 }}>
            <strong style={{ color: '#F5F5F5' }}>WhatsApp:</strong> Al agendar cita aceptás recibir notificaciones y recordatorios por WhatsApp relacionados con tu cita.
          </p>

          <p style={{ marginTop: 14 }}>
            <strong style={{ color: '#F5F5F5' }}>Responsabilidad:</strong> El servicio se provee "tal cual". No garantizamos disponibilidad ininterrumpida del 100%.
            No somos responsables por pérdidas derivadas de interrupciones del servicio.
          </p>

          <p style={{ marginTop: 14 }}>
            Para consultas o solicitudes escribí a{' '}
            <a href="mailto:saascompany.cr@gmail.com" style={{ color: '#C9A84C', textDecoration: 'none' }}>
              saascompany.cr@gmail.com
            </a>
          </p>

          <p style={{ marginTop: 14 }}>
            Podés leer los términos completos en{' '}
            <Link to="/terminos" style={{ color: '#C9A84C', textDecoration: 'none' }}>
              /terminos
            </Link>{' '}y la política de privacidad en{' '}
            <Link to="/privacidad" style={{ color: '#C9A84C', textDecoration: 'none' }}>
              /privacidad
            </Link>.
          </p>

          {/* Indicador visual si no llegó al fondo */}
          {!leido && (
            <div style={{
              marginTop: 16,
              padding: '8px 14px',
              background: 'rgba(201,168,76,0.07)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: 8,
              fontSize: 12,
              color: '#C9A84C',
              textAlign: 'center',
            }}>
              ↓ Seguí bajando para leer todo
            </div>
          )}

          <div style={{ height: 8 }} />
        </div>

        {/* Footer con checkbox y botón */}
        <div style={{
          padding: '16px 28px 24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          {/* Checkbox */}
          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            cursor: 'pointer', fontSize: 13, color: '#C8C8C8', lineHeight: 1.5,
          }}>
            <input
              type="checkbox"
              checked={aceptado}
              onChange={e => setAceptado(e.target.checked)}
              style={{ marginTop: 2, accentColor: '#C9A84C', width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
            />
            He leído y acepto los Términos y Condiciones y la Política de Privacidad de BarberSaaS.
          </label>

          {/* Botones */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => { setVisible(false); navigate('/'); }}
              style={{
                flex: 1,
                padding: '13px',
                fontSize: 14,
                fontWeight: 600,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                color: '#8A8A8A',
                cursor: 'pointer',
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#E63946'; e.target.style.color = '#E63946'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.color = '#8A8A8A'; }}
            >
              No acepto
            </button>
            <button
              onClick={confirmar}
              disabled={!aceptado}
              className="btn-gold"
              style={{
                flex: 2,
                padding: '13px',
                fontSize: 14,
                fontWeight: 700,
                opacity: aceptado ? 1 : 0.4,
                cursor: aceptado ? 'pointer' : 'not-allowed',
                transition: 'opacity 0.2s',
              }}
            >
              Acepto y continúo
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
