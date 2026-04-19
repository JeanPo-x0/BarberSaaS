import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { NavLogo } from '../components/LogoLink';
import {
  getBarberosPorBarberia, getServiciosPorBarberia, getBarberia,
  getBarberiaBySlug, buscarOCrearCliente, crearCita, getDisponibilidad,
  getConfigPagosPublica, subirComprobante,
} from '../services/api';
import { formatearInput, formatearTelefono } from '../utils/phone';

// Fecha local (no UTC) para evitar que hoy aparezca en rojo por diferencia de zona horaria
const _hoyD = new Date();
const hoy = `${_hoyD.getFullYear()}-${String(_hoyD.getMonth()+1).padStart(2,'0')}-${String(_hoyD.getDate()).padStart(2,'0')}`;

const STEP_LABELS = ['Barbero', 'Fecha y hora', 'Confirmar'];

function Initials({ name }) {
  const parts = (name || '').split(' ');
  const ini = parts.length >= 2
    ? parts[0][0] + parts[1][0]
    : (name || '?')[0];
  return (
    <div style={{
      width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
      background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Bebas Neue'", fontSize: 17, color: '#C9A84C', letterSpacing: '0.05em',
    }}>
      {ini.toUpperCase()}
    </div>
  );
}

/* ── Calendar Picker ─────────────────────────────────── */
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS  = ['Do','Lu','Ma','Mi','Ju','Vi','Sa'];

function CalendarPicker({ value, onChange, min }) {
  const [open, setOpen]       = useState(false);
  const [view, setView]       = useState(() => {
    const d = value ? new Date(value + 'T12:00:00') : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const ref = useRef(null);

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T12:00:00');
      setView({ year: d.getFullYear(), month: d.getMonth() });
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const minDate   = min ? new Date(min + 'T00:00:00') : null;
  const daysCount = new Date(view.year, view.month + 1, 0).getDate();
  const firstDay  = new Date(view.year, view.month, 1).getDay();

  const isPast = day => {
    if (!minDate) return false;
    const d = new Date(view.year, view.month, day);
    return d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
  };
  const isSel   = day => {
    if (!value) return false;
    const s = new Date(value + 'T12:00:00');
    return s.getFullYear() === view.year && s.getMonth() === view.month && s.getDate() === day;
  };
  const isToday = day => {
    const t = new Date();
    return t.getFullYear() === view.year && t.getMonth() === view.month && t.getDate() === day;
  };

  const prevMonth = () => setView(v => v.month === 0  ? { year: v.year-1, month: 11 } : { ...v, month: v.month-1 });
  const nextMonth = () => setView(v => v.month === 11 ? { year: v.year+1, month: 0  } : { ...v, month: v.month+1 });

  const handleDay = day => {
    if (isPast(day)) return;
    const m = String(view.month + 1).padStart(2,'0');
    const d = String(day).padStart(2,'0');
    onChange(`${view.year}-${m}-${d}`);
    setOpen(false);
  };

  const displayValue = value
    ? new Date(value + 'T12:00:00').toLocaleDateString('es-CR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })
    : null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input-dark"
        style={{
          width: '100%', textAlign: 'left', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          textTransform: 'capitalize',
        }}
      >
        <span>{displayValue || 'Selecciona una fecha'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="anim-slidedown" style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: '#161616', border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: 16, padding: '18px 16px',
          zIndex: 200, boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          minWidth: 280,
        }}>
          {/* Navegación mes */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button type="button" onClick={prevMonth} style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', borderRadius: 8, width: 32, height: 32,
              cursor: 'pointer', fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>‹</button>

            <span style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.07em', color: '#C9A84C' }}>
              {MESES[view.month]} {view.year}
            </span>

            <button type="button" onClick={nextMonth} style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', borderRadius: 8, width: 32, height: 32,
              cursor: 'pointer', fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>›</button>
          </div>

          {/* Cabecera días */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {DIAS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid días */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysCount }).map((_, i) => {
              const day  = i + 1;
              const past = isPast(day);
              const sel  = isSel(day);
              const today = isToday(day);
              return (
                <button key={day} type="button" onClick={() => handleDay(day)} disabled={past}
                  style={{
                    padding: '9px 4px', borderRadius: 9, fontSize: 13, fontWeight: sel ? 700 : 400,
                    cursor: past ? 'default' : 'pointer', fontFamily: "'DM Sans'",
                    border: sel ? '1px solid transparent'
                      : today ? '1px solid rgba(201,168,76,0.55)'
                      : past ? '1px solid rgba(230,57,70,0.2)'
                      : '1px solid transparent',
                    background: sel ? '#C9A84C' : past ? 'rgba(230,57,70,0.06)' : 'transparent',
                    color: sel ? '#0A0A0A' : past ? 'rgba(230,57,70,0.55)' : 'var(--text-primary)',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!past && !sel) e.currentTarget.style.background = 'rgba(201,168,76,0.12)'; }}
                  onMouseLeave={e => { if (!past && !sel) e.currentTarget.style.background = past ? 'rgba(230,57,70,0.06)' : 'transparent'; }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AgendarCita() {
  const { barberia_id, slug } = useParams();
  const [barberia, setBarberia] = useState(null);
  const [barberos, setBarberos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [barberoId, setBarberoId] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [paso, setPaso] = useState(1);
  const [error, setError] = useState('');
  const [confirmado, setConfirmado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [configPagos, setConfigPagos] = useState(null);
  const [metodoPago, setMetodoPago] = useState('');
  const [comprobante, setComprobante] = useState(null);
  const [tcAceptado, setTcAceptado] = useState(false);
  const [tcRechazado, setTcRechazado] = useState(false);

  useEffect(() => {
    const resolveId = slug
      ? getBarberiaBySlug(slug).then(r => { setBarberia(r.data); return r.data.id; })
      : barberia_id
        ? getBarberia(barberia_id).then(r => { setBarberia(r.data); return r.data.id; })
        : Promise.resolve(null);
    resolveId.then(id => {
      if (!id) return;
      getBarberosPorBarberia(id).then(r => setBarberos(r.data));
      getServiciosPorBarberia(id).then(r => setServicios(r.data));
      getConfigPagosPublica(id).then(r => setConfigPagos(r.data)).catch(() => {});
      const yaAcepto = localStorage.getItem(`tc_barberia_${id}`) === 'aceptado';
      setTcAceptado(yaAcepto);
    }).catch(() => {});
  }, [barberia_id, slug]);

  useEffect(() => {
    if (barberoId && fecha) {
      setLoadingSlots(true);
      getDisponibilidad(barberoId, fecha)
        .then(r => setSlots(r.data.slots))
        .finally(() => setLoadingSlots(false));
    } else {
      setSlots([]);
    }
    setHoraSeleccionada('');
  }, [barberoId, fecha]);

  const handleConfirmar = async (e) => {
    e.preventDefault();
    setError('');
    if (configPagos && (configPagos.sinpe_habilitado || configPagos.efectivo_habilitado) && !metodoPago) {
      setError('Seleccioná un método de pago para continuar.');
      return;
    }
    setEnviando(true);
    try {
      const cliente = await buscarOCrearCliente({ nombre, telefono: formatearTelefono(telefono) });
      const nuevaCita = await crearCita({
        fecha_hora: `${fecha}T${horaSeleccionada}:00`,
        barbero_id: parseInt(barberoId),
        servicio_id: parseInt(servicioId),
        cliente_id: cliente.data.id,
        metodo_pago: metodoPago || null,
      });
      if (metodoPago === 'sinpe' && comprobante) {
        const fd = new FormData();
        fd.append('file', comprobante);
        await subirComprobante(nuevaCita.data.id, fd);
      }
      setConfirmado(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al agendar la cita');
    } finally {
      setEnviando(false);
    }
  };

  const resetForm = () => {
    setConfirmado(false); setPaso(1);
    setBarberoId(''); setServicioId(''); setFecha(''); setHoraSeleccionada('');
    setNombre(''); setTelefono(''); setSlots([]);
    setComprobante(null); setMetodoPago('');
  };

  const barberoBusqueda = barberos.find(b => String(b.id) === String(barberoId));
  const servicioBusqueda = servicios.find(s => String(s.id) === String(servicioId));

  const pageWrap = {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    fontFamily: "'DM Sans', sans-serif",
    color: 'var(--text-primary)',
  };

  /* ── Cerrada ───────────────────── */
  if (barberia && !barberia.activa) {
    return (
      <div className="bg-orbs bg-grid-dots" style={{ ...pageWrap, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="anim-scalein" style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '52px 40px', maxWidth: 420, width: '100%', textAlign: 'center',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="#E63946" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: '0.08em', color: '#C9A84C', margin: '0 0 8px 0' }}>
            {barberia.nombre}
          </h2>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            Estamos cerrados temporalmente
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            Vuelve pronto. Estaremos de regreso en breve.
          </p>
        </div>
      </div>
    );
  }

  /* ── Confirmado ───────────────────── */
  const pendienteConfirmacion = metodoPago === 'sinpe' && comprobante;
  if (confirmado) {
    return (
      <div className="bg-orbs bg-grid-dots" style={{ ...pageWrap, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="anim-scalein" style={{
          background: 'var(--bg-card)',
          border: `1px solid ${pendienteConfirmacion ? 'rgba(251,191,36,0.35)' : 'rgba(201,168,76,0.35)'}`,
          borderRadius: 24, padding: '52px 40px', maxWidth: 440, width: '100%', textAlign: 'center',
          boxShadow: '0 0 0 1px rgba(201,168,76,0.1), 0 32px 80px rgba(0,0,0,0.6)',
        }}>
          {/* Icono animado */}
          <div className="pulse-ring-wrapper" style={{ display: 'inline-block', marginBottom: 28 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: pendienteConfirmacion ? 'rgba(251,191,36,0.12)' : 'rgba(201,168,76,0.12)',
              border: `2px solid ${pendienteConfirmacion ? '#fbbf24' : '#C9A84C'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {pendienteConfirmacion ? (
                <svg width="30" height="30" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="10" stroke="#fbbf24" strokeWidth="2"/>
                  <path d="M14 8v7l4 2" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="30" height="30" viewBox="0 0 28 28" fill="none">
                  <path d="M5 14l6 6L23 8" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 34, letterSpacing: '0.08em', color: pendienteConfirmacion ? '#fbbf24' : '#C9A84C', margin: '0 0 10px 0' }}>
            {pendienteConfirmacion ? 'Pendiente de confirmación' : 'Cita confirmada'}
          </h2>
          {pendienteConfirmacion && (
            <p style={{ fontSize: 13, color: '#8A8A8A', margin: '0 0 8px 0', lineHeight: 1.6 }}>
              El barbero revisará tu comprobante y confirmará la cita. Te avisaremos por WhatsApp.
            </p>
          )}

          {/* Resumen */}
          <div style={{
            background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: 14, padding: '16px 20px', margin: '16px 0 24px',
            display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left',
          }}>
            {[
              ['Barbero', barberoBusqueda?.nombre],
              ['Servicio', servicioBusqueda?.nombre],
              ['Fecha', fecha],
              ['Hora', horaSeleccionada],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontWeight: 700, color: '#F5F5F5' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Info de pago si aplica */}
          {metodoPago === 'sinpe' && configPagos?.sinpe_numero && !comprobante && (
            <div style={{
              background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: 12, padding: '14px 16px', margin: '0 0 16px 0', textAlign: 'left',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', letterSpacing: '0.08em', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                Envía tu depósito por SINPE
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 700, margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><rect x="5" y="1" width="8" height="14" rx="1.5" stroke="#C9A84C" strokeWidth="1.4"/><circle cx="9" cy="13" r="0.8" fill="#C9A84C"/></svg>
                {configPagos.sinpe_numero}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                A nombre de: {configPagos.sinpe_nombre}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0 0' }}>
                Tu cita quedará confirmada una vez que el equipo verifique el pago.
              </p>
            </div>
          )}
          {metodoPago === 'efectivo' && (
            <div style={{
              background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: 12, padding: '12px 16px', margin: '0 0 16px 0',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                <rect x="1" y="5" width="16" height="9" rx="1.5" stroke="#4ade80" strokeWidth="1.3"/>
                <circle cx="9" cy="9.5" r="2" stroke="#4ade80" strokeWidth="1.3"/>
                <line x1="1" y1="7.5" x2="3.5" y2="7.5" stroke="#4ade80" strokeWidth="1.3" strokeLinecap="round"/>
                <line x1="1" y1="11.5" x2="3.5" y2="11.5" stroke="#4ade80" strokeWidth="1.3" strokeLinecap="round"/>
                <line x1="14.5" y1="7.5" x2="17" y2="7.5" stroke="#4ade80" strokeWidth="1.3" strokeLinecap="round"/>
                <line x1="14.5" y1="11.5" x2="17" y2="11.5" stroke="#4ade80" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <p style={{ fontSize: 13, color: '#4ade80', margin: 0 }}>
                Pagas en efectivo al llegar al local. Tu cita está reservada.
              </p>
            </div>
          )}

          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 28px 0' }}>
            Te llegara un mensaje de WhatsApp con los detalles de tu cita.
          </p>
          <button onClick={resetForm} className="btn-gold" style={{ width: '100%' }}>
            Agendar otra cita
          </button>
        </div>
      </div>
    );
  }

  /* ── T&C rechazado ───────────────────── */
  if (tcRechazado) {
    return (
      <div className="bg-orbs bg-grid-dots" style={{ ...pageWrap, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="anim-scalein" style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '52px 40px', maxWidth: 420, width: '100%', textAlign: 'center',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#E63946" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: '0.08em', color: '#E63946', margin: '0 0 8px 0' }}>
            Políticas no aceptadas
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 24px 0' }}>
            Para agendar una cita debes aceptar las políticas de la barbería.
          </p>
          <button onClick={() => setTcRechazado(false)} className="btn-gold" style={{ width: '100%' }}>
            Revisar políticas
          </button>
        </div>
      </div>
    );
  }

  /* ── Modal T&C ───────────────────── */
  const mostrarTC = barberia && configPagos && !tcAceptado;

  /* ── Main form ───────────────────── */
  return (
    <div className="bg-orbs bg-grid-dots" style={pageWrap}>

      {/* Modal T&C políticas de la barbería */}
      {mostrarTC && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          padding: '0 0 0 0',
        }}>
          <div className="anim-slideup" style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(201,168,76,0.35)',
            borderRadius: '24px 24px 0 0',
            padding: '32px 28px 40px',
            maxWidth: 520, width: '100%',
            boxShadow: '0 -24px 80px rgba(0,0,0,0.7)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* Pill */}
            <div style={{ width: 36, height: 4, background: 'rgba(201,168,76,0.3)', borderRadius: 99, margin: '0 auto 24px' }} />

            {/* Título */}
            <h2 style={{
              fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: '0.08em',
              color: '#C9A84C', margin: '0 0 4px 0', textAlign: 'center',
            }}>
              Políticas de {barberia.nombre}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', margin: '0 0 24px 0' }}>
              Lee las condiciones antes de agendar tu cita.
            </p>

            {/* Métodos de pago */}
            <div style={{
              background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: 14, padding: '18px 20px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', letterSpacing: '0.08em', margin: 0, textTransform: 'uppercase' }}>
                Métodos de pago aceptados
              </p>
              {configPagos.sinpe_habilitado && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="5" y="1" width="8" height="14" rx="1.5" stroke="#C9A84C" strokeWidth="1.4"/><circle cx="9" cy="13" r="0.8" fill="#C9A84C"/></svg>
                  <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                    SINPE Móvil{configPagos.sinpe_numero ? ` — ${configPagos.sinpe_numero}` : ''}{configPagos.sinpe_nombre ? ` (${configPagos.sinpe_nombre})` : ''}
                  </span>
                </div>
              )}
              {configPagos.efectivo_habilitado && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="5" width="16" height="9" rx="1.5" stroke="#4ade80" strokeWidth="1.3"/><circle cx="9" cy="9.5" r="2" stroke="#4ade80" strokeWidth="1.3"/></svg>
                  <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>Efectivo al llegar</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.5 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="4" width="16" height="11" rx="1.5" stroke="#a78bfa" strokeWidth="1.3"/><path d="M1 8h16" stroke="#a78bfa" strokeWidth="1.3"/><rect x="3" y="10.5" width="4" height="1.5" rx="0.5" fill="#a78bfa"/></svg>
                <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>Tarjeta de crédito / débito</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 100, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Próximamente</span>
              </div>
            </div>

            {/* Adelanto — siempre visible */}
            <div style={{
              background: configPagos.deposito_porcentaje > 0 ? 'rgba(251,191,36,0.06)' : 'rgba(74,222,128,0.04)',
              border: `1px solid ${configPagos.deposito_porcentaje > 0 ? 'rgba(251,191,36,0.25)' : 'rgba(74,222,128,0.2)'}`,
              borderRadius: 14, padding: '14px 18px', marginBottom: 12,
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              {configPagos.deposito_porcentaje > 0 ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="10" cy="10" r="8" stroke="#fbbf24" strokeWidth="1.5"/>
                  <path d="M10 6v5" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round"/>
                  <circle cx="10" cy="14" r="0.8" fill="#fbbf24"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="10" cy="10" r="8" stroke="#4ade80" strokeWidth="1.5"/>
                  <path d="M6.5 10l2.5 2.5 4.5-5" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: configPagos.deposito_porcentaje > 0 ? '#fbbf24' : '#4ade80', margin: '0 0 2px 0' }}>
                  {configPagos.deposito_porcentaje > 0
                    ? `Depósito del ${configPagos.deposito_porcentaje}% requerido al reservar`
                    : 'Sin depósito requerido'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  {configPagos.deposito_porcentaje > 0
                    ? `Debés enviar el comprobante de SINPE al confirmar. El barbero verificará el pago antes de confirmar tu cita.`
                    : 'No tenés que pagar nada por adelantado para reservar tu cita.'}
                </p>
              </div>
            </div>

            {/* Cancelación — siempre visible */}
            <div style={{
              background: configPagos.cancelacion_porcentaje > 0 ? 'rgba(230,57,70,0.06)' : 'rgba(74,222,128,0.04)',
              border: `1px solid ${configPagos.cancelacion_porcentaje > 0 ? 'rgba(230,57,70,0.25)' : 'rgba(74,222,128,0.2)'}`,
              borderRadius: 14, padding: '14px 18px', marginBottom: 12,
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              {configPagos.cancelacion_porcentaje > 0 ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="10" cy="10" r="8" stroke="#E63946" strokeWidth="1.5"/>
                  <path d="M7 7l6 6M13 7l-6 6" stroke="#E63946" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="10" cy="10" r="8" stroke="#4ade80" strokeWidth="1.5"/>
                  <path d="M6.5 10l2.5 2.5 4.5-5" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: configPagos.cancelacion_porcentaje > 0 ? '#E63946' : '#4ade80', margin: '0 0 6px 0' }}>
                  {configPagos.cancelacion_porcentaje > 0
                    ? `Retención del ${configPagos.cancelacion_porcentaje}% en caso de cancelación o no presentación`
                    : 'Reembolso completo al cancelar'}
                </p>
                {configPagos.cancelacion_porcentaje > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                      Al agendar esta cita aceptás que, si la cancelás con poco tiempo de anticipación o no te presentás, <strong style={{ color: '#F5F5F5' }}>se retendrá el {configPagos.cancelacion_porcentaje}% del monto pagado</strong> y solo se te devolverá el {100 - configPagos.cancelacion_porcentaje}% restante.
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                      Ejemplo: si pagaste ₡10,000, recibirías de vuelta ₡{(10000 * (1 - configPagos.cancelacion_porcentaje / 100)).toLocaleString('es-CR')}.
                    </p>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    Si cancelás, se te devuelve el 100% de lo que pagaste, sin ningún cargo adicional.
                  </p>
                )}
              </div>
            </div>

            {/* Puntualidad — fija */}
            <div style={{
              background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.15)',
              borderRadius: 14, padding: '14px 18px', marginBottom: 12,
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="10" cy="10" r="8" stroke="#94a3b8" strokeWidth="1.5"/>
                <path d="M10 6v5l3 2" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', margin: '0 0 2px 0' }}>Puntualidad</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  Si llegás con más de 15 minutos de retraso, tu cita podría cancelarse para no afectar a otros clientes.
                </p>
              </div>
            </div>

            {/* Cómo cancelar */}
            <div style={{
              background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.15)',
              borderRadius: 14, padding: '14px 18px', marginBottom: 24,
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M17 12.5c0 .3-.1.6-.2.9l-1 1.7c-.2.3-.5.4-.8.4H5a3 3 0 01-3-3v-5a3 3 0 013-3h10c1.7 0 3 1.3 3 3v3.2z" stroke="#94a3b8" strokeWidth="1.4"/>
                <path d="M7 9h6M7 12h4" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', margin: '0 0 2px 0' }}>¿Cómo cancelar?</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  Escribí <strong style={{ color: '#F5F5F5' }}>CANCELAR</strong> por WhatsApp al número de la barbería y tu cita quedará cancelada automáticamente.
                </p>
              </div>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setTcRechazado(true)}
                style={{
                  flex: 1, padding: '14px 0', borderRadius: 12, fontSize: 14, fontWeight: 600,
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', cursor: 'pointer',
                }}
              >
                Rechazar
              </button>
              <button
                onClick={() => {
                  localStorage.setItem(`tc_barberia_${barberia.id}`, 'aceptado');
                  setTcAceptado(true);
                }}
                className="btn-gold"
                style={{ flex: 2, padding: '14px 0' }}
              >
                Acepto las políticas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <NavLogo to="/" />
        {barberia && (
          <span style={{
            fontSize: 12, color: 'var(--text-muted)',
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 100, padding: '4px 12px',
            fontWeight: 600,
          }}>
            {barberia.nombre}
          </span>
        )}
      </header>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{
            fontFamily: "'Bebas Neue'", fontSize: 'clamp(34px, 8vw, 46px)',
            letterSpacing: '0.08em', margin: '0 0 6px 0', color: '#C9A84C',
          }}>
            Agendar cita
          </h1>
          {barberia && (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
              {barberia.nombre}
            </p>
          )}
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36, gap: 0 }}>
          {STEP_LABELS.map((label, i) => {
            const num = i + 1;
            const done = paso > num;
            const active = paso === num;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700,
                    background: done ? '#C9A84C' : active ? 'rgba(201,168,76,0.15)' : 'var(--bg-card)',
                    border: `2px solid ${done || active ? '#C9A84C' : 'var(--border)'}`,
                    color: done ? '#0A0A0A' : active ? '#C9A84C' : 'var(--text-muted)',
                    transition: 'all 0.3s',
                  }}>
                    {done ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l3.5 3.5L12 4" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : num}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: active ? '#C9A84C' : 'var(--text-muted)',
                    letterSpacing: '0.04em', whiteSpace: 'nowrap',
                    transition: 'color 0.3s',
                  }}>
                    {label.toUpperCase()}
                  </span>
                </div>
                {i < 2 && (
                  <div style={{
                    flex: 1, height: 2, margin: '0 8px', marginBottom: 22,
                    background: paso > num ? '#C9A84C' : 'rgba(255,255,255,0.08)',
                    borderRadius: 2, transition: 'background 0.3s',
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card contenedor */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: '28px 24px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
        }}>

          {/* ── Paso 1: Barbero + Servicio ── */}
          {paso === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* Barberos */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
                  Elige tu barbero
                </p>
                {barberos.length === 0 ? (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>
                    No hay barberos disponibles.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {barberos.map(b => {
                      const sel = String(barberoId) === String(b.id);
                      return (
                        <button key={b.id}
                          onClick={() => b.activo && setBarberoId(String(b.id))}
                          disabled={!b.activo}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            borderRadius: 14, padding: '14px 16px', textAlign: 'left',
                            border: `1px solid ${sel ? '#C9A84C' : 'var(--border)'}`,
                            background: sel ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.02)',
                            cursor: b.activo ? 'pointer' : 'not-allowed',
                            opacity: b.activo ? 1 : 0.4,
                            transition: 'all 0.2s', fontFamily: "'DM Sans'", width: '100%',
                            boxShadow: sel ? '0 0 0 1px rgba(201,168,76,0.15)' : 'none',
                          }}>
                          <Initials name={b.nombre} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 2px 0', color: sel ? '#C9A84C' : 'var(--text-primary)' }}>
                              {b.nombre}
                            </p>
                            {b.especialidad && (
                              <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>{b.especialidad}</p>
                            )}
                            {!b.activo && (
                              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>No disponible hoy</p>
                            )}
                          </div>
                          {sel && (
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                              <circle cx="9" cy="9" r="8.5" stroke="#C9A84C"/>
                              <path d="M5 9l3 3 5-6" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Servicios */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
                  Elige el servicio
                </p>
                {servicios.length === 0 ? (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>
                    No hay servicios disponibles.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {servicios.map(s => {
                      const sel = String(servicioId) === String(s.id);
                      return (
                        <button key={s.id}
                          onClick={() => s.disponible && setServicioId(String(s.id))}
                          disabled={!s.disponible}
                          style={{
                            borderRadius: 14, padding: '14px 16px', textAlign: 'left',
                            border: `1px solid ${sel ? '#C9A84C' : 'var(--border)'}`,
                            background: sel ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.02)',
                            cursor: s.disponible ? 'pointer' : 'not-allowed',
                            opacity: s.disponible ? 1 : 0.4,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            transition: 'all 0.2s', fontFamily: "'DM Sans'", width: '100%',
                            boxShadow: sel ? '0 0 0 1px rgba(201,168,76,0.15)' : 'none',
                          }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 2px 0', color: sel ? '#C9A84C' : 'var(--text-primary)' }}>
                              {s.nombre}
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
                              {s.duracion_minutos} min
                            </p>
                          </div>
                          <span style={{
                            fontFamily: "'Bebas Neue'", fontSize: 20,
                            color: sel ? '#C9A84C' : 'var(--text-primary)', letterSpacing: '0.05em',
                          }}>
                            ₡{s.precio}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={() => { if (barberoId && servicioId) setPaso(2); }}
                disabled={!barberoId || !servicioId}
                className="btn-gold"
                style={{ width: '100%', opacity: (!barberoId || !servicioId) ? 0.45 : 1 }}
              >
                Siguiente →
              </button>
            </div>
          )}

          {/* ── Paso 2: Fecha y hora ── */}
          {paso === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
                  Fecha
                </p>
                <CalendarPicker value={fecha} onChange={setFecha} min={hoy} />
              </div>

              {fecha && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
                    Horarios disponibles
                  </p>
                  {loadingSlots ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                      Cargando horarios...
                    </div>
                  ) : slots.length === 0 ? (
                    <div style={{
                      background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                      borderRadius: 12, padding: 16, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center',
                    }}>
                      Sin disponibilidad para esta fecha
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                      {slots.map(slot => {
                        const sel = horaSeleccionada === slot.hora;
                        return (
                          <button key={slot.hora}
                            onClick={() => slot.disponible && setHoraSeleccionada(slot.hora)}
                            disabled={!slot.disponible}
                            style={{
                              padding: '10px 4px', borderRadius: 10,
                              cursor: slot.disponible ? 'pointer' : 'not-allowed',
                              border: sel
                                ? '1px solid #C9A84C'
                                : slot.disponible
                                  ? '1px solid var(--border)'
                                  : '1px solid rgba(230,57,70,0.25)',
                              background: sel
                                ? '#C9A84C'
                                : slot.disponible
                                  ? 'rgba(255,255,255,0.02)'
                                  : 'rgba(230,57,70,0.06)',
                              transition: 'all 0.15s', fontFamily: "'DM Sans'",
                              display: 'flex', flexDirection: 'column',
                              alignItems: 'center', justifyContent: 'center', gap: 2,
                            }}>
                            <span style={{
                              fontSize: 13, fontWeight: 700,
                              color: sel ? '#0A0A0A' : slot.disponible ? 'var(--text-primary)' : '#E63946',
                              textDecoration: !slot.disponible ? 'line-through' : 'none',
                            }}>
                              {slot.hora}
                            </span>
                            {!slot.disponible && (
                              <span style={{
                                fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
                                color: 'rgba(230,57,70,0.6)', textTransform: 'uppercase',
                                textDecoration: 'none',
                              }}>
                                Ocupado
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setPaso(1)} className="btn-outline" style={{ flex: 1 }}>
                  ← Atras
                </button>
                <button
                  onClick={() => { if (fecha && horaSeleccionada) setPaso(3); }}
                  disabled={!fecha || !horaSeleccionada}
                  className="btn-gold"
                  style={{ flex: 2, opacity: (!fecha || !horaSeleccionada) ? 0.45 : 1 }}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}

          {/* ── Paso 3: Datos del cliente ── */}
          {paso === 3 && (
            <div>
              {/* Resumen de la cita */}
              <div style={{
                background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: 14, padding: '16px 18px', marginBottom: 24,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#C9A84C', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                  Resumen
                </p>
                {[
                  ['Barbero', barberoBusqueda?.nombre],
                  ['Servicio', servicioBusqueda?.nombre],
                  ['Fecha', fecha],
                  ['Hora', horaSeleccionada],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontWeight: 700, color: '#F5F5F5' }}>{val}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleConfirmar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Método de pago */}
                {configPagos && (configPagos.sinpe_habilitado || configPagos.efectivo_habilitado) && (
                  <div>
                    <style>{`
                      @keyframes signalWave {
                        0%,100%{opacity:0.3;transform:scale(1)}
                        50%{opacity:1;transform:scale(1.08)}
                      }
                      @keyframes billFloat {
                        0%,100%{transform:translateY(0)}
                        50%{transform:translateY(-2px)}
                      }
                    `}</style>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
                      Método de pago
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {configPagos.sinpe_habilitado && (
                        <button type="button"
                          onClick={() => setMetodoPago('sinpe')}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                            border: `1px solid ${metodoPago === 'sinpe' ? '#C9A84C' : 'var(--border)'}`,
                            background: metodoPago === 'sinpe' ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.02)',
                            cursor: 'pointer', fontFamily: "'DM Sans'", width: '100%',
                            transition: 'all 0.2s',
                          }}>
                          {/* SVG teléfono + ondas SINPE */}
                          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
                            <rect x="8" y="3" width="12" height="20" rx="2.5" stroke={metodoPago === 'sinpe' ? '#C9A84C' : '#8A8A8A'} strokeWidth="1.5"/>
                            <circle cx="14" cy="20" r="1" fill={metodoPago === 'sinpe' ? '#C9A84C' : '#8A8A8A'}/>
                            <path d="M5 10.5C6.5 8 9.9 6 14 6s7.5 2 9 4.5" stroke={metodoPago === 'sinpe' ? '#C9A84C' : '#8A8A8A'} strokeWidth="1.4" strokeLinecap="round"
                              style={{ animation: 'signalWave 1.8s ease-in-out infinite', transformOrigin: 'center' }}/>
                            <path d="M7.5 13C8.8 11 11.2 9.5 14 9.5s5.2 1.5 6.5 3.5" stroke={metodoPago === 'sinpe' ? '#C9A84C' : '#8A8A8A'} strokeWidth="1.4" strokeLinecap="round"
                              style={{ animation: 'signalWave 1.8s ease-in-out infinite 0.3s', transformOrigin: 'center' }}/>
                          </svg>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: metodoPago === 'sinpe' ? '#C9A84C' : 'var(--text-primary)' }}>
                              SINPE Móvil
                            </p>
                            {configPagos.deposito_requerido && (
                              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                                Depósito del {configPagos.deposito_porcentaje}% requerido
                              </p>
                            )}
                          </div>
                          {metodoPago === 'sinpe' && (
                            <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <circle cx="9" cy="9" r="8.5" stroke="#C9A84C"/>
                              <path d="M5 9l3 3 5-6" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      )}
                      {configPagos.efectivo_habilitado && (
                        <button type="button"
                          onClick={() => setMetodoPago('efectivo')}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                            border: `1px solid ${metodoPago === 'efectivo' ? '#C9A84C' : 'var(--border)'}`,
                            background: metodoPago === 'efectivo' ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.02)',
                            cursor: 'pointer', fontFamily: "'DM Sans'", width: '100%',
                            transition: 'all 0.2s',
                          }}>
                          {/* SVG billete animado */}
                          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0, animation: 'billFloat 2.2s ease-in-out infinite' }}>
                            <rect x="3" y="8" width="22" height="13" rx="2" stroke={metodoPago === 'efectivo' ? '#C9A84C' : '#8A8A8A'} strokeWidth="1.5"/>
                            <circle cx="14" cy="14.5" r="3" stroke={metodoPago === 'efectivo' ? '#C9A84C' : '#8A8A8A'} strokeWidth="1.4"/>
                            <line x1="3" y1="11" x2="6" y2="11" stroke={metodoPago === 'efectivo' ? '#C9A84C' : '#8A8A8A'} strokeWidth="1.4" strokeLinecap="round"/>
                            <line x1="3" y1="18" x2="6" y2="18" stroke={metodoPago === 'efectivo' ? '#C9A84C' : '#8A8A8A'} strokeWidth="1.4" strokeLinecap="round"/>
                            <line x1="22" y1="11" x2="25" y2="11" stroke={metodoPago === 'efectivo' ? '#C9A84C' : '#8A8A8A'} strokeWidth="1.4" strokeLinecap="round"/>
                            <line x1="22" y1="18" x2="25" y2="18" stroke={metodoPago === 'efectivo' ? '#C9A84C' : '#8A8A8A'} strokeWidth="1.4" strokeLinecap="round"/>
                          </svg>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: metodoPago === 'efectivo' ? '#C9A84C' : 'var(--text-primary)' }}>
                              Efectivo
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Pagas al llegar al local</p>
                          </div>
                          {metodoPago === 'efectivo' && (
                            <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <circle cx="9" cy="9" r="8.5" stroke="#C9A84C"/>
                              <path d="M5 9l3 3 5-6" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      )}
                      {/* Tarjeta — próximamente */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.04)',
                        background: 'rgba(255,255,255,0.01)',
                        opacity: 0.5, cursor: 'not-allowed',
                      }}>
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
                          <rect x="3" y="7" width="22" height="15" rx="2.5" stroke="#8A8A8A" strokeWidth="1.5"/>
                          <line x1="3" y1="12" x2="25" y2="12" stroke="#8A8A8A" strokeWidth="1.5"/>
                          <rect x="6" y="16" width="5" height="3" rx="1" fill="#8A8A8A" opacity="0.5"/>
                        </svg>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: '#8A8A8A' }}>
                            Tarjeta
                          </p>
                          <p style={{ fontSize: 12, color: '#8A8A8A', margin: 0 }}>Próximamente disponible</p>
                        </div>
                        <span style={{
                          marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 7px',
                          borderRadius: 100, background: 'rgba(201,168,76,0.08)',
                          border: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C',
                          letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0,
                        }}>Pronto</span>
                      </div>
                    </div>

                    {/* Campo de comprobante para SINPE */}
                    {metodoPago === 'sinpe' && (
                      <div style={{ marginTop: 12 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                          Comprobante SINPE (opcional)
                        </p>
                        <label style={{
                          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                          padding: '10px 14px', borderRadius: 10,
                          border: `1px dashed ${comprobante ? '#C9A84C' : 'rgba(255,255,255,0.15)'}`,
                          background: comprobante ? 'rgba(201,168,76,0.05)' : 'rgba(255,255,255,0.01)',
                          transition: 'all 0.2s',
                        }}>
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M9 3v9M6 6l3-3 3 3" stroke={comprobante ? '#C9A84C' : '#8A8A8A'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M3 14h12" stroke={comprobante ? '#C9A84C' : '#8A8A8A'} strokeWidth="1.4" strokeLinecap="round"/>
                          </svg>
                          <span style={{ fontSize: 13, color: comprobante ? '#C9A84C' : '#8A8A8A', flex: 1 }}>
                            {comprobante ? comprobante.name : 'Subir foto del comprobante'}
                          </span>
                          {comprobante && (
                            <button type="button" onClick={e => { e.preventDefault(); setComprobante(null); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8A8A', fontSize: 16, lineHeight: 1 }}>
                              ×
                            </button>
                          )}
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={e => setComprobante(e.target.files[0] || null)} />
                        </label>
                        <p style={{ fontSize: 11, color: '#8A8A8A', margin: '6px 0 0 0' }}>
                          Si adjuntás el comprobante, tu cita quedará pendiente de confirmación por el barbero.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                    Nombre completo
                  </p>
                  <input
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder="Tu nombre"
                    required
                    className="input-dark"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                    WhatsApp
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{
                      padding: '0 12px', height: 42, lineHeight: '42px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                      borderRight: 'none', borderRadius: '8px 0 0 8px',
                      fontSize: 13, color: 'var(--text-muted)', flexShrink: 0,
                    }}>
                      +506
                    </span>
                    <input
                      value={telefono}
                      onChange={e => setTelefono(formatearInput(e.target.value))}
                      placeholder="8888 8888"
                      required
                      className="input-dark"
                      style={{ borderRadius: '0 8px 8px 0', flex: 1 }}
                      inputMode="numeric"
                    />
                  </div>
                </div>

                {error && (
                  <div style={{
                    background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.25)',
                    borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#E63946',
                  }}>
                    {error}
                  </div>
                )}

                {/* Política de cancelación */}
                {configPagos && configPagos.cancelacion_porcentaje > 0 && (
                  <div style={{
                    background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
                    borderRadius: 10, padding: '12px 14px',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                    <p style={{ fontSize: 12, color: '#fbbf24', margin: 0, lineHeight: 1.5 }}>
                      <strong>Política de cancelación:</strong> se cobra el {configPagos.cancelacion_porcentaje}% del servicio si cancelás con menos de {configPagos.cancelacion_horas_minimo} horas de anticipación.
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => setPaso(2)} className="btn-outline" style={{ flex: 1 }}>
                    ← Atras
                  </button>
                  <button
                    type="submit"
                    className="btn-gold"
                    disabled={enviando}
                    style={{ flex: 2, opacity: enviando ? 0.7 : 1, cursor: enviando ? 'wait' : 'pointer' }}
                  >
                    {enviando ? 'Confirmando...' : 'Confirmar cita'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AgendarCita;
