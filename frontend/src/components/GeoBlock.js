export default function GeoBlock() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: "'DM Sans', sans-serif",
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      background: 'rgba(10,10,10,0.75)',
    }}>

      {/* Glow dorado centrado */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(201,168,76,0.07) 0%, transparent 70%)',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>

        {/* Badge superior */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, marginBottom: 20,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E63946" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: '0.1em', color: '#E63946', margin: 0, lineHeight: 1 }}>
              Acceso restringido
            </p>
            <p style={{ fontSize: 11, color: '#555', margin: 0, letterSpacing: '0.04em' }}>BarberSaaS</p>
          </div>
        </div>

        {/* Card principal */}
        <div style={{
          background: 'rgba(17,17,17,0.85)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
        }}>
          {/* Franja roja superior */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #E63946 40%, #ff6b74 60%, transparent)' }} />

          <div style={{ padding: '32px 28px 28px' }}>

            {/* Título */}
            <h1 style={{
              fontFamily: "'Bebas Neue'", fontSize: 30, letterSpacing: '0.08em',
              color: '#fff', margin: '0 0 6px 0',
            }}>
              Región no disponible
            </h1>
            <p style={{ color: '#555', fontSize: 13, margin: '0 0 28px 0' }}>
              Tu ubicación actual no tiene acceso a este servicio
            </p>

            {/* Bloque principal de info */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '20px',
              marginBottom: 20,
            }}>
              {/* Bandera CR + texto */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                {/* Bandera Costa Rica */}
                <div style={{
                  flexShrink: 0, width: 38, height: 26,
                  borderRadius: 5, overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }}>
                  <div style={{ height: '30%', background: '#002B7F' }} />
                  <div style={{ height: '10%', background: '#fff' }} />
                  <div style={{ height: '20%', background: '#CE1126' }} />
                  <div style={{ height: '10%', background: '#fff' }} />
                  <div style={{ height: '30%', background: '#002B7F' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 2px 0' }}>
                    Solo disponible en Costa Rica
                  </p>
                  <p style={{ fontSize: 11, color: '#555', margin: 0 }}>
                    Servicio exclusivo para territorio costarricense
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 0 16px 0' }} />

              {/* Razón más probable */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FB923C" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  </svg>
                </div>
                <p style={{ fontSize: 12, color: '#666', margin: 0, lineHeight: 1.7 }}>
                  Si estás en Costa Rica y ves este mensaje,
                  <strong style={{ color: '#FB923C' }}> desactivá tu VPN</strong> y recargá la página.
                </p>
              </div>
            </div>

            {/* Footer */}
            <p style={{ textAlign: 'center', fontSize: 11, color: '#2a2a2a', margin: 0, letterSpacing: '0.04em' }}>
              BARBERSAAS · BARBERSAS.COM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
