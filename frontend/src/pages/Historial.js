import { useEffect, useState } from 'react';
import { getMisCitas } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const ESTADO = {
  cancelada:  { bg: 'rgba(230,57,70,0.1)',  color: '#E63946', border: 'rgba(230,57,70,0.3)',  label: 'Cancelada' },
  completada: { bg: 'rgba(74,222,128,0.08)', color: '#4ade80', border: 'rgba(74,222,128,0.25)', label: 'Completada' },
};

function fmt(fecha_hora) {
  const d = new Date(fecha_hora);
  return {
    hora:  d.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }),
    fecha: d.toLocaleDateString('es-CR', { weekday: 'short', day: '2-digit', month: 'short' }),
    iso:   d.toISOString().split('T')[0],
  };
}

function CitaHistorial({ cita }) {
  const est = ESTADO[cita.estado] || ESTADO.completada;
  const { hora, fecha } = fmt(cita.fecha_hora);

  return (
    <div className="anim-item historial-card" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      display: 'flex',
      gap: 0,
      alignItems: 'stretch',
      overflow: 'hidden',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      opacity: 0.9,
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Bloque tiempo */}
      <div className="historial-time-block" style={{
        background: 'rgba(255,255,255,0.02)',
        borderRight: '1px solid var(--border)',
        padding: '14px 14px',
        textAlign: 'center',
        flexShrink: 0,
        minWidth: 64,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
      }}>
        <p style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.04em', color: 'var(--text-muted)', margin: 0, lineHeight: 1 }}>
          {hora}
        </p>
        <p style={{ fontSize: 10, color: 'rgba(138,138,138,0.7)', margin: 0, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
          {fecha}
        </p>
      </div>

      {/* Info */}
      <div style={{ flex: 1, padding: '14px 16px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5 }}>
        <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {cita.cliente?.nombre || `Cliente #${cita.cliente_id}`}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px', alignItems: 'center' }}>
          {cita.barbero && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              {cita.barbero.nombre}
            </span>
          )}
          {cita.servicio && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {cita.servicio.nombre}
            </span>
          )}
          {cita.servicio && (
            <span style={{ fontSize: 12, color: '#C9A84C', fontWeight: 700, letterSpacing: '0.02em' }}>
              ₡{cita.servicio.precio.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Badge estado */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <span style={{
          background: est.bg, color: est.color,
          border: `1px solid ${est.border}`,
          borderRadius: 100, padding: '4px 12px',
          fontSize: 11, fontWeight: 700,
          whiteSpace: 'nowrap',
        }}>
          {est.label}
        </span>
      </div>
    </div>
  );
}

function Historial() {
  const [citas, setCitas] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    getMisCitas().then(res => {
      const hace30dias = new Date();
      hace30dias.setDate(hace30dias.getDate() - 30);
      const historial = res.data.filter(c =>
        (c.estado === 'cancelada' || c.estado === 'completada') &&
        new Date(c.fecha_hora) >= hace30dias
      );
      setCitas(historial);
    }).finally(() => setLoading(false));
  }, [navigate]);

  const citasFiltradas = filtro === 'todas' ? citas : citas.filter(c => c.estado === filtro);
  const totalCompletadas = citas.filter(c => c.estado === 'completada').length;
  const totalCanceladas  = citas.filter(c => c.estado === 'cancelada').length;

  return (
    <div className="bg-panel" style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />

      <div className="mobile-px" style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div className="mobile-header-row anim-fadein" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 32, letterSpacing: '0.08em', margin: '0 0 2px 0', color: 'var(--text-primary)' }}>
              Historial
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
              Ultimos 30 dias
            </p>
          </div>
          <Link to="/agenda" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none',
            padding: '8px 14px', borderRadius: 8,
            border: '1px solid var(--border)',
            transition: 'color 0.2s, border-color 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F5F5F5'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Agenda
          </Link>
        </div>

        {/* Stats mini */}
        {!loading && citas.length > 0 && (
          <div className="historial-stats anim-fadein" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Total', value: citas.length, color: 'var(--text-primary)' },
              { label: 'Completadas', value: totalCompletadas, color: '#4ade80' },
              { label: 'Canceladas',  value: totalCanceladas,  color: '#E63946' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '12px 14px', textAlign: 'center',
              }}>
                <p style={{ fontFamily: "'Bebas Neue'", fontSize: 22, margin: 0, color: s.color, letterSpacing: '0.04em' }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['todas', 'completada', 'cancelada'].map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={{
                background: filtro === f ? '#C9A84C' : 'var(--bg-card)',
                color: filtro === f ? '#0A0A0A' : 'var(--text-muted)',
                border: `1px solid ${filtro === f ? '#C9A84C' : 'var(--border)'}`,
                borderRadius: 8, padding: '6px 14px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans'",
                transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}
            >
              {f === 'todas' ? 'Todas' : f}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 16 }}>
                <div className="skeleton" style={{ width: 64, height: 48, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ width: '40%', height: 14 }} />
                  <div className="skeleton" style={{ width: '60%', height: 11 }} />
                </div>
                <div className="skeleton" style={{ width: 80, height: 26, borderRadius: 100 }} />
              </div>
            ))}
          </div>
        ) : citasFiltradas.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '48px 24px', textAlign: 'center',
          }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No hay citas en el historial</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {citasFiltradas.map(cita => (
              <CitaHistorial key={cita.id} cita={cita} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Historial;
