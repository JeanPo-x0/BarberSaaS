import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginBarbero } from '../services/api';

function ScissorsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
      <line x1="20" y1="4" x2="8.12" y2="15.88"/>
      <line x1="14.47" y1="14.48" x2="20" y2="20"/>
      <line x1="8.12" y1="8.12" x2="12" y2="12"/>
    </svg>
  );
}

function LoginBarbero() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const res = await loginBarbero({ email: email.trim().toLowerCase(), password });
      // El token llega en cookie HttpOnly — no se guarda en localStorage
      // Solo guardamos info no sensible para el interceptor de 401
      localStorage.setItem('usuario', JSON.stringify({ email: res.data.barbero.email, rol: 'barbero', nombre: res.data.barbero.nombre }));
      navigate('/barbero/agenda');
    } catch (err) {
      const det = err.response?.data?.detail;
      setError(typeof det === 'string' ? det : 'Credenciales inválidas');
    } finally {
      setCargando(false);
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
      {/* Sutil glow de fondo */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>

        {/* Identificador de rol — diferenciador clave */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginBottom: 20,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ScissorsIcon />
          </div>
          <div>
            <p style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.1em', color: '#C9A84C', margin: 0, lineHeight: 1 }}>
              Portal Barberos
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
          {/* Franja dorada superior — identificador visual */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #C9A84C 40%, #e8c96a 60%, transparent)' }} />

          <div style={{ padding: '28px 28px 24px' }}>
            <h1 style={{
              fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: '0.08em',
              color: '#fff', margin: '0 0 4px 0',
            }}>
              Bienvenido de vuelta
            </h1>
            <p style={{ color: '#555', fontSize: 13, margin: '0 0 24px 0' }}>Ingresá con tu cuenta de barbero</p>

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

              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="input-dark"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#555', padding: 0, display: 'flex',
                    }}
                  >
                    {showPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.25)',
                  borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#E63946',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="btn-gold"
                style={{ marginTop: 4, opacity: cargando ? 0.7 : 1 }}
              >
                {cargando ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>

            {/* Divisor */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '20px 0' }} />

            <p style={{ textAlign: 'center', fontSize: 12, color: '#444', margin: '0 0 10px 0' }}>
              ¿Olvidaste tu contraseña? Pedile al dueño de tu barbería que te reenvíe la invitación.
            </p>

            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10,
                color: '#666', cursor: 'pointer', fontSize: 12,
                fontFamily: "'DM Sans'", fontWeight: 500, padding: '10px',
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'; e.currentTarget.style.color = '#C9A84C'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#666'; }}
            >
              Soy dueño — ir a mi panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginBarbero;
