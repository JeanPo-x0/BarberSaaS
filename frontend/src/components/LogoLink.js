import { Link } from 'react-router-dom';

/* ── Inline SVG mark — urban BS badge ── */
function BSMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect width="48" height="48" rx="9" fill="#0A0A0A"/>
      <rect x="2.5" y="2.5" width="43" height="43" rx="7.5" stroke="#C9A84C" strokeWidth="2"/>
      <rect x="5.5" y="5.5" width="37" height="37" rx="5.5" stroke="#C9A84C" strokeWidth="0.7" strokeOpacity="0.35"/>
      <text
        x="24" y="33"
        fontFamily="Impact, Arial Black, sans-serif"
        fontSize="26" fontWeight="900"
        fill="#C9A84C"
        textAnchor="middle"
        letterSpacing="2"
      >BS</text>
      <rect x="12" y="37" width="24" height="2" rx="1" fill="#C9A84C" fillOpacity="0.55"/>
    </svg>
  );
}

/* ── NavLogo — compact navbar mark ── */
export function NavLogo({ to }) {
  const autenticado = !!localStorage.getItem('usuario');
  const dest = to || (autenticado ? '/agenda' : '/');
  return (
    <Link to={dest} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
      <BSMark size={42} />
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

/* ── FullLogo — hero / footer wordmark ── */
export function FullLogo({ style = {} }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, ...style }}>
      <BSMark size={52} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: 28, color: '#F5F5F5', letterSpacing: '0.12em',
        }}>BARBER</span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12, color: '#C9A84C', letterSpacing: '0.45em',
          textTransform: 'uppercase', marginTop: 3,
        }}>SaaS</span>
      </div>
    </div>
  );
}

function LogoLink({ to }) {
  return <NavLogo to={to} />;
}
export default LogoLink;
