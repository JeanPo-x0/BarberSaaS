import { useState } from 'react';
import { Link } from 'react-router-dom';
import { recuperarPassword } from '../services/api';

function KeyIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  );
}

function RecuperarPassword() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      await recuperarPassword({ email });
    } catch {
      // Siempre mostrar éxito para no revelar si el email existe
    } finally {
      setCargando(false);
      setEnviado(true);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(201,168,76,0.1) 0%, transparent 70%)',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <KeyIcon />
          </div>
          <div>
            <p style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.1em', color: '#C9A84C', margin: 0, lineHeight: 1 }}>
              Recuperar contraseña
            </p>
            <p style={{ fontSize: 11, color: '#555', margin: 0, letterSpacing: '0.04em' }}>BarberSaaS</p>
          </div>
        </div>

        <div style={{
          background: '#111',
          border: '1px solid rgba(201,168,76,0.15)',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.05)',
        }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #C9A84C 40%, #e8c96a 60%, transparent)' }} />

          <div style={{ padding: '28px 28px 24px' }}>
            {enviado ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: '0.08em', color: '#fff', margin: '0 0 8px 0' }}>
                  Revisá tu correo
                </h2>
                <p style={{ color: '#666', fontSize: 13, margin: '0 0 6px 0', lineHeight: 1.6 }}>
                  Si el email <span style={{ color: '#C9A84C' }}>{email}</span> está registrado, recibirás un link para restablecer tu contraseña.
                </p>
                <p style={{ color: '#444', fontSize: 12, margin: '0 0 24px 0' }}>El link expira en 15 minutos.</p>
                <Link
                  to="/login"
                  style={{ fontSize: 13, color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}
                >
                  ← Volver al login
                </Link>
              </div>
            ) : (
              <>
                <h1 style={{
                  fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: '0.08em',
                  color: '#fff', margin: '0 0 4px 0',
                }}>
                  ¿Olvidaste tu contraseña?
                </h1>
                <p style={{ color: '#555', fontSize: 13, margin: '0 0 24px 0' }}>
                  Te enviamos un link para crear una nueva.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      autoComplete="email"
                      className="input-dark"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-gold"
                    disabled={cargando}
                    style={{ marginTop: 4, opacity: cargando ? 0.7 : 1 }}
                  >
                    {cargando ? 'Enviando...' : 'Enviar link de recuperación'}
                  </button>
                </form>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '20px 0' }} />

                <p style={{ textAlign: 'center', margin: 0 }}>
                  <Link to="/login" style={{ fontSize: 12, color: '#444', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#C9A84C'}
                    onMouseLeave={e => e.target.style.color = '#444'}
                  >
                    ← Volver al login
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecuperarPassword;
