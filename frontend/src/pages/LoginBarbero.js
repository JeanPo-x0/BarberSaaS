import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginBarbero } from '../services/api';

function LoginBarbero() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const res = await loginBarbero({ email: email.trim().toLowerCase(), password });
      localStorage.setItem('token', res.data.access_token);
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
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 36, letterSpacing: '0.08em', color: '#C9A84C', margin: '0 0 4px 0' }}>
            BarberSaaS
          </h1>
          <p style={{ color: '#8A8A8A', fontSize: 14, margin: 0 }}>Acceso para barberos</p>
        </div>

        <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              required
              autoComplete="email"
              className="input-dark"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              className="input-dark"
            />
            {error && <p style={{ color: '#E63946', fontSize: 13, margin: 0 }}>{error}</p>}
            <button type="submit" disabled={cargando} className="btn-gold" style={{ opacity: cargando ? 0.7 : 1 }}>
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#555' }}>
            ¿Olvidaste tu contraseña? Pedile al dueño de tu barbería que te reenvíe la invitación desde el panel.
          </p>

          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#555' }}>
            ¿Sos dueño?{' '}
            <button
              onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans'", fontWeight: 600, padding: 0 }}
            >
              Ingresar como dueño
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginBarbero;
