import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { onboarding, login, getMe, crearCheckout } from '../services/api';
import { NavLogo } from '../components/LogoLink';
import { formatearInput, formatearTelefono } from '../utils/phone';

const PASOS = ['Tu cuenta', 'Tu barberia', 'Listo'];

const PLANES_INFO = {
  basico:  { label: 'Basico',  color: 'var(--text-muted)' },
  pro:     { label: 'Pro',     color: '#C9A84C' },
  premium: { label: 'Premium', color: '#a78bfa' },
};

export default function Onboarding() {
  const location = useLocation();
  const navigate = useNavigate();
  const planInicial = location.state?.plan || 'basico';

  const [paso, setPaso] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [coupon, setCoupon] = useState('');
  const [linkGenerado, setLinkGenerado] = useState('');
  const [tcAceptado, setTcAceptado] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '',
    nombre_barberia: '', direccion: '', telefono: '',
    plan: planInicial,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegistro = () => {
    if (!form.email || !form.password) { setError('Email y contrasena son obligatorios'); return; }
    if (!form.email.includes('@')) { setError('El email ingresado no es valido'); return; }
    if (form.password.length < 6) { setError('La contrasena debe tener al menos 6 caracteres'); return; }
    if (!tcAceptado) { setError('Debes aceptar los Términos y Condiciones para continuar'); return; }
    setPaso(1);
  };

  const handleBarberia = async () => {
    if (!form.nombre_barberia.trim()) { setError('El nombre de la barberia es obligatorio'); return; }
    setCargando(true); setError('');
    try {
      await onboarding({
        ...form,
        telefono: form.telefono ? formatearTelefono(form.telefono) : '',
      });
      const loginRes = await login({ email: form.email, password: form.password });
      localStorage.setItem('token', loginRes.data.access_token);
      const meRes = await getMe();
      const bid = meRes.data.barberia_id;
      setLinkGenerado(`${window.location.origin}/agendar/${bid}`);
      setPaso(2);
      if (form.plan !== 'basico') {
        try {
          const checkoutRes = await crearCheckout({ plan: form.plan, periodo: 'mensual', coupon: coupon.trim() || undefined });
          window.location.href = checkoutRes.data.checkout_url;
        } catch { /* Sigue en trial */ }
      }
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (!err.response) {
        setError('No se pudo conectar con el servidor.');
      } else if (status === 422) {
        const msg = Array.isArray(detail) ? detail.map(e => e.msg || JSON.stringify(e)).join(', ') : 'Datos invalidos.';
        setError(msg);
      } else if (typeof detail === 'string') {
        if (detail.toLowerCase().includes('ya esta registrado') || detail.toLowerCase().includes('already')) {
          setError('Este email ya esta registrado. Inicia sesion o usa otro email.');
        } else {
          setError(detail);
        }
      } else {
        setError(`Error del servidor (${status || 'desconocido'}). Intenta de nuevo.`);
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Back */}
      <div style={{ position: 'absolute', top: 20, left: 24 }}>
        <NavLogo to="/" />
      </div>

      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 34, letterSpacing: '0.1em',
            color: 'var(--text-primary)', margin: '0 0 6px 0',
          }}>
            Configura tu barberia
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            Listo en menos de 2 minutos
          </p>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
          {PASOS.map((nombre, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                  background: i < paso ? 'rgba(201,168,76,0.2)' : i === paso ? '#C9A84C' : 'var(--bg-card)',
                  color: i < paso ? '#C9A84C' : i === paso ? '#0A0A0A' : 'var(--text-muted)',
                  border: i < paso ? '1px solid #C9A84C' : i === paso ? 'none' : '1px solid var(--border)',
                  transition: 'all 0.3s',
                }}>
                  {i < paso ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l3.5 3.5L12 4" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : i + 1}
                </div>
                <span style={{ fontSize: 11, color: i === paso ? '#C9A84C' : 'var(--text-muted)', display: 'none' }}
                  className="sm:block">{nombre}</span>
              </div>
              {i < PASOS.length - 1 && (
                <div style={{
                  width: 56, height: 1, margin: '0 8px', marginBottom: 18,
                  background: i < paso ? '#C9A84C' : 'var(--border)',
                  transition: 'background 0.3s',
                }}/>
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 18, padding: '32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>
          {error && (
            <div style={{
              background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.25)',
              borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#E63946',
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          {/* Paso 0: Cuenta */}
          {paso === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 24, letterSpacing: '0.06em', margin: 0 }}>
                Crea tu cuenta
              </h2>

              {/* Plan selector */}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Plan</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {Object.entries(PLANES_INFO).map(([p, info]) => (
                    <button
                      key={p}
                      onClick={() => setForm({ ...form, plan: p })}
                      style={{
                        padding: '8px 6px', borderRadius: 8,
                        fontSize: 12, fontWeight: 700,
                        border: form.plan === p ? `1px solid ${info.color}` : '1px solid var(--border)',
                        background: form.plan === p ? `${info.color}15` : 'var(--bg-secondary)',
                        color: form.plan === p ? info.color : 'var(--text-muted)',
                        cursor: 'pointer', fontFamily: "'DM Sans'",
                        transition: 'all 0.2s',
                      }}
                    >
                      {info.label}
                    </button>
                  ))}
                </div>
              </div>

              <input name="email" type="email" placeholder="Email" value={form.email}
                onChange={handleChange} className="input-dark" autoComplete="email" />
              <input name="password" type="password" placeholder="Contrasena (min. 6 caracteres)"
                value={form.password} onChange={handleChange} className="input-dark" autoComplete="new-password" />

              {form.plan !== 'basico' && (
                <input type="text" placeholder="Codigo de descuento (opcional)"
                  value={coupon} onChange={e => setCoupon(e.target.value)}
                  className="input-dark" style={{ borderColor: 'rgba(201,168,76,0.3)' }} />
              )}

              {/* Checkbox T&C */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <input
                  type="checkbox"
                  checked={tcAceptado}
                  onChange={e => setTcAceptado(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#C9A84C', flexShrink: 0 }}
                />
                <span>
                  Acepto los{' '}
                  <Link to="/terminos" target="_blank" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}>
                    Términos y Condiciones
                  </Link>{' '}y la{' '}
                  <Link to="/privacidad" target="_blank" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}>
                    Política de Privacidad
                  </Link>
                </span>
              </label>

              <button onClick={handleRegistro} className="btn-gold" style={{ width: '100%', marginTop: 4, opacity: tcAceptado ? 1 : 0.5 }}>
                Continuar
              </button>
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Ya tenes cuenta?{' '}
                <button onClick={() => navigate('/login')} style={{
                  background: 'none', border: 'none', color: '#C9A84C',
                  fontWeight: 600, cursor: 'pointer', fontSize: 13,
                  fontFamily: "'DM Sans'", padding: 0,
                }}>
                  Inicia sesion
                </button>
              </p>
            </div>
          )}

          {/* Paso 1: Barberia */}
          {paso === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 24, letterSpacing: '0.06em', margin: 0 }}>
                Configura tu barberia
              </h2>
              <input name="nombre_barberia" placeholder="Nombre de la barberia *"
                value={form.nombre_barberia} onChange={handleChange} className="input-dark" />
              <input name="direccion" placeholder="Direccion (opcional)"
                value={form.direccion} onChange={handleChange} className="input-dark" />
              <div style={{ display: 'flex' }}>
                <span style={{
                  padding: '0 12px', height: '42px', lineHeight: '42px',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRight: 'none', borderRadius: '8px 0 0 8px',
                  fontSize: 13, color: 'var(--text-muted)', flexShrink: 0,
                }}>+506</span>
                <input
                  name="telefono"
                  placeholder="8888 8888 (opcional)"
                  value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: formatearInput(e.target.value) })}
                  className="input-dark"
                  style={{ borderRadius: '0 8px 8px 0' }}
                  inputMode="numeric"
                />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Tienes{' '}
                <strong style={{ color: '#C9A84C' }}>14 dias de prueba gratis</strong>
                {' '}— sin tarjeta de credito.
              </p>
              <button onClick={handleBarberia} disabled={cargando} className="btn-gold"
                style={{ width: '100%', opacity: cargando ? 0.7 : 1 }}>
                {cargando ? 'Creando tu barberia...' : 'Crear mi barberia'}
              </button>
              <button onClick={() => setPaso(0)} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans'",
              }}>
                Atras
              </button>
            </div>
          )}

          {/* Paso 2: Listo */}
          {paso === 2 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(201,168,76,0.15)', border: '1px solid #C9A84C',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5L20 7" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: '0.08em', color: '#C9A84C', margin: '0 0 8px 0' }}>
                Tu barberia esta lista
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 20px 0' }}>
                Comparte este link con tus clientes:
              </p>
              <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ color: '#C9A84C', fontSize: 13, flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {linkGenerado}
                </span>
                <button onClick={() => navigator.clipboard.writeText(linkGenerado)} className="btn-gold" style={{ padding: '6px 12px', fontSize: 12 }}>
                  Copiar
                </button>
              </div>
              <div style={{ textAlign: 'left', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Agrega tus barberos en el Panel', 'Configura tus servicios y precios', 'Comparte tu link con clientes'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--text-muted)' }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%', background: 'rgba(201,168,76,0.12)',
                      border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>{i + 1}</span>
                    {item}
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/panel')} className="btn-gold" style={{ width: '100%' }}>
                Ir al Panel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
