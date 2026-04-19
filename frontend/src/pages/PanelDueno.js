import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { formatearInput, formatearTelefono } from '../utils/phone';
import {
  getMisBarberos, crearBarbero, toggleBarbero, eliminarBarbero,
  getMisServicios, crearServicio, toggleServicio, eliminarServicio,
  getMiBarberia, toggleBarberia, crearBarberiaAdicional,
  getEstadoSuscripcion, actualizarSubdominio, eliminarSubdominio,
  getConfigPagos, updateConfigPagos,
} from '../services/api';

/* ── Initials avatar ─────────────────────────────────── */
function Initials({ name, size = 38 }) {
  const parts = (name || '').split(' ');
  const ini = parts.length >= 2 ? parts[0][0] + parts[1][0] : (name || '?')[0];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Bebas Neue'", fontSize: size * 0.42, color: '#C9A84C', letterSpacing: '0.04em',
    }}>
      {ini.toUpperCase()}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────── */
const tabStyle = (activo) => ({
  padding: '8px 18px', borderRadius: 8,
  fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 600,
  cursor: 'pointer', border: 'none',
  background: activo ? '#C9A84C' : 'var(--bg-card)',
  color: activo ? '#0A0A0A' : 'var(--text-muted)',
  transition: 'all 0.2s',
});

const toggleBtn = (activo) => ({
  padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
  cursor: 'pointer', border: 'none', fontFamily: "'DM Sans'",
  background: activo ? 'rgba(74,222,128,0.12)' : 'rgba(251,146,60,0.12)',
  color: activo ? '#4ade80' : '#FB923C',
  transition: 'all 0.2s',
});

const deleteBtn = {
  padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
  cursor: 'pointer', fontFamily: "'DM Sans'",
  background: 'rgba(230,57,70,0.08)',
  border: '1px solid rgba(230,57,70,0.2)',
  color: '#E63946', transition: 'background 0.2s',
};

/* ── Component ───────────────────────────────────────── */
function PanelDueno() {
  const [barberos, setBarberos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [barberias, setBarberias] = useState([]);
  const [suscripcion, setSuscripcion] = useState(null);
  const [tab, setTab] = useState('barberos');
  const navigate = useNavigate();

  // Barbero form
  const [nomBarbero, setNomBarbero] = useState('');
  const [telBarbero, setTelBarbero] = useState('');
  const [espBarbero, setEspBarbero] = useState('');
  const [barberiaBarbero, setBarberiaBarbero] = useState('');

  // Servicio form
  const [nomServicio, setNomServicio] = useState('');
  const [durServicio, setDurServicio] = useState('');
  const [precioServicio, setPrecioServicio] = useState('');
  const [barberias_servicio, setBarberiasServicio] = useState('');

  // Barberia form
  const [mostrarFormBarberia, setMostrarFormBarberia] = useState(false);
  const [nuevaBarberiaForm, setNuevaBarberiaForm] = useState({ nombre: '', direccion: '', telefono: '' });
  const [barberiaError, setBarberiaError] = useState('');
  const [barberiaCargando, setBarberiaCargando] = useState(false);

  // Pagos
  const [configPagos, setConfigPagos] = useState(null);
  const [guardandoPagos, setGuardandoPagos] = useState(false);
  const [configPagosForm, setConfigPagosForm] = useState({
    sinpe_habilitado: true,
    sinpe_numero: '',
    sinpe_nombre: '',
    efectivo_habilitado: true,
    deposito_requerido: false,
    deposito_porcentaje: 50,
    cancelacion_porcentaje: 0,
    cancelacion_horas_minimo: 24,
  });

  // Slug
  const [editandoSlug, setEditandoSlug] = useState(null);
  const [slugInput, setSlugInput] = useState('');
  const [slugError, setSlugError] = useState('');
  const [slugCargando, setSlugCargando] = useState(false);

  const cargarDatos = () => {
    getMisBarberos().then(r => setBarberos(r.data)).catch(() => {});
    getMisServicios().then(r => setServicios(r.data)).catch(() => {});
    getMiBarberia().then(r => setBarberias(r.data)).catch(() => {});
    getEstadoSuscripcion().then(r => setSuscripcion(r.data)).catch(() => {});
    getConfigPagos().then(r => {
      setConfigPagos(r.data);
      setConfigPagosForm(r.data);
    }).catch(() => {});
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    cargarDatos();
  }, [navigate]);

  const handleCrearBarbero = async (e) => {
    e.preventDefault();
    await crearBarbero({ nombre: nomBarbero, telefono: telBarbero ? formatearTelefono(telBarbero) : '', especialidad: espBarbero, barberia_id: parseInt(barberiaBarbero) });
    getMisBarberos().then(r => setBarberos(r.data));
    setNomBarbero(''); setTelBarbero(''); setEspBarbero(''); setBarberiaBarbero('');
  };

  const handleCrearServicio = async (e) => {
    e.preventDefault();
    await crearServicio({ nombre: nomServicio, duracion_minutos: parseInt(durServicio), precio: parseFloat(precioServicio), barberia_id: parseInt(barberias_servicio) });
    getMisServicios().then(r => setServicios(r.data));
    setNomServicio(''); setDurServicio(''); setPrecioServicio(''); setBarberiasServicio('');
  };

  const handleCrearBarberia = async (e) => {
    e.preventDefault();
    setBarberiaError(''); setBarberiaCargando(true);
    try {
      await crearBarberiaAdicional({
        ...nuevaBarberiaForm,
        telefono: nuevaBarberiaForm.telefono ? formatearTelefono(nuevaBarberiaForm.telefono) : '',
      });
      getMiBarberia().then(r => setBarberias(r.data));
      setNuevaBarberiaForm({ nombre: '', direccion: '', telefono: '' });
      setMostrarFormBarberia(false);
    } catch (err) {
      setBarberiaError(err.response?.data?.detail || 'Error al crear la barberia');
    } finally {
      setBarberiaCargando(false);
    }
  };

  const handleGuardarPagos = async (e) => {
    e.preventDefault();
    setGuardandoPagos(true);
    try {
      await updateConfigPagos(configPagosForm);
      getConfigPagos().then(r => { setConfigPagos(r.data); setConfigPagosForm(r.data); });
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al guardar');
    } finally {
      setGuardandoPagos(false);
    }
  };

  const handleEliminarSlug = async (barberiaId) => {
    if (!window.confirm('Eliminar URL personalizada?')) return;
    try {
      await eliminarSubdominio(barberiaId);
      getMiBarberia().then(r => setBarberias(r.data));
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar');
    }
  };

  const handleGuardarSlug = async (barberiaId) => {
    setSlugError(''); setSlugCargando(true);
    try {
      await actualizarSubdominio(barberiaId, slugInput);
      getMiBarberia().then(r => setBarberias(r.data));
      setEditandoSlug(null); setSlugInput('');
    } catch (err) {
      setSlugError(err.response?.data?.detail || 'Error al guardar');
    } finally {
      setSlugCargando(false);
    }
  };

  const LIMITE_PLAN = { basico: 1, pro: 3, premium: null };
  const plan = suscripcion?.plan || 'basico';
  const limiteBarberias = LIMITE_PLAN[plan];
  const puedeAgregarBarberia = limiteBarberias === null || barberias.length < limiteBarberias;

  const sectionCard = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px' };

  return (
    <div className="bg-panel" style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />

      <div className="mobile-px" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <div className="anim-fadein" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: plan !== 'premium' ? 12 : 28 }}>
          <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 32, letterSpacing: '0.08em', margin: 0 }}>
            Panel
          </h1>
          {suscripcion && (
            <span style={{
              background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)',
              borderRadius: 100, padding: '4px 14px',
              fontSize: 12, fontWeight: 700, color: '#C9A84C', textTransform: 'capitalize',
            }}>
              Plan {suscripcion.plan}
            </span>
          )}
        </div>

        {/* Banner Mejorar plan — solo para basico y pro */}
        {suscripcion && plan !== 'premium' && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 12, padding: '12px 18px', marginBottom: 24,
          }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              {plan === 'basico'
                ? 'Pasa a Pro y agrega hasta 3 barberos, historial de clientes y mas.'
                : 'Pasa a Premium y desbloquea barberos ilimitados, reenganche y subdominio propio.'}
            </p>
            <button
              onClick={() => navigate('/planes')}
              className="btn-gold"
              style={{ padding: '7px 16px', fontSize: 12, flexShrink: 0, marginLeft: 14 }}
            >
              Mejorar plan
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {['barberos', 'servicios', 'barberias', 'pagos'].map(t => (
            <button key={t} style={tabStyle(tab === t)} onClick={() => setTab(t)}>
              {t === 'pagos' ? 'Pagos' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Tab Barberos ── */}
        {tab === 'barberos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={sectionCard}>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.06em', margin: '0 0 16px 0' }}>
                Agregar barbero
              </h2>
              <form onSubmit={handleCrearBarbero} className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input value={nomBarbero} onChange={e => setNomBarbero(e.target.value)} placeholder="Nombre *" required
                  className="input-dark" style={{ gridColumn: '1 / -1' }} />
                <div style={{ display: 'flex' }}>
                  <span style={{
                    padding: '0 10px', height: '42px', lineHeight: '42px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRight: 'none', borderRadius: '8px 0 0 8px',
                    fontSize: 12, color: 'var(--text-muted)', flexShrink: 0,
                  }}>+506</span>
                  <input value={telBarbero} onChange={e => setTelBarbero(formatearInput(e.target.value))}
                    placeholder="8888 8888" className="input-dark"
                    style={{ borderRadius: '0 8px 8px 0' }} inputMode="numeric" />
                </div>
                <input value={espBarbero} onChange={e => setEspBarbero(e.target.value)} placeholder="Especialidad" className="input-dark" />
                <select value={barberiaBarbero} onChange={e => setBarberiaBarbero(e.target.value)} required
                  className="input-dark" style={{ gridColumn: '1 / -1', background: 'var(--bg-secondary)' }}>
                  <option value="">Selecciona barberia *</option>
                  {barberias.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
                <button type="submit" className="btn-gold" style={{ gridColumn: '1 / -1' }}>
                  Agregar barbero
                </button>
              </form>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {barberos.map(b => (
                <div key={b.id} className="anim-item panel-item-card" style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'border-color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <Initials name={b.nombre} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 2px 0', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.nombre}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[b.especialidad, b.telefono].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="panel-item-actions" style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => toggleBarbero(b.id).then(() => getMisBarberos().then(r => setBarberos(r.data)))}
                      style={toggleBtn(b.activo)}>
                      {b.activo ? 'Activo' : 'Inactivo'}
                    </button>
                    <button
                      onClick={() => { if (window.confirm(`Eliminar a ${b.nombre}?`)) eliminarBarbero(b.id).then(() => getMisBarberos().then(r => setBarberos(r.data))).catch(err => alert(err.response?.data?.detail || 'Error')); }}
                      style={deleteBtn}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.18)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(230,57,70,0.08)'}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {barberos.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No hay barberos registrados.</p>
              )}
            </div>
          </div>
        )}

        {/* ── Tab Servicios ── */}
        {tab === 'servicios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={sectionCard}>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.06em', margin: '0 0 16px 0' }}>
                Agregar servicio
              </h2>
              <form onSubmit={handleCrearServicio} className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input value={nomServicio} onChange={e => setNomServicio(e.target.value)} placeholder="Nombre del servicio *" required
                  className="input-dark" style={{ gridColumn: '1 / -1' }} />
                <input value={durServicio} onChange={e => setDurServicio(e.target.value)} placeholder="Duracion (min) *" type="number" required className="input-dark" />
                <input value={precioServicio} onChange={e => setPrecioServicio(e.target.value)} placeholder="Precio *" type="number" required className="input-dark" />
                <select value={barberias_servicio} onChange={e => setBarberiasServicio(e.target.value)} required
                  className="input-dark" style={{ gridColumn: '1 / -1', background: 'var(--bg-secondary)' }}>
                  <option value="">Selecciona barberia *</option>
                  {barberias.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
                <button type="submit" className="btn-gold" style={{ gridColumn: '1 / -1' }}>
                  Agregar servicio
                </button>
              </form>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {servicios.map(s => (
                <div key={s.id} className="anim-item panel-item-card" style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'border-color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {/* Icono servicio */}
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/>
                      <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                      <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/>
                      <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 2px 0', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.nombre}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>{s.duracion_minutos} min</p>
                      <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>·</span>
                      <span style={{ fontFamily: "'Bebas Neue'", fontSize: 15, color: '#C9A84C', letterSpacing: '0.05em' }}>
                        ₡{Number(s.precio).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="panel-item-actions" style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => toggleServicio(s.id).then(() => getMisServicios().then(r => setServicios(r.data)))}
                      style={toggleBtn(s.disponible)}>
                      {s.disponible ? 'Disponible' : 'Inactivo'}
                    </button>
                    <button
                      onClick={() => { if (window.confirm(`Eliminar "${s.nombre}"?`)) eliminarServicio(s.id).then(() => getMisServicios().then(r => setServicios(r.data))).catch(err => alert(err.response?.data?.detail || 'Error')); }}
                      style={deleteBtn}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.18)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(230,57,70,0.08)'}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {servicios.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No hay servicios registrados.</p>
              )}
            </div>
          </div>
        )}

        {/* ── Tab Barberias ── */}
        {tab === 'barberias' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {barberias.map(b => (
              <div key={b.id} className="anim-item" style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 2px 0' }}>{b.nombre}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
                      {b.direccion || 'Sin direccion'} &mdash; Plan {b.plan}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleBarberia(b.id).then(() => getMiBarberia().then(r => setBarberias(r.data)))}
                    style={toggleBtn(b.activa)}
                  >
                    {b.activa ? 'Abierta' : 'Cerrada'}
                  </button>
                </div>

                {/* Link por ID */}
                <div style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 12px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 8,
                }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {window.location.origin}/agendar/{b.id}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/agendar/${b.id}`)}
                    style={{ ...deleteBtn, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', flexShrink: 0 }}
                  >
                    Copiar
                  </button>
                </div>

                {/* Link slug */}
                {b.subdominio ? (
                  <div style={{
                    background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)',
                    borderRadius: 8, padding: '8px 12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 8,
                  }}>
                    <span style={{ color: '#C9A84C', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {window.location.origin}/b/{b.subdominio}
                    </span>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/b/${b.subdominio}`)}
                        style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans'", background: '#C9A84C', color: '#0A0A0A', border: 'none' }}>
                        Copiar
                      </button>
                      <button onClick={() => { setEditandoSlug(b.id); setSlugInput(b.subdominio); setSlugError(''); }}
                        style={{ ...deleteBtn, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)' }}>
                        Editar
                      </button>
                      <button onClick={() => handleEliminarSlug(b.id)} style={deleteBtn}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.18)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(230,57,70,0.08)'}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditandoSlug(b.id); setSlugInput(''); setSlugError(''); }}
                    style={{
                      width: '100%', background: 'none', cursor: 'pointer',
                      border: '1px dashed rgba(255,255,255,0.1)',
                      borderRadius: 8, padding: '8px', marginBottom: 8,
                      fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans'",
                      transition: 'border-color 0.2s, color 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    + Configurar link personalizado
                  </button>
                )}

                {/* Editor slug */}
                {editandoSlug === b.id && (
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
                      {window.location.origin}/b/<span style={{ color: '#F5F5F5' }}>{slugInput || 'tu-barberia'}</span>
                    </p>
                    <input
                      value={slugInput}
                      onChange={e => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="mi-barberia"
                      className="input-dark"
                      style={{ marginBottom: 8 }}
                      autoFocus
                    />
                    {slugError && <p style={{ color: '#E63946', fontSize: 12, margin: '0 0 8px 0' }}>{slugError}</p>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { setEditandoSlug(null); setSlugError(''); }} className="btn-outline" style={{ flex: 1, padding: '8px', fontSize: 13 }}>
                        Cancelar
                      </button>
                      <button onClick={() => handleGuardarSlug(b.id)} disabled={slugCargando || slugInput.length < 3} className="btn-gold" style={{ flex: 1, padding: '8px', fontSize: 13 }}>
                        {slugCargando ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {puedeAgregarBarberia ? (
              !mostrarFormBarberia ? (
                <button
                  onClick={() => setMostrarFormBarberia(true)}
                  style={{
                    width: '100%', background: 'none', cursor: 'pointer',
                    border: '1px dashed rgba(255,255,255,0.1)',
                    borderRadius: 14, padding: '18px',
                    fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', fontFamily: "'DM Sans'",
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  + Agregar nueva barberia
                </button>
              ) : (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px' }}>
                  <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.06em', margin: '0 0 16px 0' }}>
                    Nueva barberia
                  </h3>
                  <form onSubmit={handleCrearBarberia} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input value={nuevaBarberiaForm.nombre} onChange={e => setNuevaBarberiaForm({ ...nuevaBarberiaForm, nombre: e.target.value })}
                      placeholder="Nombre *" required className="input-dark" />
                    <input value={nuevaBarberiaForm.direccion} onChange={e => setNuevaBarberiaForm({ ...nuevaBarberiaForm, direccion: e.target.value })}
                      placeholder="Direccion (opcional)" className="input-dark" />
                    <div style={{ display: 'flex' }}>
                      <span style={{
                        padding: '0 10px', height: '42px', lineHeight: '42px',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                        borderRight: 'none', borderRadius: '8px 0 0 8px',
                        fontSize: 12, color: 'var(--text-muted)', flexShrink: 0,
                      }}>+506</span>
                      <input value={nuevaBarberiaForm.telefono}
                        onChange={e => setNuevaBarberiaForm({ ...nuevaBarberiaForm, telefono: formatearInput(e.target.value) })}
                        placeholder="8888 8888 (opcional)" className="input-dark"
                        style={{ borderRadius: '0 8px 8px 0' }} inputMode="numeric" />
                    </div>
                    {barberiaError && <p style={{ color: '#E63946', fontSize: 13, margin: 0 }}>{barberiaError}</p>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => { setMostrarFormBarberia(false); setBarberiaError(''); }} className="btn-outline" style={{ flex: 1 }}>
                        Cancelar
                      </button>
                      <button type="submit" disabled={barberiaCargando} className="btn-gold" style={{ flex: 1, opacity: barberiaCargando ? 0.7 : 1 }}>
                        {barberiaCargando ? 'Creando...' : 'Crear barberia'}
                      </button>
                    </div>
                  </form>
                </div>
              )
            ) : (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '20px', textAlign: 'center',
              }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 8px 0' }}>
                  Tu plan <strong style={{ color: '#C9A84C', textTransform: 'capitalize' }}>{plan}</strong> permite hasta {limiteBarberias} barberia(s).
                </p>
                <button onClick={() => navigate('/planes')} style={{
                  background: 'none', border: 'none', color: '#C9A84C',
                  fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans'", fontWeight: 600,
                }}>
                  Mejorar plan
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'pagos' && (
          <form onSubmit={handleGuardarPagos} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Métodos habilitados */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.06em', margin: '0 0 16px 0' }}>
                Métodos de pago
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Toggle SINPE */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={configPagosForm.sinpe_habilitado}
                    onChange={e => setConfigPagosForm(f => ({ ...f, sinpe_habilitado: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: '#C9A84C' }} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>SINPE Móvil</span>
                </label>
                {/* Toggle efectivo */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={configPagosForm.efectivo_habilitado}
                    onChange={e => setConfigPagosForm(f => ({ ...f, efectivo_habilitado: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: '#C9A84C' }} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Efectivo (paga en el local)</span>
                </label>
              </div>
            </div>

            {/* Configuración SINPE */}
            {configPagosForm.sinpe_habilitado && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
                <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.06em', margin: '0 0 16px 0' }}>
                  Datos SINPE
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input value={configPagosForm.sinpe_numero} onChange={e => setConfigPagosForm(f => ({ ...f, sinpe_numero: e.target.value }))}
                    placeholder="Número de teléfono SINPE (ej: 8888-8888)" className="input-dark" inputMode="numeric" />
                  <input value={configPagosForm.sinpe_nombre} onChange={e => setConfigPagosForm(f => ({ ...f, sinpe_nombre: e.target.value }))}
                    placeholder="Nombre que aparece en SINPE (ej: Juan Pérez)" className="input-dark" />
                </div>
              </div>
            )}

            {/* Depósito */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.06em', margin: '0 0 4px 0' }}>
                Depósito al reservar
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 16px 0' }}>
                Si está activo, el cliente debe enviar un depósito antes de confirmar la cita.
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 12 }}>
                <input type="checkbox" checked={configPagosForm.deposito_requerido}
                  onChange={e => setConfigPagosForm(f => ({ ...f, deposito_requerido: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#C9A84C' }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Requerir depósito</span>
              </label>
              {configPagosForm.deposito_requerido && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Porcentaje del total: {configPagosForm.deposito_porcentaje}%
                  </label>
                  <input type="range" min="10" max="100" step="10"
                    value={configPagosForm.deposito_porcentaje}
                    onChange={e => setConfigPagosForm(f => ({ ...f, deposito_porcentaje: parseInt(e.target.value) }))}
                    style={{ width: '100%', accentColor: '#C9A84C' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    <span>10%</span><span>50%</span><span>100%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Cancelación */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.06em', margin: '0 0 4px 0' }}>
                Política de cancelación
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 16px 0' }}>
                Cobro por cancelaciones fuera del tiempo mínimo de aviso.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Cobro por cancelación: {configPagosForm.cancelacion_porcentaje}%
                  </label>
                  <input type="range" min="0" max="100" step="5"
                    value={configPagosForm.cancelacion_porcentaje}
                    onChange={e => setConfigPagosForm(f => ({ ...f, cancelacion_porcentaje: parseInt(e.target.value) }))}
                    style={{ width: '100%', accentColor: '#C9A84C' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    <span>0% (gratis)</span><span>50%</span><span>100%</span>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Aviso mínimo para cancelar sin cargo (horas)
                  </label>
                  <input type="number" min="1" max="72" value={configPagosForm.cancelacion_horas_minimo}
                    onChange={e => setConfigPagosForm(f => ({ ...f, cancelacion_horas_minimo: parseInt(e.target.value) }))}
                    className="input-dark" style={{ width: 120 }} />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-gold" disabled={guardandoPagos}
              style={{ opacity: guardandoPagos ? 0.7 : 1 }}>
              {guardandoPagos ? 'Guardando...' : 'Guardar configuración de pagos'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default PanelDueno;
