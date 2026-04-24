import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { onboarding, login, crearCheckout } from '../services/api';
import { NavLogo } from '../components/LogoLink';
import { formatearInput, formatearTelefono } from '../utils/phone';

function calcularFortaleza(pwd) {
  const checks = [
    pwd.length >= 8,
    /[A-Z]/.test(pwd),
    /[!@#$%^&*()\-_=+{}|;:",.<>?/\\]/.test(pwd),
    /[0-9]/.test(pwd),
  ];
  const nivel = checks.filter(Boolean).length;
  const labels = ['', 'Muy débil', 'Débil', 'Intermedia', 'Fuerte'];
  const colors = ['', '#E63946', '#f97316', '#C9A84C', '#4ade80'];
  return { nivel, label: labels[nivel], color: colors[nivel], pct: nivel * 25, checks };
}

const CHECK_LABELS = ['8+ caracteres', 'Mayúscula', 'Caracter especial', 'Número'];

const PASOS = ['Tu cuenta', 'Tu barberia', 'Listo'];

const PLANES_INFO = {
  pro:     { label: 'Pro',     color: '#C9A84C', mensual: 29,  anual: 232,  desc_mensual: 'Hasta 3 barberos', desc_anual: 'Hasta 3 barberos · $19/mes' },
  premium: { label: 'Premium', color: '#a78bfa', mensual: 59,  anual: 472,  desc_mensual: 'Barberos ilimitados', desc_anual: 'Barberos ilimitados · $39/mes' },
};

export default function Onboarding() {
  const location = useLocation();
  const navigate = useNavigate();
  const planInicial = location.state?.plan || 'pro';

  const [paso, setPaso] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [coupon, setCoupon] = useState('');
  const [anual, setAnual] = useState(false);
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

  const fortaleza = calcularFortaleza(form.password);

  const handleRegistro = () => {
    if (!form.email || !form.password) { setError('Email y contraseña son obligatorios'); return; }
    if (!form.email.includes('@')) { setError('El email ingresado no es válido'); return; }
    if (fortaleza.nivel < 3) { setError('La contraseña es muy débil. Usá mayúsculas, números y caracteres especiales.'); return; }
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
      const bid = loginRes.data.usuario?.barberia_id;
      localStorage.setItem('usuario', JSON.stringify(loginRes.data.usuario));
      setLinkGenerado(`${window.location.origin}/agendar/${bid}`);
      // Siempre redirige a Stripe para registrar tarjeta y activar el trial
      try {
        const checkoutRes = await crearCheckout({ plan: form.plan, periodo: anual ? 'anual' : 'mensual', coupon: coupon.trim() || undefined });
        window.location.href = checkoutRes.data.checkout_url;
      } catch {
        // Si Stripe falla, igual avanza al paso de confirmación
        setPaso(2);
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
      minHeight: '100vh', background: '#0A0A0A',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Glow de fondo */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(201,168,76,0.1) 0%, transparent 70%)',
      }} />

      {/* Back */}
      <div style={{ position: 'absolute', top: 20, left: 24, zIndex: 1 }}>
        <NavLogo to="/" />
      </div>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative' }}>
        {/* Badge de marca */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: '0.1em', color: '#C9A84C', margin: 0, lineHeight: 1 }}>
              Registrá tu barbería
            </p>
            <p style={{ fontSize: 11, color: '#555', margin: 0, letterSpacing: '0.04em' }}>BarberSaaS · 14 días gratis</p>
          </div>
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
          background: '#111',
          border: '1px solid rgba(201,168,76,0.15)',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.05)',
        }}>
          {/* Franja dorada superior */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #C9A84C 40%, #e8c96a 60%, transparent)' }} />
          <div style={{ padding: '28px 28px 24px' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Elegí tu plan — <span style={{ color: '#C9A84C' }}>{anual ? 'ahorrás 33%' : '14 días gratis'}</span>
                  </label>
                  {/* Toggle mensual / anual */}
                  <button
                    onClick={() => setAnual(a => !a)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: anual ? 'rgba(74,222,128,0.08)' : 'var(--bg-secondary)',
                      border: anual ? '1px solid rgba(74,222,128,0.25)' : '1px solid var(--border)',
                      borderRadius: 100, padding: '3px 10px 3px 4px',
                      cursor: 'pointer', fontFamily: "'DM Sans'", transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: anual ? '#4ade80' : 'var(--border)',
                      transition: 'background 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {anual && <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l3.5 3.5L12 4" stroke="#0A0A0A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: anual ? '#4ade80' : 'var(--text-muted)' }}>
                      {anual ? 'Anual' : 'Mensual'}
                    </span>
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {Object.entries(PLANES_INFO).map(([p, info]) => (
                    <button
                      key={p}
                      onClick={() => setForm({ ...form, plan: p })}
                      style={{
                        padding: '10px 8px', borderRadius: 10,
                        fontSize: 12, fontWeight: 700, textAlign: 'left',
                        border: form.plan === p ? `1px solid ${info.color}` : '1px solid var(--border)',
                        background: form.plan === p ? `${info.color}15` : 'var(--bg-secondary)',
                        color: form.plan === p ? info.color : 'var(--text-muted)',
                        cursor: 'pointer', fontFamily: "'DM Sans'",
                        transition: 'all 0.2s',
                      }}
                    >
                      <div>{info.label}</div>
                      <div style={{ fontSize: 10, fontWeight: 400, marginTop: 2, opacity: 0.8 }}>
                        {anual ? `$${info.anual}/año · ${info.desc_anual}` : `$${info.mensual}/mes · ${info.desc_mensual}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <input name="email" type="email" placeholder="Email" value={form.email}
                onChange={handleChange} className="input-dark" autoComplete="email" />
              <input name="password" type="password" placeholder="Contraseña (mín. 8 caracteres)"
                value={form.password} onChange={handleChange} className="input-dark" autoComplete="new-password" />
              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${fortaleza.pct}%`, background: fortaleza.color, borderRadius: 2, transition: 'width 0.3s, background 0.3s' }} />
                  </div>
                  {fortaleza.label && <p style={{ fontSize: 11, color: fortaleza.color, margin: '0 0 6px 0', fontWeight: 600 }}>{fortaleza.label}</p>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {CHECK_LABELS.map((lbl, i) => (
                      <span key={i} style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 100,
                        background: fortaleza.checks[i] ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
                        color: fortaleza.checks[i] ? '#4ade80' : '#666',
                        border: `1px solid ${fortaleza.checks[i] ? 'rgba(74,222,128,0.2)' : 'transparent'}`,
                      }}>
                        {fortaleza.checks[i] ? '✓' : '·'} {lbl}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.6 }}>
                Al continuar te pediremos una tarjeta para activar los{' '}
                <strong style={{ color: '#C9A84C' }}>14 días gratis</strong>.
                {' '}No se realiza ningún cobro hasta que termine el trial. Cancelá antes sin costo.
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
          </div>{/* /padding */}
        </div>
      </div>
    </div>
  );
}
