import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';
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

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);

  const fortaleza = calcularFortaleza(nuevaPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (fortaleza.nivel < 3) {
      setError('La contraseña es muy débil. Usá mayúsculas, números y caracteres especiales.');
      return;
    }
    if (nuevaPassword !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setCargando(true);
    try {
      await resetPassword({ token, nueva_password: nuevaPassword });
      setExito(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const msg = err.response?.data?.detail;
      setError(msg || 'Token inválido o expirado. Solicitá un nuevo link.');
    } finally {
      setCargando(false);
    }
  };

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: '#141414', border: '1px solid rgba(230,57,70,0.25)', borderRadius: 14, padding: 28, maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <p style={{ color: '#E63946', margin: '0 0 16px 0', fontSize: 14 }}>Link inválido o incompleto.</p>
          <Link to="/recuperar-password" style={{ color: '#C9A84C', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
            Solicitar nuevo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 36, letterSpacing: '0.08em', color: '#C9A84C', margin: '0 0 4px 0' }}>
            BarberSaaS
          </h1>
          <p style={{ color: '#8A8A8A', fontSize: 14, margin: 0 }}>Restablecer contraseña</p>
        </div>

        <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 28 }}>
          {exito ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 16, margin: '0 0 8px 0' }}>Contraseña actualizada</p>
              <p style={{ color: '#8A8A8A', fontSize: 13, margin: '0 0 20px 0' }}>Redirigiendo al login en unos segundos...</p>
              <Link to="/login" style={{ color: '#C9A84C', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
                Ir al login ahora
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 4px 0', color: '#F5F5F5' }}>Nueva contraseña</p>

              <div>
                <PasswordInput
                  value={nuevaPassword}
                  onChange={e => setNuevaPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                />
                {nuevaPassword && (
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
                  placeholder="Repetí la contraseña"
                  autoComplete="new-password"
                />
                {confirmar.length > 0 && nuevaPassword !== confirmar && (
                  <p style={{ fontSize: 12, color: '#E63946', margin: '6px 0 0 0' }}>Las contraseñas no coinciden</p>
                )}
                {confirmar.length > 0 && nuevaPassword === confirmar && (
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
                {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
