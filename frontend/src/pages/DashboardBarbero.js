import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAgendaBarbero, getHistorialBarbero, actualizarPerfilBarbero, completarCitaBarbero, cancelarCitaBarbero } from '../services/api';
import { formatearInput } from '../utils/phone';

const ESTADO = {
  pendiente:  { bg: 'rgba(251,146,60,0.1)',  color: '#FB923C', border: 'rgba(251,146,60,0.25)', label: 'Pendiente' },
  completada: { bg: 'rgba(74,222,128,0.08)', color: '#4ade80', border: 'rgba(74,222,128,0.2)',  label: 'Completada' },
  cancelada:  { bg: 'rgba(230,57,70,0.08)',  color: '#E63946', border: 'rgba(230,57,70,0.2)',   label: 'Cancelada' },
};

const ACCENT_LEFT = {
  pendiente:  '#FB923C',
  completada: '#4ade80',
  cancelada:  '#E63946',
};

function fmt(fecha_hora) {
  const d = new Date(fecha_hora);
  return {
    hora: d.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }),
    fecha: d.toLocaleDateString('es-CR', { weekday: 'short', day: '2-digit', month: 'short' }),
    iso: d.toISOString().split('T')[0],
    diaSemana: d.toLocaleDateString('es-CR', { weekday: 'long' }),
  };
}

function esHoy(fecha_hora) {
  return new Date(fecha_hora).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
}

function CitaCard({ cita, onCompletar, onCancelar, mostrarFecha }) {
  const est = ESTADO[cita.estado] || ESTADO.pendiente;
  const accentColor = ACCENT_LEFT[cita.estado] || ACCENT_LEFT.pendiente;
  const { hora, fecha } = fmt(cita.fecha_hora);
  const esPendiente = cita.estado === 'pendiente';
  const serviciosExtra = cita.servicios_extra || [];
  const totalPrecio = cita.servicio
    ? cita.servicio.precio + serviciosExtra.reduce((acc, s) => acc + s.precio, 0)
    : null;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      overflow: 'hidden',
      display: 'flex',
      transition: 'border-color 0.2s, transform 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Franja de color izquierda */}
      <div style={{ width: 3, background: accentColor, flexShrink: 0, opacity: esPendiente ? 1 : 0.4 }} />

      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Bloque hora */}
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '8px 10px', textAlign: 'center', flexShrink: 0, minWidth: 56,
        }}>
          <p style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.04em', color: '#C9A84C', margin: 0, lineHeight: 1 }}>{hora}</p>
          {mostrarFecha && <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: '4px 0 0 0', textTransform: 'capitalize', lineHeight: 1.2 }}>{fecha}</p>}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cita.cliente?.nombre || 'Cliente'}
            </p>
            <span style={{ background: est.bg, color: est.color, border: `1px solid ${est.border}`, borderRadius: 100, padding: '2px 8px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
              {est.label}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px', alignItems: 'center' }}>
            {cita.servicio && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                  <line x1="20" y1="4" x2="8.12" y2="15.88"/>
                  <line x1="14.47" y1="14.48" x2="20" y2="20"/>
                  <line x1="8.12" y1="8.12" x2="12" y2="12"/>
                </svg>
                {[cita.servicio.nombre, ...serviciosExtra.map(s => s.nombre)].join(' + ')}
              </span>
            )}
            {totalPrecio != null && (
              <span style={{ fontSize: 12, color: '#C9A84C', fontWeight: 700 }}>
                ₡{Number(totalPrecio).toLocaleString()}
              </span>
            )}
            {cita.cliente?.telefono && (
              <a href={`tel:${cita.cliente.telefono}`} style={{ fontSize: 12, color: '#555', textDecoration: 'none' }}>
                {cita.cliente.telefono}
              </a>
            )}
          </div>
        </div>

        {/* Acciones */}
        {esPendiente && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
            {onCompletar && (
              <button onClick={() => onCompletar(cita.id)} style={{
                padding: '5px 11px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'DM Sans'",
                background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)',
                color: '#4ade80', transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,222,128,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(74,222,128,0.1)'}
              >
                Completar
              </button>
            )}
            {onCancelar && (
              <button onClick={() => onCancelar(cita.id)} style={{
                padding: '5px 11px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'DM Sans'",
                background: 'rgba(230,57,70,0.06)', border: '1px solid rgba(230,57,70,0.18)',
                color: '#E63946', transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(230,57,70,0.06)'}
              >
                Cancelar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Grupo({ label, citas, onCompletar, onCancelar, highlight }) {
  if (citas.length === 0) return null;
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        {highlight && <div style={{ width: 3, height: 16, background: '#C9A84C', borderRadius: 2, flexShrink: 0 }} />}
        <p style={{ fontFamily: "'Bebas Neue'", fontSize: 17, letterSpacing: '0.07em', color: highlight ? '#fff' : 'var(--text-muted)', margin: 0 }}>
          {label}
        </p>
        <span style={{
          background: highlight ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)',
          color: highlight ? '#C9A84C' : 'var(--text-muted)',
          border: highlight ? '1px solid rgba(201,168,76,0.25)' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: 100, padding: '1px 8px', fontSize: 11, fontWeight: 700,
        }}>
          {citas.length}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {citas.map(c => <CitaCard key={c.id} cita={c} onCompletar={onCompletar} onCancelar={onCancelar} mostrarFecha={label !== 'Hoy'} />)}
      </div>
    </div>
  );
}

function StatChip({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '12px 16px', flex: 1, minWidth: 0,
    }}>
      <p style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: '0.04em', color: color || '#fff', margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" stroke="#94a3b8" strokeWidth="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function FeatureLocked({ titulo, descripcion }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px dashed rgba(148,163,184,0.15)',
      borderRadius: 12, padding: '14px 16px', opacity: 0.65,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <LockIcon />
      <div>
        <p style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-muted)', margin: '0 0 2px 0' }}>{titulo}</p>
        <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', margin: 0 }}>{descripcion}</p>
      </div>
    </div>
  );
}

function DashboardBarbero() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('agenda');
  const [barberoInfo, setBarberoInfo] = useState(null);

  const [citas, setCitas] = useState([]);
  const [cargandoAgenda, setCargandoAgenda] = useState(true);

  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [historialCargado, setHistorialCargado] = useState(false);

  const [perfilForm, setPerfilForm] = useState({ nombre: '', telefono: '', especialidad: '' });
  const [perfilCargando, setPerfilCargando] = useState(false);
  const [perfilMsg, setPerfilMsg] = useState('');

  const [toastMsg, setToastMsg] = useState('');

  const toast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/barbero/login'); return; }
    try {
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(b64));
      if (payload.rol !== 'barbero') { navigate('/login'); return; }
      // Fallback: tokens viejos sin nombre usan localStorage
      if (!payload.nombre) {
        const ls = JSON.parse(localStorage.getItem('usuario') || '{}');
        payload.nombre = ls.nombre || '';
      }
      setBarberoInfo(payload);
    } catch {
      navigate('/barbero/login');
      return;
    }
    setCargandoAgenda(true);
    getAgendaBarbero()
      .then(r => setCitas(r.data))
      .catch(() => {})
      .finally(() => setCargandoAgenda(false));
  }, [navigate]);

  const handleCompletar = async (id) => {
    try {
      await completarCitaBarbero(id);
      setCitas(prev => prev.map(c => c.id === id ? { ...c, estado: 'completada' } : c));
      toast('Cita marcada como completada.');
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al completar');
    }
  };

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Cancelar esta cita?')) return;
    try {
      await cancelarCitaBarbero(id);
      setCitas(prev => prev.map(c => c.id === id ? { ...c, estado: 'cancelada' } : c));
      toast('Cita cancelada.');
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al cancelar');
    }
  };

  const cargarHistorial = () => {
    if (historialCargado) return;
    setCargandoHistorial(true);
    getHistorialBarbero()
      .then(r => { setHistorial(r.data); setHistorialCargado(true); })
      .catch(() => {})
      .finally(() => setCargandoHistorial(false));
  };

  const handleTabChange = (t) => {
    setTab(t);
    if (t === 'historial') cargarHistorial();
    if (t === 'perfil' && barberoInfo) {
      setPerfilForm({ nombre: barberoInfo.nombre || '', telefono: '', especialidad: '' });
    }
  };

  const handleGuardarPerfil = async () => {
    setPerfilCargando(true); setPerfilMsg('');
    try {
      await actualizarPerfilBarbero({
        nombre: perfilForm.nombre.trim() || undefined,
        telefono: perfilForm.telefono.trim() || null,
        especialidad: perfilForm.especialidad.trim() || null,
      });
      setPerfilMsg('Perfil actualizado.');
      setTimeout(() => setPerfilMsg(''), 3000);
    } catch {
      setPerfilMsg('Error al guardar.');
    } finally {
      setPerfilCargando(false);
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
  const pendientesHoy = hoy.filter(c => c.estado === 'pendiente').length;

  const iniciales = barberoInfo?.nombre
    ? barberoInfo.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const saludo = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  const fechaHoy = new Date().toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' });

  const TABS = [
    { key: 'agenda', label: 'Agenda' },
    { key: 'historial', label: 'Historial' },
    { key: 'perfil', label: 'Mi Perfil' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>

      {/* Fondo: glow dorado + grilla */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {/* Grilla sutil */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* Glow dorado top-center */}
        <div style={{
          position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 400,
          background: 'radial-gradient(ellipse, rgba(201,168,76,0.12) 0%, transparent 70%)',
        }} />
        {/* Fade de la grilla hacia abajo */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 40%, var(--bg-primary) 100%)',
        }} />
      </div>

      {/* Header */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '0 20px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Avatar inicial */}
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))',
                border: '1px solid rgba(201,168,76,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: '0.05em', color: '#C9A84C',
                flexShrink: 0,
              }}>
                {iniciales}
              </div>
              <div>
                <span style={{ fontFamily: "'Bebas Neue'", fontSize: 17, letterSpacing: '0.07em', color: '#fff' }}>
                  {barberoInfo?.nombre || 'Barbero'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 9, color: '#C9A84C', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 100, padding: '1px 6px', fontWeight: 700, letterSpacing: '0.06em' }}>BARBERO</span>
                  <span style={{ fontSize: 10, color: '#444' }}>· BarberSaaS</span>
                </div>
              </div>
            </div>
            <button onClick={cerrarSesion} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8, color: '#555', cursor: 'pointer', fontSize: 12,
              fontFamily: "'DM Sans'", padding: '6px 12px', transition: 'color 0.2s, border-color 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#E63946'; e.currentTarget.style.borderColor = 'rgba(230,57,70,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
            >
              Salir
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => handleTabChange(t.key)} style={{
                padding: '10px 16px', background: 'none', border: 'none',
                borderBottom: tab === t.key ? '2px solid #C9A84C' : '2px solid transparent',
                color: tab === t.key ? '#C9A84C' : 'var(--text-muted)',
                fontFamily: "'DM Sans'", fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1,
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px', position: 'relative', zIndex: 1 }}>

        {/* ── TAB AGENDA ── */}
        {tab === 'agenda' && (
          <div className="anim-fadein">

            {/* Banner de saludo */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.07) 0%, rgba(201,168,76,0.02) 100%)',
              border: '1px solid rgba(201,168,76,0.15)',
              borderRadius: 14, padding: '16px 20px', marginBottom: 20,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
            }}>
              <div>
                <p style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.06em', color: '#C9A84C', margin: '0 0 2px 0' }}>
                  {saludo}{barberoInfo?.nombre ? `, ${barberoInfo.nombre.split(' ')[0]}` : ''}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, textTransform: 'capitalize' }}>{fechaHoy}</p>
              </div>
              {!cargandoAgenda && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: pendientesHoy > 0 ? '#C9A84C' : '#333', margin: 0, lineHeight: 1 }}>{pendientesHoy}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>pendientes hoy</p>
                </div>
              )}
            </div>

            {/* Chips stats */}
            {!cargandoAgenda && citas.length > 0 && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <StatChip label="Hoy" value={hoy.length} color={hoy.length > 0 ? '#FB923C' : '#333'} />
                <StatChip label="Esta semana" value={activas.length} color="#C9A84C" />
                <StatChip label="Completadas" value={citas.filter(c => c.estado === 'completada').length} color="#4ade80" />
              </div>
            )}

            {cargandoAgenda ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, height: 74 }} className="skeleton" />
                ))}
              </div>
            ) : citas.length === 0 ? (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '48px 24px', textAlign: 'center',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="#4a5568" strokeWidth="1.5"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="#4a5568" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="8" y1="2" x2="8" y2="6" stroke="#4a5568" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="3" y1="10" x2="21" y2="10" stroke="#4a5568" strokeWidth="1.5"/>
                  </svg>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 4px 0', fontWeight: 600 }}>Sin citas próximas</p>
                <p style={{ color: '#333', fontSize: 12, margin: 0 }}>No tenés citas en los próximos 7 días.</p>
              </div>
            ) : (
              <>
                <Grupo label="Hoy" citas={hoy} onCompletar={handleCompletar} onCancelar={handleCancelar} highlight={true} />
                <Grupo label="Próximas" citas={proximas} onCompletar={handleCompletar} onCancelar={handleCancelar} />
              </>
            )}
          </div>
        )}

        {/* ── TAB HISTORIAL ── */}
        {tab === 'historial' && (
          <div className="anim-fadein">
            {cargandoHistorial ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map(i => <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, height: 74 }} className="skeleton" />)}
              </div>
            ) : historial.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '44px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>No hay citas en los últimos 30 días.</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px 0' }}>Últimas {historial.length} citas · 30 días</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {historial.map(c => <CitaCard key={c.id} cita={c} mostrarFecha={true} />)}
                </div>
              </>
            )}

            <div style={{ marginTop: 28 }}>
              <div style={{
                background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.12)',
                borderRadius: 14, padding: '16px 18px', marginBottom: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Disponible en plan Premium</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  Pedile a tu dueño que active el plan Premium para acceder a estadísticas avanzadas, exportar historial y más.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <FeatureLocked titulo="Estadísticas mensuales" descripcion="Total de citas, ingresos generados, tasa de cancelación." />
                <FeatureLocked titulo="Exportar historial" descripcion="Descargá tu historial completo en Excel o PDF." />
                <FeatureLocked titulo="Ranking de clientes frecuentes" descripcion="Identificá a tus mejores clientes automáticamente." />
              </div>
            </div>
          </div>
        )}

        {/* ── TAB PERFIL ── */}
        {tab === 'perfil' && (
          <div className="anim-fadein" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Avatar grande */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '24px', textAlign: 'center',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px auto',
                background: 'linear-gradient(135deg, rgba(201,168,76,0.25), rgba(201,168,76,0.05))',
                border: '2px solid rgba(201,168,76,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: '0.05em', color: '#C9A84C',
              }}>
                {iniciales}
              </div>
              <p style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: '0.06em', color: '#fff', margin: '0 0 2px 0' }}>
                {barberoInfo?.nombre || '—'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Barbero · BarberSaaS</p>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 22px' }}>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: '0.06em', margin: '0 0 16px 0' }}>Mis datos</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Nombre</label>
                  <input
                    value={perfilForm.nombre}
                    onChange={e => setPerfilForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Tu nombre"
                    className="input-dark"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Teléfono</label>
                  <input
                    value={perfilForm.telefono}
                    onChange={e => setPerfilForm(f => ({ ...f, telefono: formatearInput(e.target.value) }))}
                    placeholder="8888 8888"
                    className="input-dark"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Especialidad</label>
                  <input
                    value={perfilForm.especialidad}
                    onChange={e => setPerfilForm(f => ({ ...f, especialidad: e.target.value }))}
                    placeholder="Ej: Fades, barba, diseño..."
                    className="input-dark"
                  />
                </div>
                {perfilMsg && (
                  <p style={{ fontSize: 13, color: perfilMsg.includes('Error') ? '#E63946' : '#4ade80', margin: '4px 0 0 0' }}>{perfilMsg}</p>
                )}
                <button onClick={handleGuardarPerfil} disabled={perfilCargando} className="btn-gold" style={{ marginTop: 4, opacity: perfilCargando ? 0.7 : 1 }}>
                  {perfilCargando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: '0.06em', margin: 0 }}>Perfil público</h2>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#C9A84C', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 100, padding: '2px 8px' }}>PREMIUM</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, opacity: 0.6 }}>
                <FeatureLocked titulo="Foto de perfil" descripcion="Subí tu foto para aparecer en la página de reservas." />
                <FeatureLocked titulo="Bio / presentación" descripcion="Una descripción breve sobre vos que ven los clientes." />
                <FeatureLocked titulo="Link de reserva personal" descripcion="Los clientes pueden agendar directamente con vos." />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '12px 0 0 0' }}>
                Pedile a tu dueño que active el plan Premium para desbloquear estas funciones.
              </p>
            </div>

            <button onClick={cerrarSesion} style={{
              background: 'none', border: '1px solid rgba(230,57,70,0.2)',
              borderRadius: 12, color: '#E63946', cursor: 'pointer', fontSize: 13,
              fontFamily: "'DM Sans'", fontWeight: 600, padding: '12px',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#4ade80', color: '#0A0A0A', borderRadius: 100,
          padding: '10px 22px', fontSize: 13, fontWeight: 700, zIndex: 9999,
          whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(74,222,128,0.3)',
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}

export default DashboardBarbero;
