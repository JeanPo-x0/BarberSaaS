import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NavLogo, FullLogo } from '../components/LogoLink';
import { getCouponActivo } from '../services/api';

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
      'Historial de clientes', 'Lista de espera inteligente'],
  },
  {
    id: 'premium', nombre: 'Premium',
    precio_mensual: 59, precio_anual: 472, ahorro: 236, equiv_mensual: 39.33,
    badge: 'Todo incluido',
    features: ['Barberos ilimitados', 'Todo lo del plan Pro', 'Metricas de retencion',
      'WhatsApp de reenganche', 'Exportar PDF', 'Subdominio propio', 'Soporte prioritario'],
  },
];

/* ── SVG icons ───────────────────────────────────────── */
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7l3.5 3.5L12 4" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconMenu = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M3 6h16M3 11h16M3 16h16" stroke="#F5F5F5" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconX = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M5 5l12 12M17 5L5 17" stroke="#F5F5F5" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

/* ── Feature cards SVG animations ───────────────────── */
function AnalyticsIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="4" y="28" width="8" height="14" rx="2" fill="#C9A84C" className="bar1" style={{transformOrigin:'bottom 42px'}}/>
      <rect x="14" y="20" width="8" height="22" rx="2" fill="#C9A84C" className="bar2" style={{transformOrigin:'bottom 42px'}}/>
      <rect x="24" y="14" width="8" height="28" rx="2" fill="#C9A84C" className="bar3" style={{transformOrigin:'bottom 42px'}}/>
      <rect x="34" y="22" width="8" height="20" rx="2" fill="#C9A84C" className="bar4" style={{transformOrigin:'bottom 42px'}}/>
    </svg>
  );
}

function RemindersIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="8" width="28" height="18" rx="4" fill="#1A1A1A" stroke="#C9A84C" strokeWidth="1.5"/>
      <rect x="10" y="13" width="16" height="2.5" rx="1.25" fill="#C9A84C" className="msg1"/>
      <rect x="10" y="19" width="10" height="2.5" rx="1.25" fill="#8A8A8A" className="msg2"/>
      <rect x="14" y="28" width="28" height="14" rx="4" fill="#1A1A1A" stroke="#C9A84C" strokeWidth="1.5"/>
      <rect x="18" y="32" width="16" height="2.5" rx="1.25" fill="#C9A84C" className="msg2"/>
      <rect x="18" y="37" width="10" height="2.5" rx="1.25" fill="#8A8A8A" className="msg1"/>
    </svg>
  );
}

function BookingIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="6" width="36" height="36" rx="8" fill="#1A1A1A" stroke="#C9A84C" strokeWidth="1.5"/>
      <circle cx="16" cy="20" r="4" fill="#C9A84C" className="dot1"/>
      <circle cx="24" cy="20" r="4" fill="#C9A84C" className="dot2"/>
      <circle cx="32" cy="20" r="4" fill="#C9A84C" className="dot3"/>
      <rect x="12" y="30" width="24" height="3" rx="1.5" fill="#8A8A8A"/>
    </svg>
  );
}

function MultiIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="16" cy="18" r="7" fill="#1A1A1A" stroke="#C9A84C" strokeWidth="1.5"/>
      <circle cx="32" cy="18" r="7" fill="#1A1A1A" stroke="#C9A84C" strokeWidth="1.5"/>
      <circle cx="24" cy="32" r="7" fill="#1A1A1A" stroke="#C9A84C" strokeWidth="1.5"/>
      <circle cx="16" cy="18" r="3" fill="#C9A84C"/>
      <circle cx="32" cy="18" r="3" fill="#C9A84C"/>
      <circle cx="24" cy="32" r="3" fill="#C9A84C"/>
    </svg>
  );
}

function WaitlistIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="16" fill="#1A1A1A" stroke="#C9A84C" strokeWidth="1.5"/>
      <path d="M24 14v10l6 4" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SubdomainIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="14" width="36" height="24" rx="6" fill="#1A1A1A" stroke="#C9A84C" strokeWidth="1.5"/>
      <circle cx="13" cy="21" r="2" fill="#C9A84C"/>
      <circle cx="20" cy="21" r="2" fill="#8A8A8A"/>
      <circle cx="27" cy="21" r="2" fill="#8A8A8A"/>
      <rect x="10" y="27" width="28" height="3" rx="1.5" fill="#8A8A8A"/>
    </svg>
  );
}

const FEATURES = [
  { Icon: AnalyticsIcon,  title: 'Dashboard de ingresos',      desc: 'Metricas claras de lo que genera tu barberia por dia, semana o mes.' },
  { Icon: RemindersIcon,  title: 'Recordatorios automaticos',  desc: 'El sistema avisa al cliente 24h y 1h antes. Menos olvidos, mas citas.' },
  { Icon: BookingIcon,    title: 'Agenda por WhatsApp',         desc: 'El cliente escribe, el bot responde y agenda solo. Sin apps adicionales.' },
  { Icon: MultiIcon,      title: 'Multi-barbero',               desc: 'Gestiona varios barberos y barberias desde un solo panel.' },
  { Icon: WaitlistIcon,   title: 'Lista de espera inteligente', desc: 'Cuando cancela alguien, el primero en espera recibe WhatsApp al instante.' },
  { Icon: SubdomainIcon,  title: 'Link personalizado',          desc: 'Tu barberia con su propio link profesional para compartir con clientes.' },
];

/* ── Floating dashboard card ────────────────────────── */
function DashboardCard() {
  return (
    <div className="anim-float" style={{
      background: '#1A1A1A',
      border: '1px solid rgba(201,168,76,0.25)',
      borderRadius: 18,
      padding: '24px',
      width: '100%',
      maxWidth: 340,
      boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.12), 0 0 48px rgba(201,168,76,0.06)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontFamily: "'DM Sans'", fontSize: 13, color: '#8A8A8A' }}>Ingresos de hoy</span>
        <span style={{
          background: 'rgba(201,168,76,0.12)', color: '#C9A84C',
          borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600,
        }}>EN VIVO</span>
      </div>
      <p style={{ fontFamily: "'Bebas Neue'", fontSize: 38, color: '#C9A84C', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>
        ₡48,500
      </p>
      <p style={{ fontFamily: "'DM Sans'", fontSize: 12, color: '#8A8A8A', margin: '0 0 20px 0' }}>
        12 citas completadas hoy
      </p>
      {/* Mini bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 44, marginBottom: 16 }}>
        {[30, 60, 45, 80, 55, 90, 70].map((h, i) => (
          <div key={i} style={{
            flex: 1,
            height: `${h}%`,
            background: i === 5 ? '#C9A84C' : 'rgba(201,168,76,0.25)',
            borderRadius: 4,
          }} className={`bar${(i % 5) + 1}`}/>
        ))}
      </div>
      {/* Upcoming */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
        <p style={{ fontFamily: "'DM Sans'", fontSize: 11, color: '#8A8A8A', marginBottom: 8 }}>PROXIMAS CITAS</p>
        {[
          { hora: '2:30 PM', nombre: 'Carlos M.', srv: 'Corte + barba' },
          { hora: '3:00 PM', nombre: 'Luis A.',   srv: 'Corte clasico' },
        ].map((c, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '7px 0',
            borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}>
            <div>
              <p style={{ fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 600, color: '#F5F5F5', margin: 0 }}>{c.nombre}</p>
              <p style={{ fontFamily: "'DM Sans'", fontSize: 11, color: '#8A8A8A', margin: 0 }}>{c.srv}</p>
            </div>
            <span style={{
              fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 700,
              color: '#C9A84C', background: 'rgba(201,168,76,0.1)',
              padding: '3px 8px', borderRadius: 6,
            }}>{c.hora}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Component ───────────────────────────────────────── */
export default function Home() {
  const [anual, setAnual] = useState(false);
  const [couponActivo, setCouponActivo] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getCouponActivo().then(r => setCouponActivo(r.data.activo)).catch(() => {});
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    if (window.location.hash === '#planes') {
      setTimeout(() => document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToPlanes = () => {
    document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div className="bg-orbs bg-grid-dots bg-noise" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Tercer orb central */}
      <div className="orb-mid" aria-hidden="true" />

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 24px',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(10,10,10,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : 'none',
        transition: 'background 0.3s, border 0.3s',
      }}>
        <NavLogo />

        {/* Desktop links */}
        <div style={{ alignItems: 'center', gap: 8 }} className="hidden md:flex">
          <button onClick={scrollToPlanes} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontFamily: "'DM Sans'", fontSize: 14, fontWeight: 500,
            cursor: 'pointer', padding: '8px 14px', borderRadius: 8,
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.target.style.color = '#F5F5F5'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
          >
            Planes
          </button>
          <Link to="/login" style={{
            color: 'var(--text-muted)', fontSize: 14, fontWeight: 500,
            padding: '8px 14px', borderRadius: 8, textDecoration: 'none',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.target.style.color = '#F5F5F5'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
          >
            Iniciar sesion
          </Link>
          <Link to="/registro" className="btn-gold" style={{ padding: '9px 20px', fontSize: 14 }}>
            Empezar gratis
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
          className="flex md:hidden"
        >
          {menuOpen ? <IconX /> : <IconMenu />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
          background: 'rgba(17,17,17,0.97)', backdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 24px 24px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <button onClick={scrollToPlanes} className="btn-outline" style={{ width: '100%' }}>Planes</button>
          <Link to="/login" className="btn-outline" style={{ width: '100%', textAlign: 'center' }} onClick={() => setMenuOpen(false)}>Iniciar sesion</Link>
          <Link to="/registro" className="btn-gold" style={{ width: '100%', textAlign: 'center' }} onClick={() => setMenuOpen(false)}>Empezar gratis</Link>
        </div>
      )}

      {/* ── Hero ── */}
      <section style={{
        maxWidth: 1200, margin: '0 auto',
        padding: 'clamp(40px, 8vw, 80px) 24px clamp(48px, 8vw, 100px)',
        display: 'flex', alignItems: 'center', gap: 60,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {/* Left */}
        <div style={{ flex: '1 1 400px', maxWidth: 560 }} className="anim-fadeup">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 100, padding: '6px 14px', marginBottom: 24,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#C9A84C', display: 'inline-block',
            }}/>
            <span style={{ fontSize: 12, color: '#C9A84C', fontWeight: 600, letterSpacing: '0.05em' }}>
              14 dias de prueba gratis
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 'clamp(40px, 10vw, 84px)',
            lineHeight: 1.0,
            margin: '0 0 24px 0',
            letterSpacing: '0.02em',
          }}>
            Tu barberia en{' '}
            <span className="text-gold-shimmer">piloto automatico</span>
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 4vw, 18px)', color: 'var(--text-muted)', lineHeight: 1.7,
            margin: '0 0 32px 0', maxWidth: 460,
          }}>
            Tus clientes agendan por WhatsApp. Sin llamadas, sin grupos, sin estar pendiente del telefono.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="pulse-ring-wrapper">
              <Link to="/registro" className="btn-gold" style={{ fontSize: 16, padding: '14px 32px' }}>
                Empezar gratis
              </Link>
            </div>
            <button onClick={scrollToPlanes} className="btn-outline" style={{ fontSize: 16, padding: '14px 32px' }}>
              Ver planes
            </button>
          </div>

          <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
            Sin tarjeta de credito &middot; Sin compromiso
          </p>
        </div>

        {/* Right — floating card */}
        <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
          <DashboardCard />
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: 'clamp(48px, 8vw, 80px) 24px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{
              fontFamily: "'Bebas Neue'", fontSize: 'clamp(36px, 5vw, 52px)',
              margin: '0 0 12px 0', letterSpacing: '0.05em',
            }}>
              Todo lo que tu barberia necesita
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, margin: 0 }}>
              Herramientas pensadas para barberos, no para programadores.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
          }}>
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className="card card-hover anim-item" style={{ padding: '28px 24px' }}>
                <div style={{ marginBottom: 18 }}>
                  <Icon />
                </div>
                <h3 style={{
                  fontFamily: "'DM Sans'", fontWeight: 700,
                  fontSize: 17, margin: '0 0 8px 0', color: 'var(--text-primary)',
                }}>
                  {title}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Planes ── */}
      <section id="planes" style={{ padding: 'clamp(48px, 8vw, 80px) 24px clamp(56px, 8vw, 100px)', scrollMarginTop: 64 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{
              fontFamily: "'Bebas Neue'", fontSize: 'clamp(36px, 5vw, 52px)',
              color: '#C9A84C', margin: '0 0 10px 0', letterSpacing: '0.05em',
            }}>
              Planes y Precios
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, margin: '0 0 32px 0' }}>
              Empieza gratis. Crece cuando quieras.
            </p>

            {/* Toggle */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              flexWrap: 'wrap', justifyContent: 'center',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 100, padding: '6px 16px',
              maxWidth: '100%',
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: !anual ? '#F5F5F5' : 'var(--text-muted)', transition: 'color 0.2s' }}>
                Mensual
              </span>
              <div
                onClick={() => setAnual(!anual)}
                style={{
                  width: 48, height: 26, borderRadius: 13,
                  background: anual ? '#C9A84C' : 'rgba(255,255,255,0.1)',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.3s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 3, left: anual ? 25 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.3s',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                }}/>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: anual ? '#F5F5F5' : 'var(--text-muted)', transition: 'color 0.2s' }}>
                Anual
              </span>
              <span style={{
                fontSize: 11, fontWeight: 800, letterSpacing: '0.03em',
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20, alignItems: 'start',
          }}>
            {PLANES.map((plan) => {
              const esGratis = plan.precio_mensual === 0;
              return (
                <div key={plan.id} style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${plan.popular ? '#C9A84C' : 'var(--border)'}`,
                  borderRadius: 16, padding: '28px 24px',
                  position: 'relative',
                  boxShadow: plan.popular ? '0 0 0 1px rgba(201,168,76,0.15), 0 12px 40px rgba(201,168,76,0.08)' : 'none',
                }}>
                  <span style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                    padding: '4px 14px', borderRadius: 100,
                    background: plan.popular ? '#C9A84C' : 'var(--bg-secondary)',
                    color: plan.popular ? '#0A0A0A' : 'var(--text-muted)',
                    border: plan.popular ? 'none' : '1px solid var(--border)',
                    whiteSpace: 'nowrap',
                  }}>
                    {plan.badge}
                  </span>

                  <h3 style={{
                    fontFamily: "'Bebas Neue'", fontSize: 26,
                    letterSpacing: '0.08em', margin: '12px 0 16px 0',
                    color: plan.popular ? '#C9A84C' : 'var(--text-primary)',
                  }}>
                    {plan.nombre}
                  </h3>

                  <div style={{ marginBottom: 24, minHeight: 68 }}>
                    {esGratis ? (
                      <>
                        <span style={{ fontFamily: "'Bebas Neue'", fontSize: 42, color: '#C9A84C', letterSpacing: '0.05em' }}>
                          Gratis
                        </span>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                          14 dias de prueba, sin tarjeta
                        </p>
                      </>
                    ) : anual ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 42, color: '#C9A84C', letterSpacing: '0.05em' }}>
                            ${plan.precio_anual}
                          </span>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/año</span>
                          <span style={{
                            fontSize: 10, fontWeight: 800,
                            background: 'rgba(74,222,128,0.12)', color: '#4ade80',
                            border: '1px solid rgba(74,222,128,0.25)',
                            borderRadius: 100, padding: '2px 7px',
                          }}>
                            AHORRÁ ${plan.ahorro}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                          Equivale a <strong style={{ color: '#F5F5F5' }}>${plan.equiv_mensual}/mes</strong>
                        </p>
                      </>
                    ) : (
                      <>
                        <span style={{ fontFamily: "'Bebas Neue'", fontSize: 42, color: '#C9A84C', letterSpacing: '0.05em' }}>
                          ${plan.precio_mensual}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/mes</span>
                        <p style={{ fontSize: 12, color: 'rgba(251,146,60,0.7)', margin: '4px 0 0 0', fontWeight: 600 }}>
                          Cambia a anual y ahorrá ${plan.ahorro}/año
                        </p>
                      </>
                    )}
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: 'var(--text-muted)' }}>
                        <span style={{ flexShrink: 0, marginTop: 1 }}><IconCheck /></span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => navigate('/planes')}
                    className={plan.popular ? 'btn-gold' : 'btn-outline'}
                    style={{ width: '100%' }}
                  >
                    {esGratis ? 'Empezar gratis' : `Elegir ${plan.nombre}`}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Early access */}
          {couponActivo && (
            <div style={{
              marginTop: 40,
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
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '2px solid #C9A84C',
        padding: '40px 24px',
        textAlign: 'center',
        background: 'var(--bg-secondary)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
      }}>
        <FullLogo />
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
          BarberSaaS 2026 &mdash; Hecho en Costa Rica
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
          © 2025 BarberSaaS &nbsp;&middot;&nbsp;{' '}
          <Link
            to="/terminos"
            style={{ color: '#C9A84C', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            Términos y Condiciones
          </Link>
          &nbsp;&middot;&nbsp;{' '}
          <Link
            to="/privacidad"
            style={{ color: '#C9A84C', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            Política de Privacidad
          </Link>
        </p>
      </footer>

    </div>
  );
}
