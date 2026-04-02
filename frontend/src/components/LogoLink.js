import { Link } from 'react-router-dom';

/**
 * NavLogo — monograma BS_Logo + texto BARBER/SaaS. Usado en navbars.
 * FullLogo — wordmark BarberSaaS_Logo. Usado en hero y footer de la landing.
 */

export function NavLogo({ to }) {
  const autenticado = !!localStorage.getItem('token');
  const dest = to || (autenticado ? '/agenda' : '/');
  return (
    <Link to={dest} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
      <img
        src="/BS_Logo.png"
        alt="BarberSaaS"
        style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'contain', flexShrink: 0 }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: 20, color: '#F5F5F5', letterSpacing: '0.15em', display: 'block',
        }}>BARBER</span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10, color: '#C9A84C', letterSpacing: '0.4em',
          textTransform: 'uppercase', display: 'block', marginTop: 2,
        }}>SaaS</span>
      </div>
    </Link>
  );
}

export function FullLogo({ style = {} }) {
  return (
    <img
      src="/BarberSaaS_Logo.png"
      alt="BarberSaaS"
      style={{ height: 44, objectFit: 'contain', ...style }}
    />
  );
}

/* Default export mantiene compatibilidad con páginas existentes */
function LogoLink({ to }) {
  return <NavLogo to={to} />;
}
export default LogoLink;
