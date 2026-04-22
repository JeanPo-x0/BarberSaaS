import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { activarBarbero } from '../services/api';

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

const CHECK_LABELS = ['8+ caracteres', 'Mayúscula', 'Caracter especial', 'Número'];

function ActivarBarbero() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);

  const fortaleza = calcularFortaleza(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmar) { setError('Las contraseñas no coinciden'); return; }
    if (fortaleza.nivel < 3) { setError('La contraseña es muy débil. Usa mayúsculas, números y caracteres especiales.'); return; }
    setCargando(true);
    try {
      await activarBarbero({ token, nueva_password: password });
      setExito(true);
    } catch (err) {
      const det = err.response?.data?.detail;
      setError(typeof det === 'string' ? det : 'Link inválido o expirado');
    } finally {
      setCargando(false);
    }
  };

  if (!token) return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#E63946', fontFamily: "'DM Sans'" }}>Link inválido.</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 36, letterSpacing: '0.08em', color: '#C9A84C', margin: '0 0 4px 0' }}>
            BarberSaaS
          </h1>
          <p style={{ color: '#8A8A8A', fontSize: 14, margin: 0 }}>Activar cuenta de barbero</p>
        </div>

        {exito ? (
          <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 14, padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 16, margin: '0 0 8px 0' }}>¡Cuenta activada!</p>
            <p style={{ color: '#8A8A8A', fontSize: 13, margin: '0 0 20px 0' }}>Ya podés iniciar sesión con tu email y contraseña.</p>
            <button onClick={() => navigate('/barbero/login')} className="btn-gold" style={{ width: '100%' }}>
              Ir al login
            </button>
          </div>
        ) : (
          <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 28 }}>
            <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 18px 0', color: '#F5F5F5' }}>Crea tu contraseña</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nueva contraseña"
                  required
                  className="input-dark"
                  style={{ width: '100%', boxSizing: 'border-box' }}
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
              <input
                type="password"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                placeholder="Confirmar contraseña"
                required
                className="input-dark"
              />
              {error && <p style={{ color: '#E63946', fontSize: 13, margin: 0 }}>{error}</p>}
              <button type="submit" disabled={cargando} className="btn-gold" style={{ opacity: cargando ? 0.7 : 1 }}>
                {cargando ? 'Activando...' : 'Activar cuenta'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivarBarbero;
