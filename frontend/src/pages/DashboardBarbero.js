import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAgendaBarbero, completarCitaBarbero } from '../services/api';

const ESTADO = {
  pendiente:  { bg: 'rgba(201,168,76,0.1)',  color: '#C9A84C', border: 'rgba(201,168,76,0.25)', label: 'Pendiente' },
  completada: { bg: 'rgba(99,102,241,0.1)',  color: '#818cf8', border: 'rgba(99,102,241,0.25)', label: 'Completada' },
  cancelada:  { bg: 'rgba(230,57,70,0.08)',  color: '#E63946', border: 'rgba(230,57,70,0.2)',   label: 'Cancelada' },
};

function fmt(fecha_hora) {
  const d = new Date(fecha_hora);
  return {
    hora: d.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }),
    fecha: d.toLocaleDateString('es-CR', { weekday: 'short', day: '2-digit', month: 'short' }),
    iso: d.toISOString().split('T')[0],
  };
}

function esHoy(fecha_hora) {
  return new Date(fecha_hora).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
}

function CitaBarbero({ cita, onCompletar }) {
  const est = ESTADO[cita.estado] || ESTADO.pendiente;
  const { hora, fecha } = fmt(cita.fecha_hora);
  const esPendiente = cita.estado === 'pendiente';

  return (
    <div className="anim-item" style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {esPendiente && <div style={{ height: 2, background: 'linear-gradient(90deg, #C9A84C, transparent)' }} />}
      <div style={{ padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Hora */}
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '10px 12px', textAlign: 'center', flexShrink: 0, minWidth: 58,
        }}>
          <p style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: '0.04em', color: '#C9A84C', margin: 0, lineHeight: 1 }}>{hora}</p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '4px 0 0 0', textTransform: 'capitalize' }}>{fecha}</p>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cita.cliente?.nombre || 'Cliente'}
            </p>
            <span style={{ background: est.bg, color: est.color, border: `1px solid ${est.border}`, borderRadius: 100, padding: '2px 9px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
              {est.label}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
            {cita.servicio && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cita.servicio.nombre}</span>
            )}
            {cita.cliente?.telefono && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📱 {cita.cliente.telefono}</span>
            )}
            {cita.servicio && (
              <span style={{ fontSize: 12, color: '#C9A84C', fontWeight: 700 }}>
                ₡{Number(cita.servicio.precio).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Acción */}
        {esPendiente && (
          <button
            onClick={() => onCompletar(cita.id)}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'DM Sans'", flexShrink: 0,
              background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)',
              color: '#4ade80', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,222,128,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(74,222,128,0.1)'}
          >
            Completar
          </button>
        )}
      </div>
    </div>
  );
}

function Grupo({ label, citas, onCompletar }) {
  if (citas.length === 0) return null;
  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: '0.06em', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
        {label} <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>· {citas.length}</span>
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {citas.map(c => (
          <CitaBarbero key={c.id} cita={c} onCompletar={onCompletar} />
        ))}
      </div>
    </div>
  );
}

function DashboardBarbero() {
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/barbero/login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.rol !== 'barbero') { navigate('/login'); return; }
    } catch {
      navigate('/barbero/login');
      return;
    }
    setCargando(true);
    getAgendaBarbero()
      .then(r => setCitas(r.data))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [navigate]);

  const handleCompletar = async (id) => {
    try {
      await completarCitaBarbero(id);
      setCitas(prev => prev.map(c => c.id === id ? { ...c, estado: 'completada' } : c));
      setToastMsg('Cita completada.');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al completar');
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/barbero/login');
  };

  const activas = citas.filter(c => c.estado !== 'cancelada');
  const hoy = activas.filter(c => esHoy(c.fecha_hora));
  const proximas = activas.filter(c => !esHoy(c.fecha_hora));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: '0.08em', color: '#C9A84C' }}>BarberSaaS</span>
            <span style={{ fontSize: 11, color: '#555', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 100, padding: '2px 8px', fontWeight: 700 }}>Barbero</span>
          </div>
          <button
            onClick={cerrarSesion}
            style={{ background: 'none', border: 'none', color: '#8A8A8A', cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans'" }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
        <div className="anim-fadein">
          <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 30, letterSpacing: '0.08em', margin: '0 0 4px 0' }}>
            Mi Agenda
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 28px 0' }}>
            Próximos 7 días
          </p>
        </div>

        {cargando ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', height: 72 }} className="skeleton" />
            ))}
          </div>
        ) : citas.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '40px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 28, margin: '0 0 10px 0' }}>✂️</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>No tenés citas en los próximos 7 días.</p>
          </div>
        ) : (
          <>
            <Grupo label="Hoy" citas={hoy} onCompletar={handleCompletar} />
            <Grupo label="Próximas" citas={proximas} onCompletar={handleCompletar} />
          </>
        )}
      </div>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#4ade80', color: '#0A0A0A', borderRadius: 100,
          padding: '10px 20px', fontSize: 13, fontWeight: 700, zIndex: 9999,
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}

export default DashboardBarbero;
