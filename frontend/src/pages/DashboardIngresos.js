import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getIngresos, getRetencion, getAvanzadas, postReenganche } from '../services/api';
import Navbar from '../components/Navbar';

const Spinner = () => (
  <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function DashboardIngresos() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [retencion, setRetencion] = useState(null);
  const [avanzadas, setAvanzadas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState({});

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    cargarDatos();
  }, [token]); // eslint-disable-line

  const cargarDatos = async () => {
    setCargando(true); setError('');
    try {
      const [ingRes, retRes] = await Promise.all([getIngresos(), getRetencion().catch(() => null)]);
      setDatos(ingRes.data);
      if (retRes) setRetencion(retRes.data);
      const advRes = await getAvanzadas().catch(() => null);
      if (advRes) setAvanzadas(advRes.data);
    } catch (err) {
      setError(err.response?.status === 403
        ? 'Esta funcion requiere plan Pro o Premium.'
        : 'Error cargando estadisticas.');
    } finally {
      setCargando(false);
    }
  };

  const handleReenganche = async (clienteId, nombre) => {
    setEnviando(p => ({ ...p, [clienteId]: true }));
    try {
      await postReenganche(clienteId);
      alert(`WhatsApp enviado a ${nombre}`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error enviando WhatsApp');
    } finally {
      setEnviando(p => ({ ...p, [clienteId]: false }));
    }
  };

  if (cargando) return <Spinner />;

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: "'DM Sans'" }}>
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 380 }}>{error}</p>
      <button onClick={() => navigate('/planes')} className="btn-gold">Ver Planes</button>
    </div>
  );

  const ing = datos?.ingresos || {};

  return (
    <div className="bg-panel" style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />

      <div className="mobile-px" style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 32, letterSpacing: '0.08em', color: '#C9A84C', margin: '0 0 4px 0' }}>
            Ingresos
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
            Resumen financiero de tu barbería
          </p>
        </div>

        {/* Métricas principales — solo hoy y mes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Hoy',       value: ing.hoy },
            { label: 'Este mes',  value: ing.mes },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '20px',
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px 0' }}>
                {label}
              </p>
              <p style={{ fontFamily: "'Bebas Neue'", fontSize: 34, color: '#C9A84C', letterSpacing: '0.05em', margin: 0, lineHeight: 1 }}>
                ₡{(value || 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Semana — métrica secundaria pequeña */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '14px 20px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Esta semana</span>
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: '#C9A84C', letterSpacing: '0.04em' }}>
            ₡{(ing.semana || 0).toLocaleString()}
          </span>
        </div>

        {/* Gráfico mensual */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '24px', marginBottom: 24,
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 20px 0' }}>
            Ingresos del mes
          </p>
          {datos?.grafico_mensual?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={datos.grafico_mensual}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="fecha" tick={{ fill: '#8A8A8A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8A8A8A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontFamily: "'DM Sans'" }}
                  labelStyle={{ color: '#8A8A8A', fontSize: 12 }}
                  itemStyle={{ color: '#C9A84C', fontWeight: 700 }}
                  formatter={v => [`₡${v.toLocaleString()}`, 'Ingresos']}
                />
                <Area type="monotone" dataKey="monto" stroke="#C9A84C" strokeWidth={2} fill="url(#goldGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0', margin: 0, fontSize: 13 }}>
              Aún no hay citas completadas este mes.
            </p>
          )}
        </div>

        {/* Barbero top */}
        {datos?.barbero_top_semana && (
          <div style={{
            background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 12, padding: '18px 20px', marginBottom: 24,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px 0' }}>
                Barbero top esta semana
              </p>
              <p style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: '0.05em', margin: 0 }}>
                {datos.barbero_top_semana.nombre}
              </p>
            </div>
            <div style={{
              background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)',
              borderRadius: 10, padding: '8px 14px', textAlign: 'center',
            }}>
              <p style={{ fontFamily: "'Bebas Neue'", fontSize: 24, color: '#C9A84C', margin: 0, letterSpacing: '0.04em' }}>
                {datos.barbero_top_semana.citas}
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                citas
              </p>
            </div>
          </div>
        )}

        {/* Retención — solo si hay data (plan premium) */}
        {retencion && retencion.clientes_inactivos?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px 0' }}>
              Clientes inactivos · {retencion.clientes_inactivos.length}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {retencion.clientes_inactivos.slice(0, 5).map(c => (
                <div key={c.id} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '14px 18px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.nombre}
                    </p>
                    <p style={{ color: '#fb923c', fontSize: 12, margin: 0 }}>
                      {c.dias_ausente} días sin volver
                    </p>
                  </div>
                  <button
                    onClick={() => handleReenganche(c.id, c.nombre)}
                    disabled={enviando[c.id]}
                    style={{
                      background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)',
                      color: '#4ade80', borderRadius: 8, padding: '7px 14px',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans'",
                      opacity: enviando[c.id] ? 0.5 : 1, flexShrink: 0, whiteSpace: 'nowrap',
                    }}
                  >
                    {enviando[c.id] ? '...' : 'Re-enganchar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats avanzadas — solo si hay data */}
        {avanzadas && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Total clientes',     value: avanzadas.total_clientes },
              { label: 'Activos este mes',   value: avanzadas.clientes_activos_mes },
              { label: 'Tasa retención',     value: `${avanzadas.tasa_retencion}%` },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '16px',
              }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px 0' }}>
                  {label}
                </p>
                <p style={{ fontFamily: "'Bebas Neue'", fontSize: 26, color: '#C9A84C', margin: 0, letterSpacing: '0.04em' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
