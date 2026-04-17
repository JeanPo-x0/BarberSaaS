import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminStats, getAdminBarberias, suspenderBarberia, reactivarBarberia } from '../services/api';
import Navbar from '../components/Navbar';

const ESTADO_STYLE = {
  activa:         { bg: 'rgba(74,222,128,0.08)',  color: '#4ade80',  border: 'rgba(74,222,128,0.25)' },
  trial:          { bg: 'rgba(201,168,76,0.1)',   color: '#C9A84C',  border: 'rgba(201,168,76,0.3)' },
  suspendida:     { bg: 'rgba(230,57,70,0.08)',   color: '#E63946',  border: 'rgba(230,57,70,0.25)' },
  cancelada:      { bg: 'rgba(255,255,255,0.04)', color: '#8A8A8A',  border: 'rgba(255,255,255,0.08)' },
  sin_suscripcion:{ bg: 'rgba(255,255,255,0.04)', color: '#8A8A8A',  border: 'rgba(255,255,255,0.08)' },
};

const PLAN_COLOR = {
  basico: 'var(--text-muted)',
  pro: '#C9A84C',
  premium: '#a78bfa',
};

const StatCard = ({ label, value, color = 'var(--text-primary)' }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '18px 20px',
  }}>
    <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
      {label}
    </p>
    <p style={{ fontFamily: "'Bebas Neue'", fontSize: 34, letterSpacing: '0.05em', margin: 0, color }}>
      {value}
    </p>
  </div>
);

const Spinner = () => (
  <div style={{
    minHeight: '100vh', background: 'var(--bg-primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <div style={{
      width: 36, height: 36, border: '3px solid var(--border)',
      borderTopColor: '#C9A84C', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function SuperAdmin() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [barberias, setBarberias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [accionando, setAccionando] = useState({});

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    cargar();
  }, [token]); // eslint-disable-line

  const cargar = async () => {
    setCargando(true); setError('');
    try {
      const [statsRes, listRes] = await Promise.all([getAdminStats(), getAdminBarberias()]);
      setStats(statsRes.data);
      setBarberias(listRes.data);
    } catch (err) {
      setError(err.response?.status === 403 ? 'Acceso restringido. Solo el super-admin puede ver esta seccion.' : 'Error cargando datos.');
    } finally {
      setCargando(false);
    }
  };

  const accion = async (id, tipo) => {
    setAccionando(p => ({ ...p, [id]: true }));
    try {
      if (tipo === 'suspender') await suspenderBarberia(id); else await reactivarBarberia(id);
      cargar();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error');
    } finally {
      setAccionando(p => ({ ...p, [id]: false }));
    }
  };

  const filtradas = barberias.filter(b =>
    b.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (b.email || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) return <Spinner />;

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: "'DM Sans'" }}>
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 380 }}>{error}</p>
      <button onClick={() => navigate('/panel')} style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontFamily: "'DM Sans'", fontSize: 14 }}>
        Volver al Panel
      </button>
    </div>
  );

  return (
    <div className="bg-grid-lines" style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar links={[{ label: 'Panel', to: '/panel' }]} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 32, letterSpacing: '0.08em', color: '#C9A84C', margin: '0 0 4px 0' }}>
            Super Admin
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
            Gestion global de la plataforma BarberSaaS
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 32 }}>
            <StatCard label="Total barberias" value={stats.total_barberias} />
            <StatCard label="Activas" value={stats.barberias_activas} color="#4ade80" />
            <StatCard label="En trial" value={stats.en_trial} color="#C9A84C" />
            <StatCard label="Suspendidas" value={stats.suspendidas} color="#E63946" />
            <StatCard label="Plan Pro" value={stats.plan_pro_activo} color="#C9A84C" />
            <StatCard label="Premium" value={stats.plan_premium_activo} color="#a78bfa" />
            <StatCard label="MRR estimado" value={`$${stats.mrr_estimado_usd}`} color="#4ade80" />
            <StatCard label="Ingresos/mes" value={`$${stats.ingresos_citas_mes?.toFixed(0)}`} color="#60a5fa" />
          </div>
        )}

        {/* Buscador */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="input-dark"
            style={{ maxWidth: 340 }}
          />
        </div>

        {/* Tabla */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Barberia', 'Plan', 'Estado', 'Renovacion', 'Barberos', 'Citas', 'Accion'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '12px 16px',
                    color: 'var(--text-muted)', fontWeight: 600, fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map(b => {
                const est = ESTADO_STYLE[b.estado_suscripcion] || ESTADO_STYLE.sin_suscripcion;
                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>{b.nombre}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: 0 }}>{b.email}</p>
                      {b.subdominio && (
                        <p style={{ color: '#a78bfa', fontSize: 11, margin: '2px 0 0 0' }}>/b/{b.subdominio}</p>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 700, textTransform: 'capitalize', color: PLAN_COLOR[b.plan] || 'var(--text-muted)' }}>
                        {b.plan}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: est.bg, color: est.color, border: `1px solid ${est.border}`,
                        borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                        textTransform: 'capitalize', whiteSpace: 'nowrap',
                      }}>
                        {b.estado_suscripcion?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                      {b.estado_suscripcion === 'trial' ? `Trial ${b.fecha_trial_fin || '—'}` : b.fecha_renovacion || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{b.total_barberos}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{b.total_citas}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {b.activa ? (
                        <button onClick={() => accion(b.id, 'suspender')} disabled={accionando[b.id]} style={{
                          background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.25)',
                          color: '#E63946', borderRadius: 6, padding: '5px 12px',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans'",
                          opacity: accionando[b.id] ? 0.5 : 1,
                        }}>
                          {accionando[b.id] ? '...' : 'Suspender'}
                        </button>
                      ) : (
                        <button onClick={() => accion(b.id, 'reactivar')} disabled={accionando[b.id]} style={{
                          background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)',
                          color: '#4ade80', borderRadius: 6, padding: '5px 12px',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans'",
                          opacity: accionando[b.id] ? 0.5 : 1,
                        }}>
                          {accionando[b.id] ? '...' : 'Reactivar'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron barberias
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
