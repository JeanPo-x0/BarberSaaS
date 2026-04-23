import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCouponActivo, crearCheckout, enviarContactoSoporte } from '../services/api';
import { NavLogo } from '../components/LogoLink';

/* ── Data ───────────────────────────────────────────── */
const PLANES = [
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

/* ── Lightning bolt SVG animado ─────────────────────── */
function LightningBolt({ size = 15, style = {} }) {
  return (
    <svg width={size} height={Math.round(size * 1.5)} viewBox="0 0 10 15" fill="none"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      className="svg-lightning">
      <path d="M6.5 1L1 8.5h4.2L3.5 14l6.5-8H5.8L7.5 1z" fill="#FB923C"/>
    </svg>
  );
}

/* ── Starburst badge — 8 puntas, todo rojo ──────────── */
const BURST_PTS = "45,0 56.5,17.3 76.8,13.2 72.7,33.5 90,45 72.7,56.5 76.8,76.8 56.5,72.7 45,90 33.5,72.7 13.2,76.8 17.3,56.5 0,45 17.3,33.5 13.2,13.2 33.5,17.3";

function PlanSticker({ planId, anual }) {
  const badge = (rotation, icon, line1, line2) => (
    <div className="sticker-pulsate" style={{
      position: 'absolute', right: -22, top: 8,
      transform: `rotate(${rotation}deg)`,
      filter: 'drop-shadow(3px 5px 14px rgba(160,0,20,0.75))',
      pointerEvents: 'none', zIndex: 10,
    }}>
      <svg width="84" height="84" viewBox="0 0 90 90">
        <defs>
          <linearGradient id="sg-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff3a4a"/>
            <stop offset="100%" stopColor="#9b1520"/>
          </linearGradient>
          <linearGradient id="sg-red-shine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.2)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </linearGradient>
        </defs>
        <polygon points={BURST_PTS} fill="url(#sg-red)"/>
        <polygon points={BURST_PTS} fill="url(#sg-red-shine)"/>
        <polygon points={BURST_PTS} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.6"
          transform="translate(45 45) scale(0.84) translate(-45 -45)"/>
        {icon}
        <text x="45" y="54" textAnchor="middle" fill="white" fontWeight="900" fontSize="11" fontFamily="DM Sans,sans-serif" letterSpacing="1.5">{line1}</text>
        <text x="45" y="67" textAnchor="middle" fill="rgba(255,255,255,0.88)" fontWeight="900" fontSize="10" fontFamily="DM Sans,sans-serif" letterSpacing="2">{line2}</text>
      </svg>
    </div>
  );

  if (planId === 'pro' && !anual) return badge(-9,
    <>
      <circle cx="45" cy="30" r="8" stroke="rgba(255,255,255,0.8)" strokeWidth="1.3" fill="none"/>
      <line x1="45" y1="30" x2="45" y2="24.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" className="sticker-clock-hand"/>
      <line x1="45" y1="30" x2="49" y2="30" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="45" cy="30" r="1.3" fill="white"/>
    </>,
    '14 DÍAS', 'GRATIS'
  );

  if (planId === 'pro' && anual) return badge(7,
    <polygon points="45,21 47.5,28.5 55,31 47.5,33.5 45,41 42.5,33.5 35,31 42.5,28.5"
      fill="white" className="sticker-sparkle"/>,
    '2 MESES', 'FREE'
  );

  if (planId === 'premium' && anual) return badge(-6,
    <>
      <path d="M45 41C40 37 36 31 39 25C40 30 43 28 43 25C46 30 49 27 47 22C52 27 55 34 51 39C50 36 47 37 45 41Z"
        fill="rgba(255,255,255,0.92)" className="sticker-flame"/>
      <path d="M45 39C43 36 41 32 43 28C44 31 46 29 46 27C48 31 49 33 47 37C46 35 45 36 45 39Z"
        fill="rgba(255,220,100,0.55)" className="sticker-flame"/>
    </>,
    'AHORRÁS', '$236'
  );

  return null;
}

/* ── Modal Enterprise ───────────────────────────────── */
function ModalEnterprise({ onClose }) {
  const [form, setForm] = useState({ nombre: '', email: '', mensaje: '' });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleEnviar = async () => {
    if (!form.nombre.trim() || !form.email.trim() || !form.mensaje.trim()) {
      setError('Completá todos los campos'); return;
    }
    if (!form.email.includes('@')) { setError('Email inválido'); return; }
    setEnviando(true); setError('');
    try {
      await enviarContactoSoporte({
        tipo: 'enterprise',
        correo: form.email,
        campos: {
          'Nombre / Empresa': form.nombre,
          'Email': form.email,
          'Mensaje': form.mensaje,
        },
      });
      setEnviado(true);
    } catch {
      setError('Error al enviar. Intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: '#1A1A1A', border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: 18, padding: '32px 28px', width: '100%', maxWidth: 440,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }} onClick={e => e.stopPropagation()}>

        {enviado ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(201,168,76,0.15)', border: '1px solid #C9A84C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L20 7" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: 26, color: '#C9A84C', margin: '0 0 8px' }}>
              Mensaje enviado
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 24px' }}>
              Te contactamos en menos de 24 horas para coordinar tu plan Enterprise.
            </p>
            <button onClick={onClose} className="btn-gold" style={{ width: '100%' }}>Cerrar</button>
          </div>
        ) : (
          <>
            <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: 26, color: '#C9A84C', margin: '0 0 6px' }}>
              Plan Enterprise
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 22px' }}>
              Para cadenas o múltiples locales. Precio personalizado según tu operación.
            </p>

            {error && (
              <div style={{
                background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.25)',
                borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#E63946', marginBottom: 14,
              }}>{error}</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                placeholder="Nombre o empresa *"
                value={form.nombre}
                onChange={e => { setForm({ ...form, nombre: e.target.value }); setError(''); }}
                className="input-dark"
              />
              <input
                type="email"
                placeholder="Email de contacto *"
                value={form.email}
                onChange={e => { setForm({ ...form, email: e.target.value }); setError(''); }}
                className="input-dark"
              />
              <textarea
                placeholder="Contanos sobre tu operación: ¿cuántos locales? ¿cuántos barberos? *"
                value={form.mensaje}
                onChange={e => { setForm({ ...form, mensaje: e.target.value }); setError(''); }}
                className="input-dark"
                rows={4}
                style={{ resize: 'none', lineHeight: 1.5 }}
              />
              <button
                onClick={handleEnviar}
                disabled={enviando}
                className="btn-gold"
                style={{ width: '100%', opacity: enviando ? 0.7 : 1 }}
              >
                {enviando ? 'Enviando...' : 'Enviar consulta'}
              </button>
              <button onClick={onClose} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans'",
              }}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Component ───────────────────────────────────────── */
export default function Planes() {
  const [anual, setAnual] = useState(false);
  const [couponActivo, setCouponActivo] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [showEnterprise, setShowEnterprise] = useState(false);
  const navigate = useNavigate();
  const { usuario } = useAuth();

  useEffect(() => {
    getCouponActivo().then(r => setCouponActivo(r.data.activo)).catch(() => {});
  }, []);

  const handleElegirPlan = async (planId) => {
    if (planId === 'enterprise') { setShowEnterprise(true); return; }
    if (!usuario) {
      navigate('/registro', { state: { plan: planId } });
      return;
    }
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

      {showEnterprise && <ModalEnterprise onClose={() => setShowEnterprise(false)} />}

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 60, background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <NavLogo />
        {usuario ? (
          <Link to="/panel" style={{
            display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none',
            fontSize: 13, fontWeight: 600, color: 'var(--text-muted)',
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 12px',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F5F5F5'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Panel
          </Link>
        ) : (
          <Link to="/login" style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textDecoration: 'none',
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 12px',
          }}>
            Iniciar sesión
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
            14 días gratis con cualquier plan. Sin cobros hasta que termine el trial.
          </p>
          {anual && (
            <p style={{ fontSize: 13, color: '#FB923C', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <LightningBolt size={13} /> Precio especial por tiempo limitado
            </p>
          )}

          {/* Toggle mensual / anual */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 28,
            flexWrap: 'wrap', justifyContent: 'center',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 100, padding: '8px 20px', maxWidth: '100%',
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: !anual ? '#F5F5F5' : 'var(--text-muted)', transition: 'color 0.2s' }}>
              Mensual
            </span>
            <div onClick={() => setAnual(!anual)} style={{
              width: 50, height: 27, borderRadius: 14,
              background: anual ? '#C9A84C' : 'rgba(255,255,255,0.1)',
              position: 'relative', cursor: 'pointer', transition: 'background 0.3s',
            }}>
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
            <span style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '0.04em',
              background: anual ? '#C9A84C' : 'rgba(201,168,76,0.15)',
              color: anual ? '#0A0A0A' : '#C9A84C',
              borderRadius: 100, padding: '3px 10px', transition: 'all 0.3s',
              border: anual ? 'none' : '1px solid rgba(201,168,76,0.3)',
            }}>
              2 MESES GRATIS
            </span>
          </div>
        </div>

        {/* Cards */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          justifyContent: 'center',
        }}
          className="planes-grid"
        >
          {/* Pro y Premium */}
          {PLANES.map((plan) => {
            const cargando = loadingPlan === plan.id;
            return (
              <div key={plan.id} className="anim-item" style={{
                position: 'relative',
                background: 'var(--bg-card)',
                border: `1px solid ${plan.popular ? '#C9A84C' : 'var(--border)'}`,
                borderRadius: 18, padding: '28px 24px',
                boxShadow: plan.popular
                  ? '0 0 0 1px rgba(201,168,76,0.15), 0 16px 48px rgba(201,168,76,0.08)'
                  : 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex', flexDirection: 'column',
                flex: '1 1 280px', minWidth: 268, maxWidth: 330,
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
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

                <PlanSticker planId={plan.id} anual={anual} />

                <h2 style={{
                  fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: '0.08em',
                  margin: '10px 0 18px 0',
                  color: plan.popular ? '#C9A84C' : 'var(--text-primary)',
                }}>
                  {plan.nombre}
                </h2>

                <div style={{ marginBottom: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <span style={{ fontFamily: "'Bebas Neue'", fontSize: 44, color: '#C9A84C', letterSpacing: '0.04em' }}>
                      ${anual ? plan.precio_anual : plan.precio_mensual}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/{anual ? 'año' : 'mes'}</span>
                  </div>
                  {anual ? (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      Equivale a <strong style={{ color: '#C9A84C' }}>${plan.equiv_mensual}/mes</strong>
                      {' '}· antes ${plan.precio_mensual}/mes
                    </p>
                  ) : plan.id === 'pro' ? (
                    <p style={{ fontSize: 11, color: 'rgba(251,146,60,0.7)', margin: '6px 0 0 0', fontWeight: 600 }}>
                      Cambiá a anual y ahorrá ${plan.ahorro}
                    </p>
                  ) : null}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                      <IconCheck />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleElegirPlan(plan.id)}
                  disabled={cargando}
                  className={plan.popular ? 'btn-gold' : 'btn-outline'}
                  style={{ width: '100%', opacity: cargando ? 0.7 : 1, cursor: cargando ? 'wait' : 'pointer' }}
                >
                  {cargando ? 'Procesando...' : token ? `Mejorar a ${plan.nombre}` : `Empezar con ${plan.nombre}`}
                </button>
              </div>
            );
          })}

          {/* Enterprise */}
          <div className="anim-item" style={{
            position: 'relative',
            background: 'var(--bg-card)',
            border: '1px solid rgba(167,139,250,0.3)',
            borderRadius: 18, padding: '28px 24px',
            transition: 'transform 0.2s',
            display: 'flex', flexDirection: 'column',
            flex: '1 1 280px', minWidth: 268, maxWidth: 330,
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <span style={{
              position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap',
              padding: '4px 14px', borderRadius: 100,
              background: 'var(--bg-secondary)', color: '#a78bfa',
              border: '1px solid rgba(167,139,250,0.3)',
            }}>
              Para cadenas
            </span>

            <h2 style={{
              fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: '0.08em',
              margin: '10px 0 18px 0', color: '#a78bfa',
            }}>
              Enterprise
            </h2>

            <div style={{ marginBottom: 22, minHeight: 70 }}>
              <span style={{ fontFamily: "'Bebas Neue'", fontSize: 36, color: '#a78bfa', letterSpacing: '0.04em' }}>
                A medida
              </span>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
                Precio personalizado según tu operación
              </p>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
              {['Locales ilimitados', 'Todo lo del plan Premium', 'Onboarding personalizado',
                'SLA y soporte dedicado', 'Integraciones a medida', 'Facturación centralizada', 'Soporte prioritario 24/7'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path d="M2 7l3.5 3.5L12 4" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleElegirPlan('enterprise')}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 10,
                background: 'transparent', border: '1px solid rgba(167,139,250,0.5)',
                color: '#a78bfa', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'DM Sans'",
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              Contactar ventas
            </button>
          </div>
        </div>

        {/* Urgencia anual */}
        {anual && (
          <div style={{
            marginTop: 28, textAlign: 'center', padding: '14px 20px',
            background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: 12,
          }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              <span style={{ color: '#C9A84C', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}><LightningBolt size={13} style={{ filter: 'hue-rotate(30deg)' }} /> Precio especial por tiempo limitado.</span>
              {' '}El plan anual se puede cancelar en cualquier momento desde el portal de facturacion.
            </p>
          </div>
        )}

        {/* Banner Early Access */}
        {couponActivo && (
          <div style={{
            marginTop: 32, background: 'rgba(201,168,76,0.06)',
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
