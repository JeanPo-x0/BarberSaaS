import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, wakeUpServer, reenviarVerificacion, crearCheckout, getEstadoSuscripcion, forzarSyncSuscripcion } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

function StoreIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function Login() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [error, setError]               = useState('');
  const [cargando, setCargando]         = useState(false);
  const [estadoConexion, setEstadoConexion] = useState('');
  const [emailNoVerificado, setEmailNoVerificado] = useState(false);
  const [reenviadoOk, setReenviadoOk]   = useState(false);
  const [reenviadoCargando, setReenviadoCargando] = useState(false);
  const { iniciarSesion }               = useAuth();
  const navigate                        = useNavigate();

  const handleReenviar = async () => {
    setReenviadoCargando(true);
    try {
      await reenviarVerificacion({ email });
      setReenviadoOk(true);
    } catch {
      setReenviadoOk(true);
    } finally {
      setReenviadoCargando(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setEstadoConexion(''); setEmailNoVerificado(false); setReenviadoOk(false);
    setCargando(true);

    const intentarLogin = async () => {
      const res = await login({ email, password });
      if (res.data.access_token) {
        localStorage.setItem('token', res.data.access_token);
      }
      iniciarSesion(res.data.usuario);

      // Verificar si la cuenta nunca completó el pago
      try {
        const susRes = await getEstadoSuscripcion();
        if (susRes.data?.estado === 'pendiente_pago') {
          // Intentar sync con Stripe primero — puede que el webhook llegó tarde
          try {
            await forzarSyncSuscripcion();
            const recheck = await getEstadoSuscripcion();
            if (recheck.data?.estado !== 'pendiente_pago') {
              navigate('/agenda');
              return;
            }
          } catch { /* si falla, continuar a planes */ }
          navigate('/planes');
          return;
        }
      } catch { /* si falla la consulta, dejar pasar */ }

      const pending = localStorage.getItem('pendingCheckout');
      if (pending) {
        localStorage.removeItem('pendingCheckout');
        try {
          const { plan, periodo } = JSON.parse(pending);
          const checkoutRes = await crearCheckout({ plan, periodo });
          window.location.href = checkoutRes.data.url;
          return;
        } catch { /* si falla el checkout igual entrar a la app */ }
      }
      navigate('/agenda');
    };

    try {
      await intentarLogin();
    } catch (err) {
      if (!err.response) {
        setEstadoConexion('Iniciando servidor, por favor espera...');
        await wakeUpServer();
        await new Promise(r => setTimeout(r, 3000));
        try {
          await intentarLogin();
        } catch (err2) {
          setEstadoConexion('');
          setError(!err2.response
            ? 'El servidor no responde. Intenta de nuevo en unos segundos.'
            : 'Email o contraseña incorrectos.');
        }
      } else if (err.response?.status === 403 && err.response?.data?.detail === 'EMAIL_NO_VERIFICADO') {
        setEmailNoVerificado(true);
      } else {
        setError('Email o contraseña incorrectos.');
      }
    } finally {
      setCargando(false);
      setEstadoConexion('');
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
      {/* Glow de fondo — tono más cálido/intenso que el barbero */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(201,168,76,0.1) 0%, transparent 70%)',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>

        {/* Identificador de rol */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <StoreIcon />
          </div>
          <div>
            <p style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.1em', color: '#C9A84C', margin: 0, lineHeight: 1 }}>
              Barbería
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
          {/* Franja dorada superior */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #C9A84C 40%, #e8c96a 60%, transparent)' }} />

          <div style={{ padding: '28px 28px 24px' }}>
            <h1 style={{
              fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: '0.08em',
              color: '#fff', margin: '0 0 4px 0',
            }}>
              Bienvenido de vuelta
            </h1>
            <p style={{ color: '#555', fontSize: 13, margin: '0 0 24px 0' }}>Ingresá con tu cuenta de dueño</p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                <PasswordInput
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  name="password"
                />
              </div>

              {/* Cold start */}
              {estadoConexion && (
                <div style={{
                  background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)',
                  borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C9A84C', textAlign: 'center',
                }}>
                  {estadoConexion}
                </div>
              )}

              {emailNoVerificado && (
                <div style={{
                  background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)',
                  borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#C9A84C',
                }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>Verificá tu email antes de ingresar.</p>
                  <p style={{ margin: '0 0 10px 0', fontSize: 12, color: 'rgba(201,168,76,0.7)' }}>
                    Revisá tu bandeja de entrada (y la carpeta de spam).
                  </p>
                  {reenviadoOk ? (
                    <p style={{ margin: 0, fontSize: 12, color: '#4ade80' }}>Email de verificación reenviado.</p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleReenviar}
                      disabled={reenviadoCargando}
                      style={{
                        background: 'none', border: '1px solid rgba(201,168,76,0.4)',
                        borderRadius: 7, padding: '6px 14px', cursor: 'pointer',
                        color: '#C9A84C', fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans'",
                        opacity: reenviadoCargando ? 0.6 : 1,
                      }}
                    >
                      {reenviadoCargando ? 'Enviando...' : 'Reenviar email de verificación'}
                    </button>
                  )}
                </div>
              )}

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
                className="btn-gold"
                disabled={cargando}
                style={{ marginTop: 4, opacity: cargando ? 0.7 : 1 }}
              >
                {cargando ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '20px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'center' }}>
              <Link to="/recuperar-password" style={{
                fontSize: 12, color: '#444', textDecoration: 'none', transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.target.style.color = '#C9A84C'}
                onMouseLeave={e => e.target.style.color = '#444'}
              >
                ¿Olvidaste tu contraseña?
              </Link>

              <p style={{ fontSize: 12, color: '#444', margin: 0 }}>
                ¿No tenés cuenta?{' '}
                <Link to="/registro" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}>
                  Registrá tu barbería
                </Link>
              </p>

              <button
                onClick={() => navigate('/barbero/login')}
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
                Soy barbero — ir a mi portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
