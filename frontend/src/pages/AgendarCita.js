import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { NavLogo } from '../components/LogoLink';
import {
  getBarberosPorBarberia, getServiciosPorBarberia, getBarberia,
  getBarberiaBySlug, buscarOCrearCliente, crearCita, getDisponibilidad,
} from '../services/api';
import { formatearInput, formatearTelefono } from '../utils/phone';

const hoy = new Date().toISOString().split('T')[0];

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
    setEnviando(true);
    try {
      const cliente = await buscarOCrearCliente({ nombre, telefono: formatearTelefono(telefono) });
      await crearCita({
        fecha_hora: `${fecha}T${horaSeleccionada}:00`,
        barbero_id: parseInt(barberoId),
        servicio_id: parseInt(servicioId),
        cliente_id: cliente.data.id,
      });
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
  if (confirmado) {
    return (
      <div className="bg-orbs bg-grid-dots" style={{ ...pageWrap, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="anim-scalein" style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(201,168,76,0.35)',
          borderRadius: 24, padding: '52px 40px', maxWidth: 440, width: '100%', textAlign: 'center',
          boxShadow: '0 0 0 1px rgba(201,168,76,0.1), 0 32px 80px rgba(0,0,0,0.6)',
        }}>
          {/* Icono animado */}
          <div className="pulse-ring-wrapper" style={{ display: 'inline-block', marginBottom: 28 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(201,168,76,0.12)', border: '2px solid #C9A84C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="30" height="30" viewBox="0 0 28 28" fill="none">
                <path d="M5 14l6 6L23 8" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 34, letterSpacing: '0.08em', color: '#C9A84C', margin: '0 0 10px 0' }}>
            Cita confirmada
          </h2>

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

  /* ── Main form ───────────────────── */
  return (
    <div className="bg-orbs bg-grid-dots" style={pageWrap}>

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
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  min={hoy}
                  className="input-dark"
                  style={{ width: '100%' }}
                />
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
                              padding: '11px 4px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                              cursor: slot.disponible ? 'pointer' : 'not-allowed',
                              border: `1px solid ${sel ? '#C9A84C' : slot.disponible ? 'var(--border)' : 'rgba(255,255,255,0.05)'}`,
                              background: sel ? '#C9A84C' : slot.disponible ? 'rgba(255,255,255,0.02)' : 'transparent',
                              color: sel ? '#0A0A0A' : slot.disponible ? 'var(--text-primary)' : 'rgba(255,255,255,0.15)',
                              textDecoration: !slot.disponible ? 'line-through' : 'none',
                              transition: 'all 0.15s', fontFamily: "'DM Sans'",
                            }}>
                            {slot.hora}
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
