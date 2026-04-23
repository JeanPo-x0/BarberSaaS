export default function GeoBlock() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0A0A0A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 70%)',
      }} />

      <div style={{ width: '100%', maxWidth: 420, textAlign: 'center', position: 'relative' }}>

        {/* Icono */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        </div>

        {/* Card */}
        <div style={{
          background: '#111',
          border: '1px solid rgba(201,168,76,0.15)',
          borderRadius: 18, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #C9A84C 40%, #e8c96a 60%, transparent)' }} />

          <div style={{ padding: '32px 28px 28px' }}>
            <p style={{
              fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: '0.08em',
              color: '#fff', margin: '0 0 8px 0',
            }}>
              Servicio no disponible
            </p>
            <p style={{ color: '#555', fontSize: 14, margin: '0 0 24px 0', lineHeight: 1.6 }}>
              en tu región
            </p>

            <div style={{
              background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)',
              borderRadius: 12, padding: '16px 18px', marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left' }}>
                <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.3 }}>🇨🇷</span>
                <p style={{ fontSize: 13, color: '#888', margin: 0, lineHeight: 1.7 }}>
                  <strong style={{ color: '#C9A84C', display: 'block', marginBottom: 4 }}>
                    Solo disponible en Costa Rica
                  </strong>
                  BarberSaaS opera únicamente dentro del territorio costarricense.
                  Si estás en Costa Rica y ves este mensaje, desactivá tu VPN e intentá de nuevo.
                </p>
              </div>
            </div>

            <p style={{ fontSize: 12, color: '#333', margin: 0 }}>
              BarberSaaS · barbersas.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
