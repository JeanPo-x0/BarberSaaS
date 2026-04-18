import { useEffect, useState } from 'react';
import {
  getMisCitas, cancelarCita, completarCita,
  getMisBarberos, getMisServicios,
  buscarOCrearCliente, crearCita, getDisponibilidad,
} from '../services/api';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { formatearInput, formatearTelefono } from '../utils/phone';

/* ── Helpers ─────────────────────────────────────────── */
const ESTADO = {
  pendiente:  { bg: 'rgba(201,168,76,0.1)',  color: '#C9A84C', border: 'rgba(201,168,76,0.25)', label: 'Pendiente' },
  confirmada: { bg: 'rgba(74,222,128,0.08)', color: '#4ade80', border: 'rgba(74,222,128,0.2)',  label: 'Confirmada' },
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

function esMañana(fecha_hora) {
  const man = new Date(); man.setDate(man.getDate() + 1);
  return new Date(fecha_hora).toISOString().split('T')[0] === man.toISOString().split('T')[0];
}

/* ── Skeleton card ───────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '18px 20px',
      display: 'flex', gap: 16, alignItems: 'center',
    }}>
      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ width: '55%', height: 14 }} />
        <div className="skeleton" style={{ width: '35%', height: 11 }} />
      </div>
      <div className="skeleton" style={{ width: 72, height: 28, borderRadius: 100 }} />
    </div>
  );
}

/* ── Cita card ───────────────────────────────────────── */
function CitaCard({ cita, onCancelar, onCompletar }) {
  const est = ESTADO[cita.estado] || ESTADO.pendiente;
  const { hora, fecha } = fmt(cita.fecha_hora);
  const esPendiente = cita.estado === 'pendiente';

  return (
    <div className="anim-item agenda-cita-card" style={{
      background: 'var(--bg-card)',
      border: `1px solid var(--border)`,
      borderRadius: 14,
      overflow: 'hidden',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)';
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Franja de color por estado (pendiente = dorado) */}
      {esPendiente && (
        <div style={{ height: 2, background: 'linear-gradient(90deg, #C9A84C, transparent)' }} />
      )}

      <div style={{ padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Bloque hora */}
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '10px 12px', textAlign: 'center',
          flexShrink: 0, minWidth: 58,
        }}>
          <p style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: '0.04em', color: '#C9A84C', margin: 0, lineHeight: 1 }}>
            {hora}
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '4px 0 0 0', textTransform: 'capitalize' }}>
            {fecha}
          </p>
        </div>

        {/* Info principal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cita.cliente?.nombre || `Cliente #${cita.cliente_id}`}
            </p>
            <span style={{
              background: est.bg, color: est.color, border: `1px solid ${est.border}`,
              borderRadius: 100, padding: '2px 9px', fontSize: 10, fontWeight: 700,
              flexShrink: 0,
            }}>
              {est.label}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
            {cita.servicio && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/>
                  <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/>
                  <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/>
                </svg>
                {cita.servicio.nombre}
              </span>
            )}
            {cita.barbero && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {cita.barbero.nombre}
              </span>
            )}
            {cita.servicio && (
              <span style={{ fontSize: 12, color: '#C9A84C', fontWeight: 700 }}>
                ₡{cita.servicio.precio.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Acciones — solo desktop (se esconden en mobile con CSS) */}
        {esPendiente && (
          <div className="agenda-card-actions-desktop" style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => onCompletar(cita.id)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'DM Sans'",
                background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
                color: '#4ade80', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,222,128,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(74,222,128,0.08)'}
            >
              Completar
            </button>
            <button
              onClick={() => onCancelar(cita.id)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'DM Sans'",
                background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.2)',
                color: '#E63946', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(230,57,70,0.08)'}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Acciones mobile — fila separada, ancho completo */}
      {esPendiente && (
        <div className="agenda-card-actions-mobile" style={{
          display: 'none',
          borderTop: '1px solid var(--border)',
          padding: '10px 14px',
          gap: 8,
        }}>
          <button
            onClick={() => onCompletar(cita.id)}
            style={{
              flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'DM Sans'",
              background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
              color: '#4ade80', transition: 'background 0.15s',
            }}
          >
            ✓ Completar
          </button>
          <button
            onClick={() => onCancelar(cita.id)}
            style={{
              flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'DM Sans'",
              background: 'rgba(230,57,70,0.06)', border: '1px solid rgba(230,57,70,0.2)',
              color: '#E63946', transition: 'background 0.15s',
            }}
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Seccion con label ───────────────────────────────── */
function Seccion({ label, citas, onCancelar, onCompletar }) {
  if (citas.length === 0) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        margin: '0 0 10px 0',
      }}>
        {label} <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>· {citas.length}</span>
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {citas.map(c => (
          <CitaCard key={c.id} cita={c} onCancelar={onCancelar} onCompletar={onCompletar} />
        ))}
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────── */
function Agenda() {
  const [citas, setCitas] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [cargandoCitas, setCargandoCitas] = useState(true);
  const [barberos, setBarberos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [barberoId, setBarberoId] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [slots, setSlots] = useState([]);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [formError, setFormError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const cargarCitas = () => {
    setCargandoCitas(true);
    getMisCitas()
      .then(res => setCitas(res.data))
      .catch(() => {})
      .finally(() => setCargandoCitas(false));
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    cargarCitas();
    getMisBarberos().then(r => setBarberos(r.data)).catch(() => {});
    getMisServicios().then(r => setServicios(r.data)).catch(() => {});
  }, [navigate]);

  useEffect(() => {
    if (barberoId && fecha) {
      getDisponibilidad(barberoId, fecha).then(r => setSlots(r.data.slots)).catch(() => setSlots([]));
    } else {
      setSlots([]);
    }
    setHora('');
  }, [barberoId, fecha]);

  const handleCancelar = async (id) => {
    if (!window.confirm('Cancelar esta cita?')) return;
    await cancelarCita(id);
    cargarCitas();
  };

  const handleCompletar = async (id) => {
    await completarCita(id);
    cargarCitas();
    setToastMsg('Cita completada. WhatsApp enviado al cliente.');
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleCrearCita = async (e) => {
    e.preventDefault();
    setFormError('');
    setCargando(true);
    try {
      const clienteRes = await buscarOCrearCliente({
        nombre: clienteNombre,
        telefono: clienteTelefono ? formatearTelefono(clienteTelefono) : '',
      });
      await crearCita({
        fecha_hora: `${fecha}T${hora}:00`,
        barbero_id: parseInt(barberoId),
        servicio_id: parseInt(servicioId),
        cliente_id: clienteRes.data.id,
      });
      cerrarForm();
      cargarCitas();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Error al crear la cita');
    } finally {
      setCargando(false);
    }
  };

  const cerrarForm = () => {
    setMostrarForm(false); setFormError('');
    setBarberoId(''); setServicioId(''); setFecha(''); setHora('');
    setClienteNombre(''); setClienteTelefono(''); setSlots([]);
  };

  // Agrupar citas activas
  const activas = citas.filter(c => c.estado !== 'cancelada' && c.estado !== 'completada');
  const hoy     = activas.filter(c => esHoy(c.fecha_hora));
  const manana  = activas.filter(c => esMañana(c.fecha_hora));
  const futuras = activas.filter(c => !esHoy(c.fecha_hora) && !esMañana(c.fecha_hora));

  // Stats
  const totalHoy = hoy.length;
  const proximaCita = activas[0];
  const ingresosHoy = hoy.reduce((sum, c) => sum + (c.servicio?.precio || 0), 0);
  const hoyStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-panel" style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Toast WhatsApp enviado */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 999, background: '#1A1A1A', border: '1px solid rgba(74,222,128,0.3)',
          borderRadius: 12, padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          animation: 'fadeup 0.25s ease',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.17 1.6 5.98L0 24l6.18-1.57A11.96 11.96 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.22-3.48-8.52z" fill="#25D366"/>
            <path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97s-.47-.15-.67.15-.77.97-.94 1.17-.35.22-.65.07c-.3-.15-1.27-.47-2.42-1.49-.89-.8-1.5-1.78-1.67-2.08s-.02-.46.13-.61c.13-.13.3-.35.45-.52s.2-.3.3-.5.05-.37-.03-.52-.67-1.62-.92-2.22c-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37s-1.04 1.02-1.04 2.48 1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.62.72.23 1.37.2 1.88.12.57-.09 1.77-.72 2.02-1.42s.25-1.3.17-1.42c-.07-.12-.27-.2-.57-.35z" fill="#fff"/>
          </svg>
          <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 600 }}>{toastMsg}</span>
        </div>
      )}

      <Navbar
        actions={
          <div className="pulse-ring-wrapper" style={{ display: 'inline-flex' }}>
            <button onClick={() => setMostrarForm(true)} className="btn-gold" style={{ padding: '7px 16px', fontSize: 13 }}>
              + Nueva cita
            </button>
          </div>
        }
      />

      <div className="mobile-px" style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header + stats */}
        <div className="anim-fadeup" style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 34, letterSpacing: '0.08em', margin: '0 0 20px 0' }}>
            Agenda
          </h1>
          <div className="stats-grid-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Citas hoy', value: cargandoCitas ? '—' : totalHoy },
              { label: 'Ingresos hoy', value: cargandoCitas ? '—' : `₡${ingresosHoy.toLocaleString()}` },
              { label: 'Proxima', value: cargandoCitas ? '—' : proximaCita ? fmt(proximaCita.fecha_hora).hora : 'Ninguna' },
            ].map(({ label, value }) => (
              <div key={label} className="anim-scalein" style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '14px 16px',
              }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {label}
                </p>
                <p style={{ fontFamily: "'Bebas Neue'", fontSize: 24, color: '#C9A84C', margin: 0, letterSpacing: '0.04em' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario nueva cita */}
        {mostrarForm && (
          <div className="anim-slidedown" style={{
            background: 'var(--bg-card)', border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 16, padding: '24px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: '0.06em', margin: 0 }}>
                Nueva cita manual
              </h3>
              <button onClick={cerrarForm} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4,
              }}>×</button>
            </div>

            <form onSubmit={handleCrearCita}>
              <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Barbero</label>
                  <select value={barberoId} onChange={e => setBarberoId(e.target.value)} required
                    className="input-dark" style={{ background: 'var(--bg-secondary)' }}>
                    <option value="">Selecciona barbero</option>
                    {barberos.filter(b => b.activo).map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Servicio</label>
                  <select value={servicioId} onChange={e => setServicioId(e.target.value)} required
                    className="input-dark" style={{ background: 'var(--bg-secondary)' }}>
                    <option value="">Selecciona servicio</option>
                    {servicios.filter(s => s.disponible).map(s => (
                      <option key={s.id} value={s.id}>{s.nombre} — ₡{s.precio}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Nombre del cliente</label>
                  <input value={clienteNombre} onChange={e => setClienteNombre(e.target.value)}
                    placeholder="Nombre completo" required className="input-dark" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>WhatsApp (opcional)</label>
                  <div style={{ display: 'flex' }}>
                    <span style={{
                      padding: '0 10px', height: '42px', lineHeight: '42px',
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      borderRight: 'none', borderRadius: '8px 0 0 8px',
                      fontSize: 12, color: 'var(--text-muted)', flexShrink: 0,
                    }}>+506</span>
                    <input value={clienteTelefono}
                      onChange={e => setClienteTelefono(formatearInput(e.target.value))}
                      placeholder="8888 8888" className="input-dark"
                      style={{ borderRadius: '0 8px 8px 0' }} inputMode="numeric" />
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Fecha</label>
                  <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                    min={hoyStr} required className="input-dark" />
                </div>
              </div>

              {/* Slots */}
              {slots.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Horario disponible</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 6 }}>
                    {slots.map(slot => {
                      const ocupado = !slot.disponible;
                      const seleccionado = hora === slot.hora;
                      return (
                        <button key={slot.hora} type="button"
                          onClick={() => !ocupado && setHora(slot.hora)}
                          disabled={ocupado}
                          title={ocupado ? 'Horario ocupado' : ''}
                          style={{
                            padding: '7px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                            cursor: ocupado ? 'not-allowed' : 'pointer',
                            border: seleccionado ? '1px solid #C9A84C'
                              : ocupado ? '1px solid rgba(230,57,70,0.4)'
                              : '1px solid var(--border)',
                            background: seleccionado ? '#C9A84C'
                              : ocupado ? 'rgba(230,57,70,0.1)'
                              : 'var(--bg-secondary)',
                            color: seleccionado ? '#0A0A0A'
                              : ocupado ? '#E63946'
                              : 'var(--text-primary)',
                            transition: 'all 0.15s', fontFamily: "'DM Sans'",
                          }}>
                          {slot.hora}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {formError && (
                <div style={{
                  marginTop: 12, background: 'rgba(230,57,70,0.08)',
                  border: '1px solid rgba(230,57,70,0.25)', borderRadius: 8,
                  padding: '8px 12px', fontSize: 13, color: '#E63946',
                }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={cerrarForm} className="btn-outline" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit"
                  disabled={cargando || !barberoId || !servicioId || !fecha || !hora || !clienteNombre}
                  className="btn-gold"
                  style={{ flex: 1, opacity: (cargando || !barberoId || !servicioId || !fecha || !hora || !clienteNombre) ? 0.5 : 1 }}>
                  {cargando ? 'Creando...' : 'Crear cita'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de citas */}
        {cargandoCitas ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : activas.length === 0 ? (
          <div className="anim-fadeup" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '56px 24px', textAlign: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
            </div>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15, margin: '0 0 6px 0' }}>
              Sin citas pendientes
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 20px 0' }}>
              Agrega la primera cita del dia
            </p>
            <button onClick={() => setMostrarForm(true)} className="btn-gold" style={{ padding: '10px 24px' }}>
              + Nueva cita
            </button>
          </div>
        ) : (
          <>
            <Seccion label="Hoy"    citas={hoy}     onCancelar={handleCancelar} onCompletar={handleCompletar} />
            <Seccion label="Manana" citas={manana}   onCancelar={handleCancelar} onCompletar={handleCompletar} />
            <Seccion label="Proximas" citas={futuras} onCancelar={handleCancelar} onCompletar={handleCompletar} />
          </>
        )}
      </div>
    </div>
  );
}

export default Agenda;
