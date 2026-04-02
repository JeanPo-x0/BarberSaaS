import { useEffect, useState } from 'react';
import {
  getMisCitas, cancelarCita,
  getMisBarberos, getMisServicios,
  buscarOCrearCliente, crearCita, getDisponibilidad,
} from '../services/api';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const ESTADO_STYLE = {
  pendiente:  { bg: 'rgba(201,168,76,0.12)', color: '#C9A84C',  border: 'rgba(201,168,76,0.3)' },
  confirmada: { bg: 'rgba(74,222,128,0.08)', color: '#4ade80',  border: 'rgba(74,222,128,0.25)' },
  cancelada:  { bg: 'rgba(230,57,70,0.08)',  color: '#E63946',  border: 'rgba(230,57,70,0.2)' },
};

function Agenda() {
  const [citas, setCitas] = useState([]);
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

  const cargarCitas = () => getMisCitas().then(res => setCitas(res.data)).catch(() => {});

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

  const handleCrearCita = async (e) => {
    e.preventDefault();
    setFormError('');
    setCargando(true);
    try {
      const clienteRes = await buscarOCrearCliente({ nombre: clienteNombre, telefono: clienteTelefono });
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

  const citasActivas = citas.filter(c => c.estado !== 'cancelada' && c.estado !== 'completada');
  const hoy = new Date().toISOString().split('T')[0];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar
        links={[
          { label: 'Historial', to: '/historial' },
          { label: 'Panel', to: '/panel' },
          { label: 'Ingresos', to: '/ingresos' },
        ]}
        actions={
          <button
            onClick={() => setMostrarForm(true)}
            className="btn-gold"
            style={{ padding: '7px 16px', fontSize: 13 }}
          >
            + Nueva cita
          </button>
        }
      />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 32, letterSpacing: '0.08em', margin: '0 0 24px 0' }}>
          Agenda
        </h1>

        {/* Formulario nueva cita */}
        {mostrarForm && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '24px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: '0.06em', margin: 0 }}>
                Nueva cita manual
              </h3>
              <button onClick={cerrarForm} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans'",
              }}>
                Cerrar
              </button>
            </div>

            <form onSubmit={handleCrearCita}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Telefono (opcional)</label>
                  <input value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)}
                    placeholder="+506..." className="input-dark" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Fecha</label>
                  <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                    min={hoy} required className="input-dark" />
                </div>
              </div>

              {/* Slots */}
              {slots.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Horario disponible</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 6 }}>
                    {slots.map(slot => (
                      <button
                        key={slot.hora}
                        type="button"
                        onClick={() => slot.disponible && setHora(slot.hora)}
                        disabled={!slot.disponible}
                        style={{
                          padding: '7px 4px',
                          borderRadius: 8,
                          fontSize: 12, fontWeight: 600,
                          cursor: slot.disponible ? 'pointer' : 'not-allowed',
                          border: hora === slot.hora ? '1px solid #C9A84C' : '1px solid var(--border)',
                          background: hora === slot.hora ? '#C9A84C' : 'var(--bg-secondary)',
                          color: hora === slot.hora ? '#0A0A0A' : slot.disponible ? 'var(--text-primary)' : 'var(--text-muted)',
                          opacity: !slot.disponible ? 0.3 : 1,
                          textDecoration: !slot.disponible ? 'line-through' : 'none',
                          transition: 'all 0.15s',
                          fontFamily: "'DM Sans'",
                        }}
                      >
                        {slot.hora}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {barberoId && fecha && slots.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>
                  Selecciona una fecha para ver horarios.
                </p>
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
                <button
                  type="submit"
                  disabled={cargando || !barberoId || !servicioId || !fecha || !hora || !clienteNombre}
                  className="btn-gold"
                  style={{ flex: 1, opacity: (cargando || !barberoId || !servicioId || !fecha || !hora || !clienteNombre) ? 0.5 : 1 }}
                >
                  {cargando ? 'Creando...' : 'Crear cita'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de citas */}
        {citasActivas.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '56px 24px', textAlign: 'center',
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: '0 0 20px 0' }}>
              No hay citas pendientes
            </p>
            <button onClick={() => setMostrarForm(true)} className="btn-gold">
              Crear primera cita
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {citasActivas.map(cita => {
              const est = ESTADO_STYLE[cita.estado] || ESTADO_STYLE.pendiente;
              return (
                <div key={cita.id} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '18px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 15, margin: '0 0 4px 0' }}>
                      Cita #{cita.id}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 8px 0' }}>
                      {new Date(cita.fecha_hora).toLocaleString('es-CR', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    <span style={{
                      background: est.bg, color: est.color,
                      border: `1px solid ${est.border}`,
                      borderRadius: 100, padding: '3px 10px',
                      fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                    }}>
                      {cita.estado}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCancelar(cita.id)}
                    style={{
                      background: 'rgba(230,57,70,0.08)',
                      border: '1px solid rgba(230,57,70,0.25)',
                      color: '#E63946', borderRadius: 8,
                      padding: '8px 16px', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', fontFamily: "'DM Sans'",
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(230,57,70,0.08)'}
                  >
                    Cancelar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Agenda;
