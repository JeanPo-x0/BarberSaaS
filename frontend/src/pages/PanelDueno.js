import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { formatearInput, formatearTelefono } from '../utils/phone';
import {
  getMisBarberos, crearBarbero, toggleBarbero, eliminarBarbero, invitarBarbero, editarBarbero,
  getMisServicios, crearServicio, toggleServicio, editarServicio, eliminarServicio,
  getMiBarberia, toggleBarberia, crearBarberiaAdicional,
  getEstadoSuscripcion, actualizarSubdominio, eliminarSubdominio, actualizarMapsLink, actualizarTelefonoBarberia, forzarSyncSuscripcion,
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

  // Editar servicio
  const [editandoServicio, setEditandoServicio] = useState(null);
  const [editServicioForm, setEditServicioForm] = useState({ nombre: '', duracion_minutos: '', precio: '' });
  const [editServicioCargando, setEditServicioCargando] = useState(false);
  const [editServicioError, setEditServicioError] = useState('');

  // Barberia form
  const [mostrarFormBarberia, setMostrarFormBarberia] = useState(false);
  const [nuevaBarberiaForm, setNuevaBarberiaForm] = useState({ nombre: '', direccion: '', telefono: '' });
  const [barberiaError, setBarberiaError] = useState('');
  const [barberiaCargando, setBarberiaCargando] = useState(false);

  // Pagos
  const [, setConfigPagos] = useState(null);
  const [guardandoPagos, setGuardandoPagos] = useState(false);
  const [pagoGuardado, setPagoGuardado] = useState(false);
  const [editandoSinpe, setEditandoSinpe] = useState(false);
  const [configPagosForm, setConfigPagosForm] = useState({
    sinpe_habilitado: true,
    sinpe_numero: '',
    sinpe_nombre: '',
    efectivo_habilitado: true,
    tarjeta_habilitado: false,
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

  // Maps link
  const [editandoMaps, setEditandoMaps] = useState(null);
  const [mapsInput, setMapsInput] = useState('');
  const [mapsError, setMapsError] = useState('');
  const [mapsCargando, setMapsCargando] = useState(false);

  // Teléfono barbería
  const [editandoTelBarberia, setEditandoTelBarberia] = useState(null);
  const [telBarberiaInput, setTelBarberiaInput] = useState('');
  const [telBarberiaError, setTelBarberiaError] = useState('');
  const [telBarberiaCargando, setTelBarberiaCargando] = useState(false);

  // Invitar barbero
  const [invitandoBarbero, setInvitandoBarbero] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteCargando, setInviteCargando] = useState(false);
  const [inviteExito, setInviteExito] = useState('');

  // Editar barbero
  const [editandoBarbero, setEditandoBarbero] = useState(null);
  const [editBarberoForm, setEditBarberoForm] = useState({ nombre: '', telefono: '', especialidad: '' });
  const [editBarberoError, setEditBarberoError] = useState('');
  const [editBarberoCargando, setEditBarberoCargando] = useState(false);

  // Link copiado
  const [linkCopiado, setLinkCopiado] = useState(null);

  const handleForzarSync = async () => {
    try {
      await forzarSyncSuscripcion();
      getEstadoSuscripcion().then(r => setSuscripcion(r.data)).catch(() => {});
    } catch (e) {}
  };

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
    if (!localStorage.getItem('usuario')) { navigate('/login'); return; }
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

  const handleEditarServicio = async (id) => {
    setEditServicioCargando(true); setEditServicioError('');
    try {
      await editarServicio(id, {
        nombre: editServicioForm.nombre.trim() || undefined,
        duracion_minutos: editServicioForm.duracion_minutos ? parseInt(editServicioForm.duracion_minutos) : undefined,
        precio: editServicioForm.precio !== '' ? parseFloat(editServicioForm.precio) : undefined,
      });
      getMisServicios().then(r => setServicios(r.data));
      setEditandoServicio(null);
    } catch (err) {
      setEditServicioError(err.response?.data?.detail || 'Error al guardar');
    } finally {
      setEditServicioCargando(false);
    }
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
      setEditandoSinpe(false);
      setPagoGuardado(true);
      setTimeout(() => setPagoGuardado(false), 3000);
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

  const handleGuardarTelBarberia = async (barberiaId) => {
    setTelBarberiaError(''); setTelBarberiaCargando(true);
    try {
      const tel = formatearTelefono(telBarberiaInput);
      await actualizarTelefonoBarberia(barberiaId, tel);
      getMiBarberia().then(r => setBarberias(r.data));
      setEditandoTelBarberia(null); setTelBarberiaInput('');
    } catch (err) {
      setTelBarberiaError(err.response?.data?.detail || 'Error al guardar');
    } finally {
      setTelBarberiaCargando(false);
    }
  };

  const handleGuardarMaps = async (barberiaId) => {
    setMapsError(''); setMapsCargando(true);
    try {
      await actualizarMapsLink(barberiaId, mapsInput.trim() || null);
      getMiBarberia().then(r => setBarberias(r.data));
      setEditandoMaps(null); setMapsInput('');
    } catch (err) {
      const det = err.response?.data?.detail;
      setMapsError(Array.isArray(det) ? (det[0]?.msg || 'URL no válida') : (typeof det === 'string' ? det : 'URL no válida. Usa un link de Google Maps o Waze.'));
    } finally {
      setMapsCargando(false);
    }
  };

  const handleEditarBarbero = async (barberoId) => {
    setEditBarberoError(''); setEditBarberoCargando(true);
    try {
      await editarBarbero(barberoId, {
        nombre: editBarberoForm.nombre.trim(),
        telefono: editBarberoForm.telefono.trim() || null,
        especialidad: editBarberoForm.especialidad.trim() || null,
      });
      getMisBarberos().then(r => setBarberos(r.data));
      setEditandoBarbero(null);
    } catch (err) {
      const det = err.response?.data?.detail;
      setEditBarberoError(typeof det === 'string' ? det : 'Error al guardar');
    } finally {
      setEditBarberoCargando(false);
    }
  };

  const copiarLinkBarbero = (barberoId) => {
    const link = `${window.location.origin}/barbero/login`;
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopiado(barberoId);
      setTimeout(() => setLinkCopiado(null), 2000);
    });
  };

  const handleInvitar = async (barberoId) => {
    setInviteError(''); setInviteCargando(true);
    try {
      await invitarBarbero(barberoId, inviteEmail.trim().toLowerCase());
      setInviteExito(`Invitación enviada a ${inviteEmail}`);
      setInvitandoBarbero(null); setInviteEmail('');
      setTimeout(() => setInviteExito(''), 5000);
    } catch (err) {
      const det = err.response?.data?.detail;
      setInviteError(typeof det === 'string' ? det : 'Error al enviar la invitación');
    } finally {
      setInviteCargando(false);
    }
  };

  const LIMITE_PLAN = { basico: 1, pro: 3, premium: null };
  const plan = suscripcion?.plan || 'basico';
  const estadoSus = suscripcion?.estado || 'trial';
  const suspendida = estadoSus === 'suspendida' || estadoSus === 'cancelada';
  const limiteBarberias = LIMITE_PLAN[plan];
  const puedeAgregarBarberia = limiteBarberias === null || barberias.length < limiteBarberias;

  const sectionCard = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px' };

  if (suspendida) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 32, letterSpacing: '0.08em', color: '#fff', margin: '0 0 12px' }}>Suscripción requerida</h1>
        <p style={{ color: '#666', fontSize: 14, margin: '0 0 28px', lineHeight: 1.7 }}>
          Tu período de prueba ha finalizado. Elige un plan para seguir usando BarberSaaS.
        </p>
        <button onClick={() => navigate('/planes')} className="btn-gold" style={{ padding: '13px 32px', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Ver planes
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: 'slide-right 1.2s ease-in-out infinite' }}>
            <path d="M5 12h14M13 6l6 6-6 6"/>
          </svg>
          <style>{`@keyframes slide-right { 0%,100%{transform:translateX(0)} 50%{transform:translateX(4px)} }`}</style>
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-panel" style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Spacer que ocupa el ancho del sidebar fijo — solo en desktop */}
        <div className="hidden md:block" style={{ width: 220, flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
      <div className="mobile-px" style={{ maxWidth: 860, padding: '32px 32px' }}>
        <div className="anim-fadein" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: plan !== 'premium' ? 12 : 28 }}>
          <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 32, letterSpacing: '0.08em', margin: 0 }}>
            Panel
          </h1>
          {suscripcion && plan !== 'basico' && (
            <span style={{
              background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)',
              borderRadius: 100, padding: '4px 14px',
              fontSize: 12, fontWeight: 700, color: '#C9A84C', textTransform: 'capitalize',
            }}>
              {plan === 'pro' ? 'Pro' : 'Premium'}
            </span>
          )}
          {suscripcion && plan === 'basico' && estadoSus === 'trial' && (
            <span style={{
              background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
              borderRadius: 100, padding: '4px 14px',
              fontSize: 12, fontWeight: 700, color: '#fbbf24',
            }}>
              Trial
            </span>
          )}
        </div>

        {/* Banner Mejorar plan — solo para pro */}
        {suscripcion && plan === 'pro' && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 12, padding: '12px 18px', marginBottom: 24,
          }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              Pasa a Premium y desbloquea barberos ilimitados, reenganche y subdominio propio.
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
                <div key={b.id}>
                <div className="anim-item panel-item-card" style={{
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
                      {b.email
                        ? (b.cuenta_activa ? `✓ ${b.email}` : `⏳ Invitación pendiente`)
                        : [b.especialidad, b.telefono].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="panel-item-actions" style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {/* Lápiz editar */}
                    <button
                      title="Editar datos"
                      onClick={() => { setEditandoBarbero(b.id); setEditBarberoForm({ nombre: b.nombre, telefono: b.telefono || '', especialidad: b.especialidad || '' }); setEditBarberoError(''); setInvitandoBarbero(null); }}
                      style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {/* Link copiable */}
                    <button
                      title="Copiar link de acceso"
                      onClick={() => copiarLinkBarbero(b.id)}
                      style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: linkCopiado === b.id ? 'rgba(74,222,128,0.1)' : 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'all 0.2s' }}
                    >
                      {linkCopiado === b.id
                        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="#94a3b8" strokeWidth="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/></svg>
                      }
                    </button>
                    {!b.cuenta_activa && (
                      <button
                        onClick={() => { setInvitandoBarbero(b.id); setInviteEmail(b.email || ''); setInviteError(''); setEditandoBarbero(null); }}
                        style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans'", background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#C9A84C', transition: 'all 0.2s' }}
                      >
                        {b.email ? 'Reenviar' : 'Invitar'}
                      </button>
                    )}
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

                {/* Panel editar datos */}
                {editandoBarbero === b.id && (
                  <div style={{ marginTop: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>Editar datos del barbero</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input value={editBarberoForm.nombre} onChange={e => setEditBarberoForm(f => ({ ...f, nombre: e.target.value }))}
                        placeholder="Nombre *" className="input-dark" />
                      <input value={editBarberoForm.telefono} onChange={e => setEditBarberoForm(f => ({ ...f, telefono: formatearInput(e.target.value) }))}
                        placeholder="Teléfono (opcional)" className="input-dark" inputMode="numeric" />
                      <input value={editBarberoForm.especialidad} onChange={e => setEditBarberoForm(f => ({ ...f, especialidad: e.target.value }))}
                        placeholder="Especialidad (opcional)" className="input-dark" />
                    </div>
                    {editBarberoError && <p style={{ color: '#E63946', fontSize: 12, margin: '8px 0 0 0' }}>{editBarberoError}</p>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button onClick={() => setEditandoBarbero(null)} className="btn-outline" style={{ flex: 1, padding: '8px', fontSize: 13 }}>Cancelar</button>
                      <button onClick={() => handleEditarBarbero(b.id)} disabled={editBarberoCargando || !editBarberoForm.nombre.trim()} className="btn-gold" style={{ flex: 1, padding: '8px', fontSize: 13, opacity: (editBarberoCargando || !editBarberoForm.nombre.trim()) ? 0.7 : 1 }}>
                        {editBarberoCargando ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Panel invitar */}
                {invitandoBarbero === b.id && (
                  <div style={{ marginTop: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                      El barbero recibirá un email para activar su cuenta y ver su agenda.
                    </p>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={e => { setInviteEmail(e.target.value); setInviteError(''); }}
                      placeholder="Email del barbero"
                      className="input-dark"
                      style={{ marginBottom: 8 }}
                      autoFocus
                    />
                    {inviteError && <p style={{ color: '#E63946', fontSize: 12, margin: '0 0 8px 0' }}>{inviteError}</p>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { setInvitandoBarbero(null); setInviteError(''); }} className="btn-outline" style={{ flex: 1, padding: '8px', fontSize: 13 }}>
                        Cancelar
                      </button>
                      <button onClick={() => handleInvitar(b.id)} disabled={inviteCargando || !inviteEmail.trim()} className="btn-gold" style={{ flex: 1, padding: '8px', fontSize: 13, opacity: (inviteCargando || !inviteEmail.trim()) ? 0.7 : 1 }}>
                        {inviteCargando ? 'Enviando...' : 'Enviar invitación'}
                      </button>
                    </div>
                  </div>
                )}
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
                <div key={s.id}>
                <div className="anim-item panel-item-card" style={{
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
                    <button
                      title="Editar servicio"
                      onClick={() => { setEditandoServicio(s.id); setEditServicioForm({ nombre: s.nombre, duracion_minutos: String(s.duracion_minutos), precio: String(s.precio) }); setEditServicioError(''); }}
                      style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
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

                {/* Panel editar servicio */}
                {editandoServicio === s.id && (
                  <div style={{ marginTop: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>Editar servicio</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <input value={editServicioForm.nombre} onChange={e => setEditServicioForm(f => ({ ...f, nombre: e.target.value }))}
                        placeholder="Nombre" className="input-dark" style={{ gridColumn: '1 / -1' }} />
                      <input value={editServicioForm.duracion_minutos} onChange={e => setEditServicioForm(f => ({ ...f, duracion_minutos: e.target.value }))}
                        placeholder="Duración (min)" type="number" className="input-dark" />
                      <input value={editServicioForm.precio} onChange={e => setEditServicioForm(f => ({ ...f, precio: e.target.value }))}
                        placeholder="Precio" type="number" className="input-dark" />
                    </div>
                    {editServicioError && <p style={{ color: '#E63946', fontSize: 12, margin: '8px 0 0 0' }}>{editServicioError}</p>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button onClick={() => setEditandoServicio(null)} className="btn-outline" style={{ flex: 1, padding: '8px', fontSize: 13 }}>Cancelar</button>
                      <button onClick={() => handleEditarServicio(s.id)} disabled={editServicioCargando} className="btn-gold" style={{ flex: 1, padding: '8px', fontSize: 13, opacity: editServicioCargando ? 0.7 : 1 }}>
                        {editServicioCargando ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                )}
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

                {/* Link por ID — solo si no tiene slug personalizado */}
                {!b.subdominio && (
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
                )}

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

                {/* Teléfono WhatsApp barbería */}
                {b.telefono && editandoTelBarberia !== b.id ? (
                  <div style={{
                    background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)',
                    borderRadius: 8, padding: '8px 12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.18 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      WhatsApp: {b.telefono}
                    </span>
                    <button onClick={() => { setEditandoTelBarberia(b.id); setTelBarberiaInput(b.telefono); setTelBarberiaError(''); }}
                      style={{ ...deleteBtn, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)' }}>
                      Editar
                    </button>
                  </div>
                ) : editandoTelBarberia !== b.id ? (
                  <button
                    onClick={() => { setEditandoTelBarberia(b.id); setTelBarberiaInput(''); setTelBarberiaError(''); }}
                    style={{
                      width: '100%', background: 'none', cursor: 'pointer',
                      border: '1px dashed rgba(255,255,255,0.1)',
                      borderRadius: 8, padding: '8px', marginTop: 4,
                      fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans'",
                      transition: 'border-color 0.2s, color 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    + Agregar teléfono WhatsApp de la barbería
                  </button>
                ) : null}

                {editandoTelBarberia === b.id && (
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px', marginTop: 4 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
                      Este número se usa para que los clientes te contacten por WhatsApp al solicitar un reembolso.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{
                        padding: '9px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRight: 'none', borderRadius: '8px 0 0 8px',
                        fontSize: 13, color: 'var(--text-muted)', flexShrink: 0,
                      }}>+506</span>
                      <input
                        value={telBarberiaInput}
                        onChange={e => { setTelBarberiaInput(formatearInput(e.target.value)); setTelBarberiaError(''); }}
                        placeholder="8888 8888"
                        className="input-dark"
                        style={{ borderRadius: '0 8px 8px 0' }}
                        inputMode="numeric"
                        autoFocus
                      />
                    </div>
                    {telBarberiaError && <p style={{ color: '#E63946', fontSize: 12, margin: '0 0 8px 0' }}>{telBarberiaError}</p>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { setEditandoTelBarberia(null); setTelBarberiaError(''); }} className="btn-outline" style={{ flex: 1, padding: '8px', fontSize: 13 }}>
                        Cancelar
                      </button>
                      <button onClick={() => handleGuardarTelBarberia(b.id)} disabled={telBarberiaCargando || !telBarberiaInput.trim()} className="btn-gold" style={{ flex: 1, padding: '8px', fontSize: 13 }}>
                        {telBarberiaCargando ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Maps link */}
                {b.maps_link && editandoMaps !== b.id ? (
                  <div style={{
                    background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)',
                    borderRadius: 8, padding: '8px 12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      Link Cómo llegar configurado
                    </span>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => { setEditandoMaps(b.id); setMapsInput(b.maps_link); setMapsError(''); }}
                        style={{ ...deleteBtn, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)' }}>
                        Editar
                      </button>
                      <button onClick={() => { setMapsInput(''); actualizarMapsLink(b.id, null).then(() => getMiBarberia().then(r => setBarberias(r.data))); }}
                        style={deleteBtn}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.18)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(230,57,70,0.08)'}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ) : editandoMaps !== b.id ? (
                  <button
                    onClick={() => { setEditandoMaps(b.id); setMapsInput(''); setMapsError(''); }}
                    style={{
                      width: '100%', background: 'none', cursor: 'pointer',
                      border: '1px dashed rgba(255,255,255,0.1)',
                      borderRadius: 8, padding: '8px', marginTop: 4,
                      fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans'",
                      transition: 'border-color 0.2s, color 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    + Agregar link de Google Maps / Waze
                  </button>
                ) : null}

                {/* Editor maps */}
                {editandoMaps === b.id && (
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px', marginTop: 4 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
                      Pegá el link de Google Maps o Waze de tu local.
                    </p>
                    <input
                      value={mapsInput}
                      onChange={e => { setMapsInput(e.target.value); setMapsError(''); }}
                      placeholder="https://maps.google.com/..."
                      className="input-dark"
                      style={{ marginBottom: 8 }}
                      autoFocus
                    />
                    {mapsError && <p style={{ color: '#E63946', fontSize: 12, margin: '0 0 8px 0' }}>{mapsError}</p>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { setEditandoMaps(null); setMapsError(''); }} className="btn-outline" style={{ flex: 1, padding: '8px', fontSize: 13 }}>
                        Cancelar
                      </button>
                      <button onClick={() => handleGuardarMaps(b.id)} disabled={mapsCargando || !mapsInput.trim()} className="btn-gold" style={{ flex: 1, padding: '8px', fontSize: 13 }}>
                        {mapsCargando ? 'Guardando...' : 'Guardar'}
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
                {/* Tarjeta — próximamente */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'not-allowed', opacity: 0.45 }}>
                  <input type="checkbox" disabled style={{ width: 16, height: 16 }} />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Tarjeta de crédito / débito</span>
                    <span style={{
                      marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '2px 7px',
                      borderRadius: 100, background: 'rgba(201,168,76,0.1)',
                      border: '1px solid rgba(201,168,76,0.25)', color: '#C9A84C',
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>Próximamente</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Configuración SINPE */}
            {configPagosForm.sinpe_habilitado && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.06em', margin: 0 }}>
                    Datos SINPE
                  </h2>
                  {!editandoSinpe && (
                    <button
                      type="button"
                      onClick={() => setEditandoSinpe(true)}
                      title="Editar datos SINPE"
                      style={{
                        background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
                        borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                        color: '#C9A84C', fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans'",
                        transition: 'all 0.2s',
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <path d="M11.5 2.5a2.121 2.121 0 0 1 3 3l-9 9-4 1 1-4 9-9z" stroke="#C9A84C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Editar
                    </button>
                  )}
                </div>
                {editandoSinpe ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input value={configPagosForm.sinpe_numero} onChange={e => setConfigPagosForm(f => ({ ...f, sinpe_numero: e.target.value }))}
                      placeholder="Número de teléfono SINPE (ej: 8888-8888)" className="input-dark" inputMode="numeric" />
                    <input value={configPagosForm.sinpe_nombre} onChange={e => setConfigPagosForm(f => ({ ...f, sinpe_nombre: e.target.value }))}
                      placeholder="Nombre que aparece en SINPE (ej: Juan Pérez)" className="input-dark" />
                    <button
                      type="button"
                      onClick={() => setEditandoSinpe(false)}
                      style={{
                        background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8, padding: '7px 14px', color: '#8A8A8A',
                        fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans'", alignSelf: 'flex-start',
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{
                      padding: '10px 14px', background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border)', borderRadius: 8,
                      fontSize: 14, color: configPagosForm.sinpe_numero ? '#F5F5F5' : '#8A8A8A',
                    }}>
                      {configPagosForm.sinpe_numero || 'Sin número configurado'}
                    </div>
                    <div style={{
                      padding: '10px 14px', background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border)', borderRadius: 8,
                      fontSize: 14, color: configPagosForm.sinpe_nombre ? '#F5F5F5' : '#8A8A8A',
                    }}>
                      {configPagosForm.sinpe_nombre || 'Sin nombre configurado'}
                    </div>
                  </div>
                )}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      ¿Con cuánto tiempo puede cancelar sin cargo?
                    </label>
                    <span style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: '#C9A84C', letterSpacing: '0.04em' }}>
                      {configPagosForm.cancelacion_horas_minimo === 1
                        ? '1 hora'
                        : configPagosForm.cancelacion_horas_minimo < 24
                          ? `${configPagosForm.cancelacion_horas_minimo} horas`
                          : configPagosForm.cancelacion_horas_minimo === 24
                            ? '1 día'
                            : configPagosForm.cancelacion_horas_minimo === 48
                              ? '2 días'
                              : `${configPagosForm.cancelacion_horas_minimo} horas`}
                    </span>
                  </div>
                  <input type="range" min="1" max="72" step="1"
                    value={configPagosForm.cancelacion_horas_minimo}
                    onChange={e => setConfigPagosForm(f => ({ ...f, cancelacion_horas_minimo: parseInt(e.target.value) }))}
                    style={{ width: '100%', accentColor: '#C9A84C' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    <span>1 hora</span><span>24 horas</span><span>48 horas</span><span>72 horas</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '8px 0 0 0' }}>
                    Si cancela después de ese límite, se aplica el cargo de cancelación.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type="submit" className="btn-gold" disabled={guardandoPagos}
                style={{ opacity: guardandoPagos ? 0.7 : 1 }}>
                {guardandoPagos ? 'Guardando...' : 'Guardar configuración'}
              </button>
              {pagoGuardado && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4ade80', fontSize: 13, fontWeight: 600 }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="8.5" stroke="#4ade80"/>
                    <path d="M5 9l3 3 5-6" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Guardado
                </div>
              )}
            </div>
          </form>
        )}
      </div>
        </div>{/* flex: 1 minWidth:0 */}
      </div>{/* flex row */}

      {/* Toast invitación */}
      {inviteExito && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#4ade80', color: '#0A0A0A', borderRadius: 100,
          padding: '10px 20px', fontSize: 13, fontWeight: 700, zIndex: 9999,
          whiteSpace: 'nowrap',
        }}>
          ✓ {inviteExito}
        </div>
      )}
    </div>
  );
}

export default PanelDueno;
