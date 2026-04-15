import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, wakeUpServer } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LogoLink from '../components/LogoLink';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [estadoConexion, setEstadoConexion] = useState(''); // mensaje de estado durante cold start
  const [showPass, setShowPass] = useState(false);
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  // Al montar la pagina, despertar el servidor en background
  useEffect(() => {
    wakeUpServer();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setEstadoConexion('');
    setCargando(true);

    const intentarLogin = async () => {
      const res = await login({ email, password });
      iniciarSesion(res.data.access_token, { email });
      navigate('/agenda');
    };

    try {
      await intentarLogin();
    } catch (err) {
      if (!err.response) {
        // Cold start: el servidor no respondio a tiempo — reintentamos una vez
        setEstadoConexion('Iniciando servidor, por favor espera...');
        try {
          await intentarLogin();
        } catch (err2) {
          setEstadoConexion('');
          if (!err2.response) {
            setError('El servidor no responde. Intenta de nuevo en unos segundos.');
          } else {
            setError('Email o contrasena incorrectos.');
          }
        }
      } else {
        setError('Email o contrasena incorrectos.');
      }
    } finally {
      setCargando(false);
      setEstadoConexion('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Back link */}
      <div style={{ position: 'absolute', top: 24, left: 24 }}>
        <LogoLink to="/" />
      </div>

      <div className="anim-fadeup" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 32, letterSpacing: '0.12em',
            color: 'var(--text-primary)', margin: '0 0 6px 0',
          }}>
            Bienvenido de vuelta
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            Ingresa a tu panel de administracion
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-dark"
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>
              Contrasena
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-dark"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: 0, display: 'flex',
                }}
              >
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Estado cold start */}
          {estadoConexion && (
            <div style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.25)',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 13, color: '#C9A84C', textAlign: 'center',
            }}>
              {estadoConexion}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(230,57,70,0.08)',
              border: '1px solid rgba(230,57,70,0.25)',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 13, color: '#E63946',
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn-gold"
            disabled={cargando}
            style={{ width: '100%', marginTop: 4, opacity: cargando ? 0.7 : 1 }}
          >
            {cargando ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>

        {/* Links */}
        <div style={{ marginTop: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link to="/recuperar-password" style={{
            fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.target.style.color = '#C9A84C'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
          >
            Olvide mi contrasena
          </Link>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            No tenes cuenta?{' '}
            <Link to="/registro" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}>
              Registra tu barberia
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
