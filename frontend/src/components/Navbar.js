import { Link, useNavigate, useLocation } from 'react-router-dom';
import { NavLogo } from './LogoLink';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  {
    label: 'Agenda', to: '/agenda',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    label: 'Panel', to: '/panel',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
  {
    label: 'Historial', to: '/historial',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <polyline points="12 7 12 12 15 15"/>
      </svg>
    ),
  },
];

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
      {/* ══════════════════════════════════════════
          DESKTOP — Sidebar izquierdo fijo
      ══════════════════════════════════════════ */}
      <aside className="hidden md:flex" style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 220, zIndex: 100,
        flexDirection: 'column',
        background: 'rgba(12,12,12,0.98)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border)',
      }}>
        {/* Logo */}
        <div style={{
          height: 64, padding: '0 20px',
          display: 'flex', alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <NavLogo />
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {NAV_LINKS.map(l => {
            const active = pathname === l.to;
            return (
              <Link key={l.to} to={l.to} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10,
                textDecoration: 'none',
                fontSize: 14, fontWeight: active ? 700 : 500,
                color: active ? '#C9A84C' : 'var(--text-muted)',
                background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
                border: `1px solid ${active ? 'rgba(201,168,76,0.2)' : 'transparent'}`,
                transition: 'all 0.18s',
              }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#F5F5F5'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
              >
                {l.icon}
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Salir */}
        <div style={{ padding: '10px 10px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button onClick={handleSalir} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 10,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 14, fontFamily: "'DM Sans'",
            fontWeight: 500, transition: 'all 0.18s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E63946'; e.currentTarget.style.background = 'rgba(230,57,70,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Salir
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          DESKTOP — Top bar mínimo (solo actions)
      ══════════════════════════════════════════ */}
      <div className="hidden md:flex" style={{
        position: 'sticky', top: 0, zIndex: 90,
        height: actions ? 56 : 0,
        overflow: 'hidden',
        background: 'rgba(17,17,17,0.9)',
        backdropFilter: 'blur(14px)',
        borderBottom: actions ? '1px solid var(--border)' : 'none',
        alignItems: 'center', justifyContent: 'flex-end',
        padding: actions ? '0 28px' : '0',
        transition: 'height 0.2s ease',
      }}>
        {actions}
      </div>

      {/* ══════════════════════════════════════════
          MOBILE — Top navbar (logo + actions + Salir)
      ══════════════════════════════════════════ */}
      <nav className="flex md:hidden" style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 60,
        background: 'rgba(17,17,17,0.95)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border)',
        alignItems: 'center',
        padding: '0 20px', gap: 8,
      }}>
        <NavLogo />
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {actions}
          <button onClick={handleSalir} style={{
            background: 'none', border: '1px solid rgba(230,57,70,0.2)',
            color: 'var(--text-muted)', fontFamily: "'DM Sans'",
            fontSize: 12, fontWeight: 600, padding: '5px 10px',
            borderRadius: 8, cursor: 'pointer',
          }}>
            Salir
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          MOBILE — Bottom navigation
      ══════════════════════════════════════════ */}
      <nav className="flex md:hidden" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        height: 64,
        background: 'rgba(17,17,17,0.97)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border)',
      }}>
        {NAV_LINKS.map(l => {
          const active = pathname === l.to;
          return (
            <Link key={l.to} to={l.to} style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 3, textDecoration: 'none',
              color: active ? '#C9A84C' : 'var(--text-muted)',
              transition: 'color 0.2s',
              position: 'relative',
            }}>
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
