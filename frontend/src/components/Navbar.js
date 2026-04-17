import { Link, useNavigate, useLocation } from 'react-router-dom';
import { NavLogo } from './LogoLink';
import { useAuth } from '../context/AuthContext';

/* ── Links fijos para todas las páginas post-login ─── */
const NAV_LINKS = [
  {
    label: 'Agenda', to: '/agenda',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    label: 'Panel', to: '/panel',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    label: 'Ingresos', to: '/ingresos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
  {
    label: 'Historial', to: '/historial',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <polyline points="12 7 12 12 15 15"/>
      </svg>
    ),
  },
];

/**
 * actions: JSX — botones extra en la navbar (ej. "+ Nueva cita")
 * El prop 'links' ya no se usa — los links son siempre los 4 estándar
 */
export default function Navbar({ actions = null }) {
  const { cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleSalir = () => {
    cerrarSesion();
    navigate('/login');
  };

  return (
    <>
      {/* ── Top navbar ─────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 60,
        background: 'rgba(17,17,17,0.95)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 8,
      }}>
        <NavLogo />

        {/* Desktop: links con estado activo */}
        <div style={{ flex: 1, alignItems: 'center', gap: 2, marginLeft: 16 }}
          className="hidden md:flex">
          {NAV_LINKS.map(l => {
            const active = pathname === l.to;
            return (
              <Link key={l.to} to={l.to} style={{
                color: active ? '#C9A84C' : 'var(--text-muted)',
                fontSize: 14, fontWeight: active ? 700 : 500,
                padding: '6px 12px', borderRadius: 8,
                textDecoration: 'none',
                transition: 'color 0.2s',
                position: 'relative',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#F5F5F5'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                {l.label}
                {active && (
                  <span style={{
                    position: 'absolute', bottom: -1, left: '50%',
                    transform: 'translateX(-50%)',
                    width: 20, height: 2, borderRadius: 2,
                    background: '#C9A84C',
                    display: 'block',
                  }} />
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop: actions + Salir */}
        <div style={{ alignItems: 'center', gap: 8 }} className="hidden md:flex">
          {actions}
          <button
            onClick={handleSalir}
            style={{
              background: 'none', border: '1px solid rgba(230,57,70,0.2)',
              color: 'var(--text-muted)', fontFamily: "'DM Sans'",
              fontSize: 13, fontWeight: 500, padding: '6px 14px',
              borderRadius: 8, cursor: 'pointer',
              transition: 'color 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E63946'; e.currentTarget.style.borderColor = '#E63946'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(230,57,70,0.2)'; }}
          >
            Salir
          </button>
        </div>

        {/* Mobile: actions directo + Salir */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}
          className="flex md:hidden">
          {actions}
          <button
            onClick={handleSalir}
            style={{
              background: 'none', color: 'var(--text-muted)',
              fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600,
              padding: '5px 10px', cursor: 'pointer', borderRadius: 8,
              border: '1px solid rgba(230,57,70,0.2)',
            }}
          >
            Salir
          </button>
        </div>
      </nav>

      {/* ── Bottom nav — solo mobile ────────────────────── */}
      <nav
        className="md:hidden"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          height: 64,
          background: 'rgba(17,17,17,0.97)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
        }}
      >
        {NAV_LINKS.map(l => {
          const active = pathname === l.to;
          return (
            <Link
              key={l.to}
              to={l.to}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3, textDecoration: 'none',
                color: active ? '#C9A84C' : 'var(--text-muted)',
                transition: 'color 0.2s',
                position: 'relative',
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute', top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 32, height: 2, borderRadius: '0 0 4px 4px',
                  background: '#C9A84C',
                }} />
              )}
              {l.icon}
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: '0.02em' }}>
                {l.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
