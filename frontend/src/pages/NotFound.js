import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 420, textAlign: 'center', position: 'relative', zIndex: 1 }}>

        {/* Glow */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(201,168,76,0.06) 0%, transparent 70%)',
        }} />

        {/* 404 number */}
        <p style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: 'clamp(80px, 20vw, 130px)',
          color: 'rgba(201,168,76,0.15)',
          margin: 0, lineHeight: 1, letterSpacing: '0.06em',
          userSelect: 'none',
        }}>
          404
        </p>

        {/* Card */}
        <div style={{
          background: 'rgba(17,17,17,0.85)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          marginTop: -20,
        }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #C9A84C 40%, #e8c96a 60%, transparent)' }} />
          <div style={{ padding: '28px 28px 24px' }}>

            <h1 style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 28, letterSpacing: '0.08em',
              color: '#fff', margin: '0 0 8px 0',
            }}>
              Página no encontrada
            </h1>
            <p style={{ color: '#555', fontSize: 14, margin: '0 0 28px 0', lineHeight: 1.6 }}>
              La dirección que buscás no existe o fue movida.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/" style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '13px 20px',
                  background: 'linear-gradient(135deg, #C9A84C, #e8c96a)',
                  borderRadius: 12, cursor: 'pointer',
                  fontSize: 14, fontWeight: 700, color: '#0A0A0A',
                  letterSpacing: '0.04em', textAlign: 'center',
                }}>
                  Ir al inicio
                </div>
              </Link>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '13px 20px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, cursor: 'pointer',
                  fontSize: 14, color: '#8A8A8A',
                  textAlign: 'center',
                }}>
                  Iniciar sesión
                </div>
              </Link>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 11, color: '#2a2a2a', marginTop: 20, letterSpacing: '0.06em' }}>
          BARBERSAAS · BARBERSAS.COM
        </p>
      </div>
    </div>
  );
}
