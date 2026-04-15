import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getIngresos, getRetencion, getAvanzadas, postReenganche } from '../services/api';
import Navbar from '../components/Navbar';

const TARJETAS = [
  { key: 'hoy',      label: 'Hoy' },
  { key: 'semana',   label: 'Esta semana' },
  { key: 'quincena', label: 'Quincena' },
  { key: 'mes',      label: 'Este mes' },
];

const Spinner = () => (
  <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const StatCard = ({ label, value }) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px' }}>
    <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px 0' }}>
      {label}
    </p>
    <p style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: '#C9A84C', letterSpacing: '0.05em', margin: 0 }}>
      {value}
    </p>
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
  const [tabActiva, setTabActiva] = useState('ingresos');

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

  const exportarPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('Reporte de Ingresos — BarberSaaS', 14, 20);
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 14, 30);
      if (datos?.ingresos) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text('Resumen de Ingresos', 14, 45);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
        let y = 55;
        TARJETAS.forEach(({ key, label }) => { doc.text(`${label}: $${datos.ingresos[key]?.toFixed(2) || '0.00'}`, 14, y); y += 8; });
      }
      if (datos?.barbero_top_semana) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text('Barbero Top de la Semana', 14, 100);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
        doc.text(`${datos.barbero_top_semana.nombre} — ${datos.barbero_top_semana.citas} citas`, 14, 110);
      }
      doc.save('reporte-ingresos-barbersaas.pdf');
    } catch {
      alert('Error generando PDF. Instala jspdf (npm install jspdf).');
    }
  };

  if (cargando) return <Spinner />;

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: "'DM Sans'" }}>
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 380 }}>{error}</p>
      <button onClick={() => navigate('/planes')} className="btn-gold">Ver Planes</button>
      <button onClick={() => navigate('/panel')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: "'DM Sans'", fontSize: 13 }}>
        Volver al Panel
      </button>
    </div>
  );

  const tabStyle = (activo) => ({
    padding: '8px 0', marginRight: 24, fontSize: 14, fontWeight: 600, cursor: 'pointer',
    background: 'none', border: 'none', fontFamily: "'DM Sans'",
    color: activo ? '#C9A84C' : 'var(--text-muted)',
    borderBottom: `2px solid ${activo ? '#C9A84C' : 'transparent'}`,
    transition: 'all 0.2s',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar links={[{ label: 'Panel', to: '/panel' }, { label: 'Agenda', to: '/agenda' }]}
        actions={avanzadas ? (
          <button onClick={exportarPDF} className="btn-outline" style={{ padding: '6px 14px', fontSize: 13 }}>
            Exportar PDF
          </button>
        ) : null}
      />

      <div className="mobile-px" style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 32, letterSpacing: '0.08em', color: '#C9A84C', margin: '0 0 4px 0' }}>
            Dashboard de Ingresos
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
            Estadisticas de tu barberia en tiempo real
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
          {[
            { key: 'ingresos', label: 'Ingresos' },
            { key: 'retencion', label: 'Retencion' },
            { key: 'avanzadas', label: 'Avanzadas' },
          ].map(t => (
            <button key={t.key} style={tabStyle(tabActiva === t.key)} onClick={() => setTabActiva(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Ingresos */}
        {tabActiva === 'ingresos' && datos && (
          <div>
            <div className="stats-grid-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
              {TARJETAS.map(({ key, label }) => (
                <StatCard key={key} label={label} value={`$${datos.ingresos?.[key]?.toFixed(2) || '0.00'}`} />
              ))}
            </div>

            {/* Grafico */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px', marginBottom: 20 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 20px 0' }}>
                Ingresos del mes (dia a dia)
              </p>
              {datos.grafico_mensual?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
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
                      formatter={v => [`$${v}`, 'Ingresos']}
                    />
                    <Area type="monotone" dataKey="monto" stroke="#C9A84C" strokeWidth={2} fill="url(#goldGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0', margin: 0 }}>
                  Aun no hay citas completadas este mes.
                </p>
              )}
            </div>

            {/* Barbero top */}
            {datos.barbero_top_semana && (
              <div style={{
                background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: 12, padding: '20px',
              }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px 0' }}>
                  Barbero top esta semana
                </p>
                <p style={{ fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: '0.05em', margin: '0 0 2px 0' }}>
                  {datos.barbero_top_semana.nombre}
                </p>
                <p style={{ color: '#C9A84C', fontSize: 13, margin: 0 }}>
                  {datos.barbero_top_semana.citas} citas completadas
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab Retencion */}
        {tabActiva === 'retencion' && (
          <div>
            {retencion ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: '0.06em', margin: 0 }}>
                    Clientes sin volver en +30 dias
                    <span style={{ color: '#C9A84C', marginLeft: 10, fontSize: 18 }}>
                      ({retencion.clientes_inactivos?.length || 0})
                    </span>
                  </h2>
                </div>
                {retencion.clientes_inactivos?.length === 0 ? (
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '48px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Todos tus clientes han vuelto en los ultimos 30 dias.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {retencion.clientes_inactivos.map(c => (
                      <div key={c.id} className="mobile-item-row" style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 12, padding: '16px 20px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 4px 0' }}>{c.nombre}</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
                            Ultima visita: {c.ultima_visita} —{' '}
                            <span style={{ color: '#fb923c' }}>{c.dias_ausente} dias sin volver</span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleReenganche(c.id, c.nombre)}
                          disabled={enviando[c.id]}
                          style={{
                            background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)',
                            color: '#4ade80', borderRadius: 8, padding: '8px 16px',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans'",
                            opacity: enviando[c.id] ? 0.5 : 1, whiteSpace: 'nowrap',
                          }}
                        >
                          {enviando[c.id] ? 'Enviando...' : 'Re-enganchar'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '48px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
                  Las metricas de retencion y WhatsApp de reenganche son exclusivas del plan Premium.
                </p>
                <button onClick={() => navigate('/planes')} className="btn-gold">Actualizar a Premium</button>
              </div>
            )}
          </div>
        )}

        {/* Tab Avanzadas */}
        {tabActiva === 'avanzadas' && (
          <div>
            {avanzadas ? (
              <div className="stats-grid-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <StatCard label="Total clientes" value={avanzadas.total_clientes} />
                <StatCard label="Activos este mes" value={avanzadas.clientes_activos_mes} />
                <StatCard label="Tasa retencion" value={`${avanzadas.tasa_retencion}%`} />
                {avanzadas.servicio_mas_popular && (
                  <div style={{
                    gridColumn: '1 / -1', background: 'rgba(201,168,76,0.06)',
                    border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: '20px',
                  }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px 0' }}>
                      Servicio mas popular
                    </p>
                    <p style={{ fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: '0.05em', margin: '0 0 2px 0' }}>
                      {avanzadas.servicio_mas_popular.nombre}
                    </p>
                    <p style={{ color: '#C9A84C', fontSize: 13, margin: 0 }}>
                      {avanzadas.servicio_mas_popular.total} citas completadas
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '48px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
                  Las estadisticas avanzadas son exclusivas del plan Premium.
                </p>
                <button onClick={() => navigate('/planes')} className="btn-gold">Actualizar a Premium</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
