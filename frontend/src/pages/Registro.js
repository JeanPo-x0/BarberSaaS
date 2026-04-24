import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registro, crearBarberia } from '../services/api';
import PasswordInput from '../components/PasswordInput';

function calcularFortaleza(pwd) {
  const checks = [
    pwd.length >= 8,
    /[A-Z]/.test(pwd),
    /[!@#$%^&*()\-_=+{}|;:",.<>?/\\]/.test(pwd),
    /[0-9]/.test(pwd),
  ];
  const nivel = checks.filter(Boolean).length;
  const labels = ['', 'Muy débil', 'Débil', 'Intermedia', 'Fuerte'];
  const colors = ['', '#E63946', '#f97316', '#C9A84C', '#4ade80'];
  return { nivel, label: labels[nivel], color: colors[nivel], pct: nivel * 25, checks };
}

const CHECK_LABELS = ['8+ caracteres', 'Mayúscula', 'Carácter especial', 'Número'];

function Registro() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [nombreBarberia, setNombreBarberia] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const fortaleza = calcularFortaleza(password);

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');
    if (fortaleza.nivel < 3) {
      setError('La contraseña es muy débil. Usá mayúsculas, números y caracteres especiales.');
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setCargando(true);
    try {
      const resBarberia = await crearBarberia({ nombre: nombreBarberia, telefono });
      await registro({ email, password, rol: 'dueno', barberia_id: resBarberia.data.id });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrarse');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link to="/" style={{ fontFamily: "'Bebas Neue'", fontSize: 32, letterSpacing: '0.08em', color: '#C9A84C', textDecoration: 'none' }}>
            BarberSaaS
          </Link>
          <p style={{ color: '#8A8A8A', fontSize: 14, margin: '4px 0 0 0' }}>Registrá tu barbería</p>
        </div>

        <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 28 }}>
          <form onSubmit={handleRegistro} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              value={nombreBarberia}
              onChange={e => setNombreBarberia(e.target.value)}
              className="input-dark"
              placeholder="Nombre de tu barbería"
              required
            />
            <input
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              className="input-dark"
              placeholder="Teléfono (+50688887777)"
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-dark"
              placeholder="Tu email"
              required
            />

            <div>
              <PasswordInput
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña"
                autoComplete="new-password"
              />
              {password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${fortaleza.pct}%`, background: fortaleza.color, borderRadius: 2, transition: 'width 0.3s, background 0.3s' }} />
                  </div>
                  {fortaleza.label && (
                    <p style={{ fontSize: 11, color: fortaleza.color, margin: '0 0 6px 0', fontWeight: 600 }}>{fortaleza.label}</p>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {CHECK_LABELS.map((lbl, i) => (
                      <span key={i} style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 100,
                        background: fortaleza.checks[i] ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
                        color: fortaleza.checks[i] ? '#4ade80' : '#666',
                        border: `1px solid ${fortaleza.checks[i] ? 'rgba(74,222,128,0.2)' : 'transparent'}`,
                      }}>
                        {fortaleza.checks[i] ? '✓' : '·'} {lbl}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <PasswordInput
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                placeholder="Confirmar contraseña"
                autoComplete="new-password"
              />
              {confirmar.length > 0 && password !== confirmar && (
                <p style={{ fontSize: 12, color: '#E63946', margin: '6px 0 0 0' }}>Las contraseñas no coinciden</p>
              )}
              {confirmar.length > 0 && password === confirmar && (
                <p style={{ fontSize: 12, color: '#4ade80', margin: '6px 0 0 0' }}>Las contraseñas coinciden</p>
              )}
            </div>

            {error && <p style={{ color: '#E63946', fontSize: 13, margin: 0 }}>{error}</p>}

            <button
              type="submit"
              disabled={cargando}
              className="btn-gold"
              style={{ opacity: cargando ? 0.7 : 1 }}
            >
              {cargando ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: '#555', fontSize: 13, margin: '20px 0 0 0' }}>
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}>
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Registro;
