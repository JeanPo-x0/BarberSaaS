import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';

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
      setError('Las contrasenas no coinciden');
      return;
    }

    setCargando(true);
    try {
      await resetPassword({ token, nueva_password: nuevaPassword });
      setExito(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const msg = err.response?.data?.detail;
      setError(msg || 'Token invalido o expirado. Solicita un nuevo link.');
    } finally {
      setCargando(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <p className="text-red-400 mb-4">Link invalido o incompleto.</p>
          <Link to="/recuperar-password" className="text-yellow-400 hover:underline text-sm">
            Solicitar nuevo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-yellow-400 text-center mb-2">BarberSaaS</h1>
        <p className="text-gray-400 text-center mb-8">Nueva contrasena</p>

        {exito ? (
          <div className="text-center space-y-4">
            <p className="text-white font-semibold">Contrasena actualizada</p>
            <p className="text-gray-400 text-sm">Redirigiendo al login en unos segundos...</p>
            <Link to="/login" className="inline-block mt-2 text-yellow-400 hover:underline text-sm">
              Ir al login ahora
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-1">Nueva contrasena</label>
              <input
                type="password"
                value={nuevaPassword}
                onChange={e => setNuevaPassword(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Mínimo 8 caracteres"
                required
              />
              {nuevaPassword && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${fortaleza.pct}%`, background: fortaleza.color, borderRadius: 2, transition: 'width 0.3s, background 0.3s' }} />
                  </div>
                  {fortaleza.label && <p style={{ fontSize: 11, color: fortaleza.color, margin: '0 0 6px 0', fontWeight: 600 }}>{fortaleza.label}</p>}
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
              <label className="block text-gray-300 mb-1">Confirmar contrasena</label>
              <input
                type="password"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Repite la contrasena"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-yellow-400 text-gray-900 font-bold py-2 rounded-lg hover:bg-yellow-300 transition disabled:opacity-50"
            >
              {cargando ? 'Guardando...' : 'Guardar nueva contrasena'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
