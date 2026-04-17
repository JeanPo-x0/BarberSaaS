import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCouponActivo, crearCheckout } from '../services/api';
import { NavLogo } from '../components/LogoLink';

/* ── Data ───────────────────────────────────────────── */
const PLANES = [
  {
    id: 'basico', nombre: 'Basico',
    precio_mensual: 0, precio_anual: 0, ahorro: 0, equiv_mensual: 0,
    badge: '14 dias gratis',
    features: ['1 barbero', 'Agenda basica', 'Link de agendamiento', 'Recordatorios WhatsApp'],
  },
  {
    id: 'pro', nombre: 'Pro',
    precio_mensual: 29, precio_anual: 232, ahorro: 116, equiv_mensual: 19.33,
    badge: 'Mas popular', popular: true,
    features: ['Hasta 3 barberos', 'Dashboard de ingresos', 'Recordatorios WhatsApp',
      'Historial de clientes', 'Perfil con historial de cortes', 'Lista de espera inteligente'],
  },
  {
    id: 'premium', nombre: 'Premium',
    precio_mensual: 59, precio_anual: 472, ahorro: 236, equiv_mensual: 39.33,
    badge: 'Todo incluido',
    features: ['Barberos ilimitados', 'Todo lo del plan Pro', 'Metricas de retencion',
      'WhatsApp de reenganche', 'Exportar reportes PDF', 'Subdominio propio', 'Soporte prioritario'],
  },
];

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
    <path d="M2 7l3.5 3.5L12 4" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Component ───────────────────────────────────────── */
export default function Planes() {
  const [anual, setAnual] = useState(false);
  const [couponActivo, setCouponActivo] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    getCouponActivo().then(r => setCouponActivo(r.data.activo)).catch(() => {});
  }, []);

  const handleElegirPlan = async (planId) => {
    if (planId === 'basico') {
      navigate(token ? '/panel' : '/registro');
      return;
    }
    if (!token) {
      navigate('/registro', { state: { plan: planId } });
      return;
    }
    // Usuario ya logueado → ir directo al checkout de Stripe
    setLoadingPlan(planId);
    try {
      const res = await crearCheckout({ plan: planId, periodo: anual ? 'anual' : 'mensual' });
      window.location.href = res.data.checkout_url;
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al procesar. Intenta de nuevo.');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="bg-panel" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 60, background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <NavLogo />
        {token ? (
          <Link to="/panel" style={{
            fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#F5F5F5'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ← Volver al panel
          </Link>
        ) : (
          <Link to="/login" style={{
            fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none',
          }}>
            Iniciar sesion
          </Link>
        )}
      </nav>

      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '56px 24px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{
            fontFamily: "'Bebas Neue'", fontSize: 'clamp(38px, 6vw, 56px)',
            color: '#C9A84C', margin: '0 0 10px 0', letterSpacing: '0.05em',
          }}>
            Planes y Precios
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, margin: '0 0 10px 0' }}>
            Empieza gratis. Crece cuando quieras.
          </p>
          {anual && (
            <p style={{ fontSize: 13, color: '#FB923C', fontWeight: 600, margin: 0 }}>
              ⚡ Precio especial por tiempo limitado
            </p>
          )}

          {/* Toggle mensual / anual */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 28,
            flexWrap: 'wrap', justifyContent: 'center',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 100, padding: '8px 20px',
            maxWidth: '100%',
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: !anual ? '#F5F5F5' : 'var(--text-muted)', transition: 'color 0.2s' }}>
              Mensual
            </span>

            <div
              onClick={() => setAnual(!anual)}
              style={{
                width: 50, height: 27, borderRadius: 14,
                background: anual ? '#C9A84C' : 'rgba(255,255,255,0.1)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.3s',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: anual ? 26 : 3,
                width: 21, height: 21, borderRadius: '50%',
                background: '#fff', transition: 'left 0.3s',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }} />
            </div>

            <span style={{ fontSize: 14, fontWeight: 600, color: anual ? '#F5F5F5' : 'var(--text-muted)', transition: 'color 0.2s' }}>
              Anual
            </span>

            {/* Badge dinámico */}
            <span style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '0.04em',
              background: anual ? '#C9A84C' : 'rgba(201,168,76,0.15)',
              color: anual ? '#0A0A0A' : '#C9A84C',
              borderRadius: 100, padding: '3px 10px',
              transition: 'all 0.3s',
              border: anual ? 'none' : '1px solid rgba(201,168,76,0.3)',
            }}>
              2 MESES GRATIS
            </span>
          </div>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(288px, 1fr))',
          gap: 20, alignItems: 'start',
        }}>
          {PLANES.map((plan) => {
            const esGratis = plan.precio_mensual === 0;
            const cargando = loadingPlan === plan.id;

            return (
              <div key={plan.id} className="anim-item" style={{
                position: 'relative',
                background: 'var(--bg-card)',
                border: `1px solid ${plan.popular ? '#C9A84C' : 'var(--border)'}`,
                borderRadius: 18,
                padding: '28px 24px',
                boxShadow: plan.popular
                  ? '0 0 0 1px rgba(201,168,76,0.15), 0 16px 48px rgba(201,168,76,0.08)'
                  : 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Badge superior */}
                <span style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap',
                  padding: '4px 14px', borderRadius: 100,
                  background: plan.popular ? '#C9A84C' : 'var(--bg-secondary)',
                  color: plan.popular ? '#0A0A0A' : 'var(--text-muted)',
                  border: plan.popular ? 'none' : '1px solid var(--border)',
                }}>
                  {plan.badge}
                </span>

                {/* Nombre */}
                <h2 style={{
                  fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: '0.08em',
                  margin: '10px 0 18px 0',
                  color: plan.popular ? '#C9A84C' : 'var(--text-primary)',
                }}>
                  {plan.nombre}
                </h2>

                {/* Precio */}
                <div style={{ marginBottom: 22, minHeight: 70 }}>
                  {esGratis ? (
                    <>
                      <span style={{ fontFamily: "'Bebas Neue'", fontSize: 44, color: '#C9A84C', letterSpacing: '0.04em' }}>
                        Gratis
                      </span>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                        14 dias de prueba, sin tarjeta
                      </p>
                    </>
                  ) : anual ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontFamily: "'Bebas Neue'", fontSize: 44, color: '#C9A84C', letterSpacing: '0.04em' }}>
                          ${plan.precio_anual}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/año</span>
                        {/* Badge ahorro */}
                        <span style={{
                          fontSize: 10, fontWeight: 800, letterSpacing: '0.03em',
                          background: 'rgba(74,222,128,0.12)', color: '#4ade80',
                          border: '1px solid rgba(74,222,128,0.25)',
                          borderRadius: 100, padding: '2px 8px',
                        }}>
                          AHORRÁ ${plan.ahorro}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                        Equivale a <strong style={{ color: '#F5F5F5' }}>${plan.equiv_mensual}/mes</strong>
                        {' '}· antes ${plan.precio_mensual}/mes
                      </p>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontFamily: "'Bebas Neue'", fontSize: 44, color: '#C9A84C', letterSpacing: '0.04em' }}>
                          ${plan.precio_mensual}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/mes</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'rgba(251,146,60,0.8)', margin: '4px 0 0 0', fontWeight: 600 }}>
                        Cambia a anual y ahorrá ${plan.ahorro}/año
                      </p>
                    </>
                  )}
                </div>

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                      <IconCheck />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleElegirPlan(plan.id)}
                  disabled={cargando}
                  className={plan.popular ? 'btn-gold' : 'btn-outline'}
                  style={{
                    width: '100%', opacity: cargando ? 0.7 : 1,
                    cursor: cargando ? 'wait' : 'pointer',
                  }}
                >
                  {cargando ? 'Procesando...' : esGratis
                    ? (token ? 'Ir al panel' : 'Empezar gratis')
                    : (token ? `Mejorar a ${plan.nombre}` : `Elegir ${plan.nombre}`)}
                </button>
              </div>
            );
          })}
        </div>

        {/* Urgencia anual */}
        {anual && (
          <div style={{
            marginTop: 28, textAlign: 'center',
            padding: '14px 20px',
            background: 'rgba(201,168,76,0.05)',
            border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: 12,
          }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              <span style={{ color: '#C9A84C', fontWeight: 700 }}>⚡ Precio especial por tiempo limitado.</span>
              {' '}El plan anual se puede cancelar en cualquier momento desde el portal de facturacion.
            </p>
          </div>
        )}

        {/* Banner Early Access */}
        {couponActivo && (
          <div style={{
            marginTop: 32,
            background: 'rgba(201,168,76,0.06)',
            border: '1px solid rgba(201,168,76,0.25)',
            borderRadius: 16, padding: '28px 32px', textAlign: 'center',
          }}>
            <p style={{ fontWeight: 700, fontSize: 17, color: '#C9A84C', margin: '0 0 6px 0' }}>
              Oferta Early Access
            </p>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 10px 0', fontSize: 15 }}>
              Los primeros 20 clientes obtienen el plan Pro por{' '}
              <strong style={{ color: '#C9A84C' }}>$15/mes para siempre</strong>
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
              Usa el codigo{' '}
              <code style={{
                background: 'var(--bg-secondary)', color: '#F5F5F5',
                padding: '2px 8px', borderRadius: 6, fontFamily: 'monospace',
                border: '1px solid var(--border)',
              }}>EARLYACCESS</code>
              {' '}al registrarte
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
