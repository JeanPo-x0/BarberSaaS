import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAgendaBarbero, getHistorialBarbero, actualizarPerfilBarbero, completarCitaBarbero } from '../services/api';
import { formatearInput } from '../utils/phone';

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

function CitaCard({ cita, onCompletar, mostrarFecha }) {
  const est = ESTADO[cita.estado] || ESTADO.pendiente;
  const { hora, fecha } = fmt(cita.fecha_hora);
  const esPendiente = cita.estado === 'pendiente';
  const serviciosExtra = cita.servicios_extra || [];

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
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '10px 12px', textAlign: 'center', flexShrink: 0, minWidth: 58,
        }}>
          <p style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: '0.04em', color: '#C9A84C', margin: 0, lineHeight: 1 }}>{hora}</p>
          {mostrarFecha && <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '4px 0 0 0', textTransform: 'capitalize' }}>{fecha}</p>}
        </div>

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
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {[cita.servicio.nombre, ...serviciosExtra.map(s => s.nombre)].join(' + ')}
              </span>
            )}
            {cita.cliente?.telefono && (
              <a href={`tel:${cita.cliente.telefono}`} style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
                {cita.cliente.telefono}
              </a>
            )}
            {cita.servicio && (
              <span style={{ fontSize: 12, color: '#C9A84C', fontWeight: 700 }}>
                ₡{Number(cita.servicio.precio + serviciosExtra.reduce((acc, s) => acc + s.precio, 0)).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {esPendiente && onCompletar && (
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
        {label} <span style={{ color: 'rgba(255,255,255,0.2)' }}>· {citas.length}</span>
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {citas.map(c => <CitaCard key={c.id} cita={c} onCompletar={onCompletar} mostrarFecha={label !== 'Hoy'} />)}
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" stroke="#94a3b8" strokeWidth="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function FeatureLocked({ titulo, descripcion }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px dashed rgba(148,163,184,0.2)',
      borderRadius: 14, padding: '18px 20px', opacity: 0.7,
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <LockIcon />
      <div>
        <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', margin: '0 0 3px 0' }}>{titulo}</p>
        <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', margin: 0 }}>{descripcion}</p>
      </div>
    </div>
  );
}

function DashboardBarbero() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('agenda');
  const [barberoInfo, setBarberoInfo] = useState(null);

  // Agenda
  const [citas, setCitas] = useState([]);
  const [cargandoAgenda, setCargandoAgenda] = useState(true);

  // Historial
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [historialCargado, setHistorialCargado] = useState(false);

  // Perfil
  const [perfilForm, setPerfilForm] = useState({ nombre: '', telefono: '', especialidad: '' });
  const [perfilCargando, setPerfilCargando] = useState(false);
  const [perfilMsg, setPerfilMsg] = useState('');

  // Toast
  const [toastMsg, setToastMsg] = useState('');

  const toast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/barbero/login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.rol !== 'barbero') { navigate('/login'); return; }
      setBarberoInfo(payload);
    } catch {
      navigate('/barbero/login');
      return;
    }
    setCargandoAgenda(true);
    getAgendaBarbero()
      .then(r => { setCitas(r.data); })
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

  const TABS = [
    { key: 'agenda', label: 'Agenda' },
    { key: 'historial', label: 'Historial' },
    { key: 'perfil', label: 'Mi Perfil' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: '0.08em', color: '#C9A84C' }}>BarberSaaS</span>
              <span style={{ fontSize: 10, color: '#94a3b8', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 100, padding: '2px 8px', fontWeight: 700 }}>BARBERO</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {barberoInfo?.nombre && (
                <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'none' }} className="hide-mobile">{barberoInfo.nombre}</span>
              )}
              <button onClick={cerrarSesion} style={{ background: 'none', border: 'none', color: '#8A8A8A', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans'", padding: 0 }}>
                Cerrar sesión
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)' }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                style={{
                  padding: '10px 18px', background: 'none', border: 'none',
                  borderBottom: tab === t.key ? '2px solid #C9A84C' : '2px solid transparent',
                  color: tab === t.key ? '#C9A84C' : 'var(--text-muted)',
                  fontFamily: "'DM Sans'", fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 24px' }}>

        {/* ── TAB AGENDA ── */}
        {tab === 'agenda' && (
          <div className="anim-fadein">
            {cargandoAgenda ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, height: 76 }} className="skeleton" />
                ))}
              </div>
            ) : citas.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '44px', textAlign: 'center' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 14px auto', display: 'block' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="#4a5568" strokeWidth="1.5"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="#4a5568" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="#4a5568" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="#4a5568" strokeWidth="1.5"/>
                </svg>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>No tenés citas en los próximos 7 días.</p>
              </div>
            ) : (
              <>
                <Grupo label="Hoy" citas={hoy} onCompletar={handleCompletar} />
                <Grupo label="Próximas" citas={proximas} onCompletar={handleCompletar} />
              </>
            )}
          </div>
        )}

        {/* ── TAB HISTORIAL ── */}
        {tab === 'historial' && (
          <div className="anim-fadein">
            {cargandoHistorial ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map(i => <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, height: 76 }} className="skeleton" />)}
              </div>
            ) : historial.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '44px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>No hay citas en los últimos 30 días.</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px 0' }}>Últimas {historial.length} citas (30 días)</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {historial.map(c => <CitaCard key={c.id} cita={c} mostrarFecha={true} />)}
                </div>
              </>
            )}

            {/* Upsell: features premium */}
            <div style={{ marginTop: 28 }}>
              <div style={{
                background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)',
                borderRadius: 14, padding: '18px 20px', marginBottom: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Disponible en plan Pro</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Pedile a tu dueño que active el plan Pro para acceder a estadísticas avanzadas, exportar historial y más.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <FeatureLocked titulo="Estadísticas mensuales" descripcion="Total de citas, ingresos generados, tasa de cancelación y más." />
                <FeatureLocked titulo="Exportar historial" descripcion="Descargá tu historial completo en Excel o PDF." />
                <FeatureLocked titulo="Ranking de clientes frecuentes" descripcion="Identificá a tus mejores clientes automáticamente." />
              </div>
            </div>
          </div>
        )}

        {/* ── TAB PERFIL ── */}
        {tab === 'perfil' && (
          <div className="anim-fadein" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px' }}>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.06em', margin: '0 0 18px 0' }}>Mis datos</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>Nombre</label>
                  <input
                    value={perfilForm.nombre}
                    onChange={e => setPerfilForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Tu nombre"
                    className="input-dark"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>Teléfono</label>
                  <input
                    value={perfilForm.telefono}
                    onChange={e => setPerfilForm(f => ({ ...f, telefono: formatearInput(e.target.value) }))}
                    placeholder="8888 8888"
                    className="input-dark"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>Especialidad</label>
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
                <button
                  onClick={handleGuardarPerfil}
                  disabled={perfilCargando}
                  className="btn-gold"
                  style={{ marginTop: 4, opacity: perfilCargando ? 0.7 : 1 }}
                >
                  {perfilCargando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>

            {/* Upsell perfil público */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.06em', margin: 0 }}>Perfil público</h2>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#C9A84C', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 100, padding: '2px 8px' }}>PRO</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: 0.6 }}>
                <FeatureLocked titulo="Foto de perfil" descripcion="Subí tu foto para aparecer en la página de reservas." />
                <FeatureLocked titulo="Bio / presentación" descripcion="Una descripción breve sobre vos que ven los clientes." />
                <FeatureLocked titulo="Link de reserva personal" descripcion="Los clientes pueden agendar directamente con vos." />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '14px 0 0 0' }}>
                Pedile a tu dueño que active el plan Pro para desbloquear estas funciones.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#4ade80', color: '#0A0A0A', borderRadius: 100,
          padding: '10px 20px', fontSize: 13, fontWeight: 700, zIndex: 9999,
          whiteSpace: 'nowrap',
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}

export default DashboardBarbero;
