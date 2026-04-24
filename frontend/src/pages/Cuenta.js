import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { getEstadoSuscripcion, getPortalBilling, cambiarPassword, cancelarSuscripcion, reactivarSuscripcion, forzarSyncSuscripcion } from '../services/api';

const PLAN_LABEL = { basico: 'Básico', pro: 'Pro', premium: 'Premium' };
const ESTADO_META = {
  trial:               { label: 'Trial activo',         color: '#C9A84C', bg: 'rgba(201,168,76,0.12)'  },
  activa:              { label: 'Activa',               color: '#4ade80', bg: 'rgba(74,222,128,0.1)'   },
  cancelacion_pendiente: { label: 'Cancela al fin del periodo', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  suspendida:          { label: 'Suspendida',           color: '#E63946', bg: 'rgba(230,57,70,0.12)'   },
  cancelada:           { label: 'Cancelada',            color: '#8A8A8A', bg: 'rgba(255,255,255,0.06)' },
};

function calcularFortaleza(pwd) {
  if (!pwd) return { nivel: 0, label: '', color: '', checks: [] };
  const checks = [
    { ok: pwd.length >= 8,                          texto: 'Al menos 8 caracteres' },
    { ok: /[A-Z]/.test(pwd),                        texto: '1 letra mayúscula' },
    { ok: /[!@#$%^&*()\-_=+{}|;:",.<>?/\\]/.test(pwd), texto: '1 carácter especial (!@#...)' },
    { ok: /[0-9]/.test(pwd),                        texto: '1 número' },
  ];
  const ok = checks.filter(c => c.ok).length;
  if (ok <= 1) return { nivel: 1, label: 'Muy débil',   color: '#E63946', pct: 25,  checks };
  if (ok === 2) return { nivel: 2, label: 'Débil',       color: '#f97316', pct: 50,  checks };
  if (ok === 3) return { nivel: 3, label: 'Intermedia',  color: '#C9A84C', pct: 75,  checks };
  return         { nivel: 4, label: 'Fuerte',        color: '#4ade80', pct: 100, checks };
}

function Section({ titulo, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '24px',
    }}>
      <h2 style={{
        fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.06em',
        color: '#F5F5F5', margin: '0 0 20px 0',
      }}>
        {titulo}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, value, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: '1px solid var(--border)',
      gap: 12, flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      {value !== undefined
        ? <span style={{ fontSize: 14, color: '#F5F5F5', fontWeight: 600 }}>{value}</span>
        : children}
    </div>
  );
}

function InputPassword({ label, value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
        {label.toUpperCase()}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="input-dark"
          style={{ paddingRight: 40 }}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 4, lineHeight: 0,
          }}
        >
          {visible ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default function Cuenta() {
  const { usuario } = useAuth();

  const [sus, setSus] = useState(null);
  const [portalCargando, setPortalCargando] = useState(false);
  const [cancelCargando, setCancelCargando] = useState(false);
  const [reactivarCargando, setReactivarCargando] = useState(false);

  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [passError, setPassError] = useState('');
  const [passOk, setPassOk] = useState(false);
  const [passCargando, setPassCargando] = useState(false);

  const fortaleza = calcularFortaleza(passNueva);

  useEffect(() => {
    getEstadoSuscripcion()
      .then(r => setSus(r.data))
      .catch(() => {});
  }, []);

  const handlePortal = async () => {
    setPortalCargando(true);
    try {
      const r = await getPortalBilling();
      window.location.href = r.data.portal_url;
    } catch (err) {
      alert(err.response?.data?.detail || 'No se pudo abrir el portal de facturación');
    } finally {
      setPortalCargando(false);
    }
  };

  const handleCancelar = async () => {
    if (!window.confirm('¿Cancelar tu suscripción? Podés seguir usando la plataforma hasta el final del periodo actual.')) return;
    setCancelCargando(true);
    try {
      await cancelarSuscripcion();
      const r = await getEstadoSuscripcion();
      setSus(r.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al cancelar la suscripción');
    } finally {
      setCancelCargando(false);
    }
  };

  const handleReactivar = async () => {
    setReactivarCargando(true);
    try {
      await reactivarSuscripcion();
      const r = await getEstadoSuscripcion();
      setSus(r.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al reactivar la suscripción');
    } finally {
      setReactivarCargando(false);
    }
  };

  const handleForzarSync = async () => {
    try {
      await forzarSyncSuscripcion();
      const r = await getEstadoSuscripcion();
      setSus(r.data);
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Error desconocido');
    }
  };

  const handleCambiarPass = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassOk(false);
    if (passNueva !== passConfirm) {
      setPassError('Las contraseñas nuevas no coinciden');
      return;
    }
    if (fortaleza.nivel < 3) {
      setPassError('La contraseña es muy débil. Cumplí todos los requisitos de seguridad.');
      return;
    }
    setPassCargando(true);
    try {
      await cambiarPassword({ password_actual: passActual, nueva_password: passNueva });
      setPassOk(true);
      setPassActual(''); setPassNueva(''); setPassConfirm('');
    } catch (err) {
      const det = err.response?.data?.detail;
      setPassError(typeof det === 'string' ? det : 'Error al cambiar la contraseña');
    } finally {
      setPassCargando(false);
    }
  };

  const estadoMeta = sus ? (ESTADO_META[sus.estado] || ESTADO_META.cancelada) : null;
  const trialFin = sus?.fecha_trial_fin ? new Date(sus.fecha_trial_fin + 'Z') : null;
  const diasTrial = trialFin ? Math.max(0, Math.ceil((trialFin - Date.now()) / 86400000)) : null;

  return (
    <div className="sidebar-page" style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />
      <div className="main-content">
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px 100px' }}>

          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 8px' }}>
              Mi perfil
            </p>
            <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(32px,7vw,48px)', color: '#F5F5F5', margin: '0 0 8px', letterSpacing: '0.04em' }}>
              Mi Cuenta
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
              Administrá tu perfil, contraseña y suscripción.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* 1. Perfil */}
            <Section titulo="Perfil">
              <Row label="Email" value={usuario?.email || '—'} />
              <Row label="Rol">
                <span style={{ fontSize: 13, color: '#F5F5F5', fontWeight: 600, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 100, padding: '3px 12px' }}>
                  {usuario?.rol === 'dueno' ? 'Dueño' : usuario?.rol === 'admin' ? 'Admin' : usuario?.rol || 'Dueño'}
                </span>
              </Row>
            </Section>

            {/* 2. Suscripción */}
            <Section titulo="Suscripcion">
              {sus ? (
                <>
                  <Row label="Plan" value={PLAN_LABEL[sus.plan] || sus.plan} />
                  <Row label="Estado">
                    <span style={{ fontSize: 12, fontWeight: 700, color: estadoMeta.color, background: estadoMeta.bg, borderRadius: 100, padding: '3px 12px' }}>
                      {estadoMeta.label}
                    </span>
                  </Row>
                  {sus.estado === 'trial' && diasTrial !== null && (
                    <Row label="Trial termina en">
                      <span style={{ fontSize: 14, fontWeight: 600, color: diasTrial <= 3 ? '#E63946' : '#C9A84C' }}>
                        {diasTrial} {diasTrial === 1 ? 'día' : 'días'}
                      </span>
                    </Row>
                  )}
                  {sus.fecha_renovacion && sus.estado === 'activa' && (
                    <Row label="Próxima renovación" value={new Date(sus.fecha_renovacion + 'Z').toLocaleDateString('es-CR')} />
                  )}
                  <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Sincronizar si plan sigue en básico */}
                    {sus.plan === 'basico' && (
                      <button
                        onClick={handleForzarSync}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8, width: 'fit-content',
                          padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                          background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.3)',
                          color: '#60a5fa', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans'",
                        }}
                      >
                        Sincronizar plan con Stripe
                      </button>
                    )}
                    {/* Portal facturación */}
                    <button
                      onClick={handlePortal}
                      disabled={portalCargando}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, width: 'fit-content',
                        padding: '10px 20px', borderRadius: 10, cursor: portalCargando ? 'not-allowed' : 'pointer',
                        background: 'none', border: '1px solid rgba(201,168,76,0.35)',
                        color: '#C9A84C', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans'",
                        opacity: portalCargando ? 0.6 : 1, transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => { if (!portalCargando) e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                      {portalCargando ? 'Cargando...' : 'Administrar facturación'}
                    </button>

                    {/* Reactivar — si está pendiente de cancelación */}
                    {sus.estado === 'cancelacion_pendiente' && (
                      <div style={{
                        background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.25)',
                        borderRadius: 12, padding: '14px 16px',
                      }}>
                        <p style={{ fontSize: 13, color: '#f97316', margin: '0 0 10px 0', fontWeight: 600 }}>
                          Tu suscripción se cancelará al final del periodo. Podés seguir usándola hasta entonces.
                        </p>
                        <button
                          onClick={handleReactivar}
                          disabled={reactivarCargando}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '8px 16px', borderRadius: 8, cursor: reactivarCargando ? 'not-allowed' : 'pointer',
                            background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                            color: '#4ade80', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans'",
                            opacity: reactivarCargando ? 0.6 : 1, transition: 'background 0.2s',
                          }}
                          onMouseEnter={e => { if (!reactivarCargando) e.currentTarget.style.background = 'rgba(74,222,128,0.18)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.1)'; }}
                        >
                          {reactivarCargando ? 'Reactivando...' : '↩ Reactivar suscripción'}
                        </button>
                      </div>
                    )}

                    {/* Cancelar — solo si está activa */}
                    {sus.estado === 'activa' && (
                      <div style={{
                        borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4,
                      }}>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                          Al cancelar, tu plan sigue activo hasta el final del periodo pagado.
                        </p>
                        <button
                          onClick={handleCancelar}
                          disabled={cancelCargando}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '8px 16px', borderRadius: 8, cursor: cancelCargando ? 'not-allowed' : 'pointer',
                            background: 'rgba(230,57,70,0.06)', border: '1px solid rgba(230,57,70,0.25)',
                            color: '#E63946', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans'",
                            opacity: cancelCargando ? 0.6 : 1, transition: 'background 0.2s',
                          }}
                          onMouseEnter={e => { if (!cancelCargando) e.currentTarget.style.background = 'rgba(230,57,70,0.14)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(230,57,70,0.06)'; }}
                        >
                          {cancelCargando ? 'Cancelando...' : 'Cancelar suscripción'}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Cargando...</p>
              )}
            </Section>

            {/* 3. Cambiar contraseña */}
            <Section titulo="Cambiar Contraseña">
              <form onSubmit={handleCambiarPass} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <InputPassword
                  label="Contraseña actual"
                  value={passActual}
                  onChange={e => { setPassActual(e.target.value); setPassError(''); setPassOk(false); }}
                  placeholder="Tu contraseña actual"
                />
                <InputPassword
                  label="Nueva contraseña"
                  value={passNueva}
                  onChange={e => { setPassNueva(e.target.value); setPassError(''); setPassOk(false); }}
                  placeholder="Mín. 8 caracteres, 1 mayúscula, 1 símbolo"
                />

                {passNueva.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                        <div style={{ width: `${fortaleza.pct}%`, height: '100%', background: fortaleza.color, borderRadius: 99, transition: 'width 0.3s ease, background 0.3s ease' }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: fortaleza.color, minWidth: 72, textAlign: 'right' }}>
                        {fortaleza.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {fortaleza.checks.map(c => (
                        <div key={c.texto} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {c.ok ? (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <circle cx="6" cy="6" r="5.5" fill="rgba(74,222,128,0.15)" stroke="#4ade80" strokeWidth="1"/>
                              <path d="M3.5 6l1.8 1.8 3.2-3.6" stroke="#4ade80" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <circle cx="6" cy="6" r="5.5" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                              <circle cx="6" cy="6" r="1.5" fill="rgba(255,255,255,0.2)"/>
                            </svg>
                          )}
                          <span style={{ fontSize: 11, color: c.ok ? '#4ade80' : 'var(--text-muted)' }}>{c.texto}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <InputPassword
                  label="Confirmar nueva contraseña"
                  value={passConfirm}
                  onChange={e => { setPassConfirm(e.target.value); setPassError(''); setPassOk(false); }}
                  placeholder="Repetí la nueva contraseña"
                />

                {passConfirm.length > 0 && passNueva !== passConfirm && (
                  <p style={{ fontSize: 12, color: '#E63946', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Las contraseñas no coinciden
                  </p>
                )}
                {passError && <p style={{ fontSize: 13, color: '#E63946', margin: 0 }}>{passError}</p>}
                {passOk && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4ade80' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Contraseña actualizada correctamente
                  </div>
                )}
                <button type="submit" disabled={passCargando || !passActual || !passNueva || !passConfirm} className="btn-gold" style={{ padding: '11px', fontSize: 14, marginTop: 4 }}>
                  {passCargando ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
              </form>
            </Section>

          </div>
        </div>
      </div>
    </div>
  );
}
