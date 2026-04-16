import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NavLogo } from './LogoLink';
import { useAuth } from '../context/AuthContext';

const NavLink = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    style={{
      color: 'var(--text-muted)', fontSize: 14, fontWeight: 500,
      padding: '8px 12px', borderRadius: 8, textDecoration: 'none',
      transition: 'color 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.color = '#F5F5F5'}
    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
  >
    {children}
  </Link>
);

/**
 * links: [{ label, to, primary? }]  — primary:true se muestra directo en mobile sin hamburguesa
 * actions: JSX additional buttons on the right (before Salir)
 */
export default function Navbar({ links = [], actions = null }) {
  const { cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSalir = () => {
    cerrarSesion();
    navigate('/login');
  };

  const primaryLinks = links.filter(l => l.primary);
  const secondaryLinks = links.filter(l => !l.primary);
  const hasHamburger = secondaryLinks.length > 0;

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 60,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 24px',
        gap: 8,
      }}>
        <NavLogo />

        {/* Desktop links */}
        <div style={{ flex: 1, alignItems: 'center', gap: 4, marginLeft: 16 }}
          className="hidden md:flex">
          {links.map(l => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
        </div>

        {/* Right actions desktop */}
        <div style={{ alignItems: 'center', gap: 8 }} className="hidden md:flex">
          {actions}
          <button
            onClick={handleSalir}
            style={{
              background: 'none', border: '1px solid rgba(230,57,70,0.2)',
              color: 'var(--text-muted)', fontFamily: "'DM Sans'",
              fontSize: 13, fontWeight: 500, padding: '6px 14px',
              borderRadius: 8, cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E63946'; e.currentTarget.style.borderColor = '#E63946'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(230,57,70,0.2)'; }}
          >
            Salir
          </button>
        </div>

        {/* Mobile: links primarios + actions siempre visibles */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}
          className="flex md:hidden">
          {primaryLinks.map(l => (
            <Link key={l.to} to={l.to} style={{
              color: 'var(--text-muted)', fontSize: 13, fontWeight: 600,
              padding: '6px 10px', borderRadius: 8, textDecoration: 'none',
              border: '1px solid var(--border)',
            }}>
              {l.label}
            </Link>
          ))}
          {actions}
          {/* Hamburger solo si hay links secundarios */}
          {hasHamburger && (
            <button
              onClick={() => setOpen(!open)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              {open ? (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M5 5l12 12M17 5L5 17" stroke="#F5F5F5" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M3 6h16M3 11h16M3 16h16" stroke="#F5F5F5" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          )}
          {/* Salir mobile siempre visible cuando no hay hamburguesa (Salir va dentro del dropdown si hay hamburguesa) */}
          {!hasHamburger && (
            <button
              onClick={handleSalir}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600,
                padding: '5px 10px', cursor: 'pointer', borderRadius: 8,
                border: '1px solid rgba(230,57,70,0.2)',
              }}
              onTouchStart={e => e.currentTarget.style.color = '#E63946'}
              onTouchEnd={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              Salir
            </button>
          )}
        </div>
      </nav>

      {/* Mobile dropdown — solo links secundarios + Salir */}
      {open && hasHamburger && (
        <div style={{
          position: 'fixed', top: 60, left: 0, right: 0, zIndex: 99,
          background: 'rgba(17,17,17,0.97)', backdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 24px 20px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {secondaryLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              style={{
                color: 'var(--text-muted)', fontSize: 15, padding: '10px 0',
                textDecoration: 'none', borderBottom: '1px solid var(--border)',
                display: 'block',
              }}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => { setOpen(false); handleSalir(); }}
            style={{
              background: 'none', border: 'none', color: '#E63946',
              fontFamily: "'DM Sans'", fontSize: 15, fontWeight: 600,
              padding: '10px 0', textAlign: 'left', cursor: 'pointer', marginTop: 4,
            }}
          >
            Salir
          </button>
        </div>
      )}
    </>
  );
}
