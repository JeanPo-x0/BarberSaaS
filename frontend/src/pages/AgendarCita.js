import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { NavLogo } from '../components/LogoLink';
import {
  getBarberosPorBarberia, getServiciosPorBarberia, getBarberia,
  getBarberiaBySlug, buscarOCrearCliente, crearCita, getDisponibilidad,
} from '../services/api';

const hoy = new Date().toISOString().split('T')[0];

function AgendarCita() {
  const { barberia_id, slug } = useParams();
  const [barberia, setBarberia] = useState(null);
  const [barberiaIdResuelto, setBarberiaIdResuelto] = useState(null);
  const [barberos, setBarberos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [slots, setSlots] = useState([]);
  const [barberoId, setBarberoId] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [paso, setPaso] = useState(1);
  const [error, setError] = useState('');
  const [confirmado, setConfirmado] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const resolveId = slug
      ? getBarberiaBySlug(slug).then(r => { setBarberia(r.data); return r.data.id; })
      : barberia_id
        ? getBarberia(barberia_id).then(r => { setBarberia(r.data); return r.data.id; })
        : Promise.resolve(null);
    resolveId.then(id => {
      if (!id) return;
      setBarberiaIdResuelto(id);
      getBarberosPorBarberia(id).then(r => setBarberos(r.data));
      getServiciosPorBarberia(id).then(r => setServicios(r.data));
    }).catch(() => {});
  }, [barberia_id, slug]);

  useEffect(() => {
    if (barberoId && fecha) {
      getDisponibilidad(barberoId, fecha).then(r => setSlots(r.data.slots));
    } else {
      setSlots([]);
    }
    setHoraSeleccionada('');
  }, [barberoId, fecha]);

  const handleConfirmar = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const cliente = await buscarOCrearCliente({ nombre, telefono });
      await crearCita({
        fecha_hora: `${fecha}T${horaSeleccionada}:00`,
        barbero_id: parseInt(barberoId),
        servicio_id: parseInt(servicioId),
        cliente_id: cliente.data.id,
      });
      setConfirmado(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al agendar la cita');
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
    minHeight: '100vh', background: 'var(--bg-primary)',
    fontFamily: "'DM Sans', sans-serif", color: 'var(--text-primary)',
  };

  // Cerrada
  if (barberia && !barberia.activa) {
    return (
      <div style={{ ...pageWrap, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 18, padding: '48px 36px', maxWidth: 420, textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="#E63946" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: '0.08em', color: '#C9A84C', margin: '0 0 8px 0' }}>
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

  // Confirmado
  if (confirmado) {
    return (
      <div style={{ ...pageWrap, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 18, padding: '48px 36px', maxWidth: 420, textAlign: 'center',
          boxShadow: '0 0 0 1px rgba(201,168,76,0.1), 0 24px 64px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(201,168,76,0.12)', border: '1px solid #C9A84C',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M5 14l6 6L23 8" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 30, letterSpacing: '0.08em', color: '#C9A84C', margin: '0 0 10px 0' }}>
            Cita confirmada
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 28px 0' }}>
            Te llegara un mensaje de WhatsApp con los detalles de tu cita.
          </p>
          <button onClick={resetForm} className="btn-gold" style={{ width: '100%' }}>
            Agendar otra cita
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      {/* Header minimalista para cliente */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
      }}>
        <NavLogo to="/" />
        {barberia && (
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {barberia.nombre}
          </span>
        )}
      </header>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '36px 24px' }}>
        {/* Titulo */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 34, letterSpacing: '0.08em', margin: '0 0 4px 0' }}>
            Agendar cita
          </h1>
          {barberia && (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>{barberia.nombre}</p>
          )}
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: 3, flex: 1, borderRadius: 3,
              background: i <= paso ? '#C9A84C' : 'rgba(255,255,255,0.08)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Paso 1: Barbero + Servicio */}
        {paso === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Barbero */}
            <div>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: '0.06em', margin: '0 0 14px 0' }}>
                Selecciona tu barbero
              </h2>
              {barberos.length === 0 ? (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', color: 'var(--text-muted)', fontSize: 14 }}>
                  No hay barberos disponibles en este momento.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                  {barberos.map(b => {
                    const sel = String(barberoId) === String(b.id);
                    return (
                      <button key={b.id} onClick={() => b.activo && setBarberoId(String(b.id))}
                        disabled={!b.activo}
                        style={{
                          borderRadius: 12, padding: '16px', textAlign: 'left',
                          border: sel ? '1px solid #C9A84C' : '1px solid var(--border)',
                          background: sel ? 'rgba(201,168,76,0.08)' : 'var(--bg-card)',
                          cursor: b.activo ? 'pointer' : 'not-allowed',
                          opacity: b.activo ? 1 : 0.4,
                          transition: 'all 0.2s',
                          fontFamily: "'DM Sans'",
                        }}>
                        <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 2px 0', color: sel ? '#C9A84C' : 'var(--text-primary)' }}>{b.nombre}</p>
                        {b.especialidad && <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>{b.especialidad}</p>}
                        {!b.activo && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>No disponible</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Servicio */}
            <div>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: '0.06em', margin: '0 0 14px 0' }}>
                Selecciona un servicio
              </h2>
              {servicios.length === 0 ? (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', color: 'var(--text-muted)', fontSize: 14 }}>
                  No hay servicios disponibles en este momento.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {servicios.map(s => {
                    const sel = String(servicioId) === String(s.id);
                    return (
                      <button key={s.id} onClick={() => s.disponible && setServicioId(String(s.id))}
                        disabled={!s.disponible}
                        style={{
                          borderRadius: 12, padding: '14px 16px', textAlign: 'left',
                          border: sel ? '1px solid #C9A84C' : '1px solid var(--border)',
                          background: sel ? 'rgba(201,168,76,0.08)' : 'var(--bg-card)',
                          cursor: s.disponible ? 'pointer' : 'not-allowed',
                          opacity: s.disponible ? 1 : 0.4,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          transition: 'all 0.2s', fontFamily: "'DM Sans'",
                        }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 2px 0', color: sel ? '#C9A84C' : 'var(--text-primary)' }}>{s.nombre}</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>{s.duracion_minutos} min</p>
                        </div>
                        <span style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: '#C9A84C', letterSpacing: '0.05em' }}>
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
              style={{ width: '100%', opacity: (!barberoId || !servicioId) ? 0.5 : 1 }}
            >
              Siguiente
            </button>
          </div>
        )}

        {/* Paso 2: Fecha y hora */}
        {paso === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: '0.06em', margin: 0 }}>
              Selecciona fecha y hora
            </h2>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                min={hoy} className="input-dark" />
            </div>
            {slots.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Horarios disponibles
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: 8 }}>
                  {slots.map(slot => (
                    <button key={slot.hora}
                      onClick={() => slot.disponible && setHoraSeleccionada(slot.hora)}
                      disabled={!slot.disponible}
                      style={{
                        padding: '9px 4px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: slot.disponible ? 'pointer' : 'not-allowed',
                        border: horaSeleccionada === slot.hora ? '1px solid #C9A84C' : '1px solid var(--border)',
                        background: horaSeleccionada === slot.hora ? '#C9A84C' : 'var(--bg-card)',
                        color: horaSeleccionada === slot.hora ? '#0A0A0A' : slot.disponible ? 'var(--text-primary)' : 'var(--text-muted)',
                        opacity: !slot.disponible ? 0.3 : 1,
                        textDecoration: !slot.disponible ? 'line-through' : 'none',
                        transition: 'all 0.15s', fontFamily: "'DM Sans'",
                      }}>
                      {slot.hora}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {fecha && slots.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Cargando horarios...</p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPaso(1)} className="btn-outline" style={{ flex: 1 }}>Atras</button>
              <button onClick={() => { if (fecha && horaSeleccionada) setPaso(3); }}
                disabled={!fecha || !horaSeleccionada} className="btn-gold"
                style={{ flex: 1, opacity: (!fecha || !horaSeleccionada) ? 0.5 : 1 }}>
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Paso 3: Datos del cliente */}
        {paso === 3 && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: '0.06em', margin: '0 0 20px 0' }}>
              Tus datos
            </h2>
            <form onSubmit={handleConfirmar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Nombre completo</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder="Tu nombre" required className="input-dark" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>WhatsApp</label>
                <input value={telefono} onChange={e => setTelefono(e.target.value)}
                  placeholder="+50688887777" required className="input-dark" />
              </div>

              {/* Resumen */}
              <div style={{
                background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: 12, padding: '16px',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                {[
                  ['Barbero', barberoBusqueda?.nombre],
                  ['Servicio', servicioBusqueda?.nombre],
                  ['Fecha', fecha],
                  ['Hora', horaSeleccionada],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontWeight: 600, color: '#C9A84C' }}>{val}</span>
                  </div>
                ))}
              </div>

              {error && (
                <div style={{
                  background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.25)',
                  borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#E63946',
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setPaso(2)} className="btn-outline" style={{ flex: 1 }}>Atras</button>
                <button type="submit" className="btn-gold" style={{ flex: 1 }}>Confirmar cita</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default AgendarCita;
