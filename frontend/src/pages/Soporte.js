import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getEstadoSuscripcion, cancelarSuscripcion, reactivarSuscripcion, enviarContactoSoporte } from '../services/api';

const FAQS = [
  {
    q: '¿Cómo comparto el link de reservas con mis clientes?',
    a: 'En la sección "Barberías" de tu panel, encontrás dos opciones:\n\n1. Link por defecto: algo como barbersas.com/agendar/1 — siempre está disponible.\n2. Link personalizado: podés configurar uno más fácil de recordar, por ejemplo barbersas.com/b/tu-barberia.\n\nCopiá el link con el botón "Copiar" y pegalo donde quieras — WhatsApp, Instagram, Facebook, historia, bio, etc. Tus clientes solo tienen que abrirlo, elegir el barbero, el servicio y el horario. Sin app, sin cuenta.',
  },
  {
    q: '¿Cómo configuro el horario de atención de mi barbería?',
    a: 'En tu panel, andá a la sección "Barberías" y bajá hasta la tarjeta de tu barbería. Ahí encontrás la sección "Horario de atención" donde podés:\n\n- Elegir los días que abrís (botones por día: Dom, Lun, Mar, Mié, Jue, Vie, Sáb).\n- Configurar la hora de apertura y cierre.\n\nUna vez guardado, los clientes solo verán los días y horas disponibles en el calendario de reservas. Los días cerrados aparecen tachados y no se pueden seleccionar.',
  },
  {
    q: '¿Cómo usa el barbero su cuenta propia?',
    a: 'Los barberos pueden tener su propio login para ver su agenda sin acceso al panel del dueño. El proceso es:\n\n1. El dueño va a la sección "Barberos", abre la tarjeta del barbero y hace clic en "Invitar".\n2. Ingresa el correo del barbero y se envía un email de activación.\n3. El barbero abre el link del email, crea su contraseña y ya puede entrar en barbersas.com/login-barbero.\n\nDesde su dashboard, el barbero puede ver su agenda del día y la semana, y bloquear días en los que no va a trabajar.',
  },
  {
    q: '¿Cómo agendo una cita para mi cliente?',
    a: 'Desde la pantalla de Agenda, usá el botón "Nueva cita" en la parte superior. Completá los datos del cliente (nombre y teléfono), elegí el barbero, servicio y horario disponible.',
  },
  {
    q: '¿Cómo cancelo o reprogramo una cita?',
    a: 'Desde la Agenda, encontrás el botón "Cancelar" en la cita. Para reprogramar, cancelá la existente y creá una nueva con el horario correcto.',
  },
  {
    q: '¿Cómo cancela su cita un cliente por WhatsApp?',
    a: 'El cliente escribe la palabra CANCELAR al número de WhatsApp de BarberSaaS. El sistema cancela automáticamente su cita pendiente más reciente y le avisa al barbero.\n\nFunciona aunque la hora de la cita ya haya pasado, siempre que la cita aún figure como "Pendiente" en el sistema. El cliente debe usar el mismo número de WhatsApp con el que agendó originalmente.',
  },
  {
    q: '¿Por qué no me llegan las notificaciones de WhatsApp al cliente?',
    a: 'Las notificaciones se envían automáticamente. Si un cliente no recibió su mensaje verificá:\n\n1. Que el número tenga exactamente 8 dígitos (el prefijo +506 se agrega solo).\n2. Que el cliente no haya bloqueado el número de BarberSaaS en WhatsApp.\n3. Puede haber demoras de algunos minutos en horas pico.\n\nSi el problema persiste, reportanos el caso con el número del cliente desde esta página.',
  },
  {
    q: '¿Por qué sale "El barbero ya tiene una cita en ese horario"?',
    a: 'El sistema bloquea un margen de 30 minutos alrededor de cada cita para el mismo barbero. Si hay una cita a las 9:30, no se puede agendar otra para ese barbero a las 10:00 porque cae dentro del margen. Con barberos distintos el horario sí está disponible — verificá que hayas seleccionado el barbero correcto.',
  },
  {
    q: '¿Por qué solo funciona el link corto de Google Maps y no el del navegador?',
    a: 'Ambos formatos funcionan. Podés pegar el link de la barra del navegador (el largo con todos los datos de ubicación) o el link corto de "Compartir → Copiar link" en Google Maps. También aceptamos links de Waze y Apple Maps.',
  },
  {
    q: '¿Puedo usar el mismo correo de barbero en dos barberías distintas?',
    a: 'Sí. El correo de un barbero es único dentro de cada barbería, no en todo el sistema. Un barbero que trabaja en dos barberías distintas puede ser invitado con el mismo correo en ambas y tendrá cuentas separadas para cada una.',
  },
  {
    q: '¿Puedo tener varias barberías con mi cuenta?',
    a: 'Sí. El plan Básico incluye 1 barbería. Los planes Pro y Premium permiten hasta 3 barberías registradas bajo una misma cuenta de dueño. Podés cambiar entre ellas desde el panel sin cerrar sesión.',
  },
  {
    q: '¿Cómo cambio de plan?',
    a: 'Desde la sección "Tu Suscripción" en esta página podés ver tu plan actual. Para subir de plan escribinos a saascompany.cr@gmail.com. Los cambios aplican de inmediato.',
  },
  {
    q: '¿Cómo cancelo mi suscripción?',
    a: 'Desde "Tu Suscripción" en esta página encontrás el botón "Cancelar suscripción". Al cancelar, seguís con acceso completo hasta el final del período ya pagado — sin cobros adicionales.',
  },
  {
    q: '¿Qué pasa cuando termina el período de prueba?',
    a: 'Al finalizar los 14 días de prueba, se cobra automáticamente el plan seleccionado. Si no querés continuar, cancelá antes de que venza el trial desde "Tu Suscripción". No se realiza ningún cobro si cancelás dentro del trial.',
  },
  {
    q: '¿Si cancelo un plan ya pagado pierdo acceso de inmediato?',
    a: 'No. Al cancelar, la suscripción se mantiene activa hasta el final del período ya pagado. Por ejemplo, si pagaste el mes y cancelás a mitad, seguís con acceso hasta fin de mes. Sin cobros adicionales.',
  },
];

function EstadoServidor() {
  const [estado, setEstado] = useState('verificando');

  useEffect(() => {
    const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    fetch(`${BASE}/health`, { signal: AbortSignal.timeout(8000) })
      .then(r => r.ok ? setEstado('ok') : setEstado('error'))
      .catch(() => setEstado('error'));
  }, []);

  const config = {
    ok:          { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)',  dot: '#4ade80', texto: 'Todos los sistemas operativos' },
    error:       { color: '#E63946', bg: 'rgba(230,57,70,0.08)',  border: 'rgba(230,57,70,0.2)',   dot: '#E63946', texto: 'Servidor no disponible en este momento' },
    verificando: { color: '#C9A84C', bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.2)',  dot: '#C9A84C', texto: 'Verificando estado...' },
  }[estado];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: config.bg, border: `1px solid ${config.border}`, borderRadius: 12 }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: config.dot, flexShrink: 0, boxShadow: estado === 'ok' ? `0 0 8px ${config.dot}` : 'none' }} />
      <span style={{ fontSize: 14, color: config.color, fontWeight: 600 }}>{config.texto}</span>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 14, fontWeight: 600, color: '#F5F5F5', fontFamily: "'DM Sans', sans-serif",
      }}>
        {q}
        <span style={{ color: '#C9A84C', fontSize: 20, lineHeight: 1, flexShrink: 0, transform: open ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '14px 20px 16px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, borderTop: '1px solid var(--border)', whiteSpace: 'pre-line' }}>
          {a}
        </div>
      )}
    </div>
  );
}

function FormularioContacto({ tipo, titulo, descripcion, campos, botonTexto }) {
  const [datos, setDatos] = useState({});
  const [estado, setEstado] = useState('idle'); // idle | enviando | ok | error
  const [msgError, setMsgError] = useState('');

  const completo = campos.every(c => !c.required || datos[c.key]?.trim());

  const handleEnviar = async () => {
    if (!completo) return;
    setEstado('enviando');
    setMsgError('');
    try {
      const camposFormateados = {};
      campos.forEach(c => { camposFormateados[c.label] = datos[c.key] || ''; });
      await enviarContactoSoporte({ tipo, correo: datos.correo || '', campos: camposFormateados });
      setEstado('ok');
      setDatos({});
    } catch (e) {
      setMsgError(e.response?.data?.detail || 'No se pudo enviar. Intentá de nuevo.');
      setEstado('error');
    }
  };

  if (estado === 'ok') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 0', textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#F5F5F5', margin: '0 0 6px' }}>¡Mensaje enviado!</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Te respondemos en un plazo de 5 días hábiles. Revisá tu correo para la confirmación.</p>
        </div>
        <button onClick={() => setEstado('idle')} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {descripcion && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.7 }}>{descripcion}</p>}
      {campos.map(c => (
        c.tipo === 'textarea'
          ? <textarea key={c.key} placeholder={c.label + (c.required ? ' *' : '')} rows={4} className="input-dark"
              style={{ resize: 'vertical', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}
              value={datos[c.key] || ''} onChange={e => setDatos(d => ({ ...d, [c.key]: e.target.value }))} />
          : <input key={c.key} type={c.tipo || 'text'} placeholder={c.label + (c.required ? ' *' : '')} className="input-dark"
              style={{ fontSize: 13 }} value={datos[c.key] || ''} onChange={e => setDatos(d => ({ ...d, [c.key]: e.target.value }))} />
      ))}
      {estado === 'error' && (
        <div style={{ padding: '10px 14px', background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.2)', borderRadius: 8, fontSize: 13, color: '#E63946' }}>
          {msgError}
        </div>
      )}
      <button onClick={handleEnviar} disabled={!completo || estado === 'enviando'} className="btn-gold"
        style={{ opacity: completo && estado !== 'enviando' ? 1 : 0.4, cursor: completo && estado !== 'enviando' ? 'pointer' : 'not-allowed', fontSize: 13, padding: '12px' }}>
        {estado === 'enviando' ? 'Enviando...' : botonTexto}
      </button>
    </div>
  );
}

function GestionSuscripcion() {
  const [sus, setSus] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [accion, setAccion] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getEstadoSuscripcion().then(r => setSus(r.data)).catch(() => setSus(null)).finally(() => setCargando(false));
  }, []);

  const handleCancelar = async () => {
    if (!window.confirm('¿Confirmás que querés cancelar? Seguís con acceso hasta que venza el período actual.')) return;
    setAccion(true);
    try {
      await cancelarSuscripcion();
      setSus(s => ({ ...s, estado: 'cancelacion_pendiente' }));
      setMsg('Suscripción cancelada. Seguís con acceso hasta el fin del período.');
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Error al cancelar. Intentá de nuevo.');
    } finally { setAccion(false); }
  };

  const handleReactivar = async () => {
    setAccion(true);
    try {
      await reactivarSuscripcion();
      setSus(s => ({ ...s, estado: 'activa' }));
      setMsg('¡Suscripción reactivada correctamente!');
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Error al reactivar. Intentá de nuevo.');
    } finally { setAccion(false); }
  };

  if (cargando) return <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando...</div>;
  if (!sus) return <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No se pudo cargar la suscripción.</div>;

  const ESTADO_CONFIG = {
    activa:                { color: '#4ade80', texto: 'Activa' },
    trial:                 { color: '#C9A84C', texto: 'Trial (14 días gratis)' },
    cancelacion_pendiente: { color: '#fbbf24', texto: 'Cancelada — acceso hasta fin del período' },
    suspendida:            { color: '#E63946', texto: 'Suspendida' },
    cancelada:             { color: '#8A8A8A', texto: 'Cancelada' },
  };
  const cfg = ESTADO_CONFIG[sus.estado] || { color: '#8A8A8A', texto: sus.estado };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 140, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>Plan actual</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#F5F5F5', margin: 0, textTransform: 'capitalize' }}>{sus.plan || 'Básico'}</p>
        </div>
        <div style={{ flex: 1, minWidth: 140, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>Estado</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: cfg.color, margin: 0 }}>{cfg.texto}</p>
        </div>
        {sus.fecha_renovacion && (
          <div style={{ flex: 1, minWidth: 140, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>
              {sus.estado === 'cancelacion_pendiente' ? 'Acceso hasta' : 'Próximo cobro'}
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#F5F5F5', margin: 0 }}>
              {new Date(sus.fecha_renovacion).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>
      {msg && (
        <div style={{ padding: '10px 14px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, fontSize: 13, color: '#C9A84C' }}>
          {msg}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {sus.estado === 'activa' && sus.stripe_subscription_id && (
          <button onClick={handleCancelar} disabled={accion} style={{
            padding: '10px 20px', fontSize: 13, fontWeight: 600, background: 'transparent',
            border: '1px solid rgba(230,57,70,0.3)', borderRadius: 10, color: '#E63946',
            cursor: accion ? 'not-allowed' : 'pointer', opacity: accion ? 0.5 : 1,
            transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
          }}>
            {accion ? 'Procesando...' : 'Cancelar suscripción'}
          </button>
        )}
        {sus.estado === 'cancelacion_pendiente' && (
          <button onClick={handleReactivar} disabled={accion} className="btn-gold" style={{
            padding: '10px 20px', fontSize: 13, fontWeight: 600,
            opacity: accion ? 0.5 : 1, cursor: accion ? 'not-allowed' : 'pointer',
          }}>
            {accion ? 'Procesando...' : 'Reactivar suscripción'}
          </button>
        )}
        {(sus.estado === 'activa' || sus.estado === 'cancelacion_pendiente') && (
          <button onClick={async () => { const r = await import('../services/api').then(m => m.getPortalBilling()); window.location.href = r.data.portal_url; }}
            style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 10, background: 'transparent', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Gestionar método de pago
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ titulo, children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px' }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F5F5F5', margin: '0 0 20px' }}>{titulo}</h2>
      {children}
    </div>
  );
}

export default function Soporte() {
  return (
    <div className="sidebar-page" style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />
      <div className="main-content">
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 100px' }}>

          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 8px' }}>Centro de ayuda</p>
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(32px,7vw,48px)', color: '#F5F5F5', margin: '0 0 8px', letterSpacing: '0.04em' }}>Soporte</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Encontrá respuestas rápidas o contactanos directamente.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <Section titulo="Tu Suscripción">
              <GestionSuscripcion />
            </Section>

            <Section titulo="Estado del Servicio">
              <EstadoServidor />
            </Section>

            <Section titulo="Preguntas Frecuentes">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
              </div>
            </Section>

            <Section titulo="Solicitar Reembolso">
              <FormularioContacto
                tipo="reembolso"
                botonTexto="Enviar solicitud de reembolso"
                descripcion={
                  <>
                    Aplica si hubo un cobro duplicado, el plan no se activó por error técnico, o solicitás dentro de los primeros 7 días del ciclo sin haber usado el servicio.{' '}
                    <span style={{ color: '#E63946' }}>No aplica</span> si ya usaste el servicio ese período o el trial terminó sin cancelar. El número de recibo lo encontrás en el correo de confirmación de Stripe.
                  </>
                }
                campos={[
                  { key: 'nombre', label: 'Tu nombre', required: true },
                  { key: 'correo', label: 'Correo de tu cuenta', tipo: 'email', required: true },
                  { key: 'recibo', label: 'Número de recibo / transacción (ej: ch_xxx o IN-0001)', required: true },
                  { key: 'monto', label: 'Monto cobrado (ej: $9.99 o ₡6500)', required: true },
                  { key: 'fecha', label: 'Fecha del cobro (ej: 15/04/2026)', required: true },
                  { key: 'motivo', label: 'Descripción del problema', tipo: 'textarea', required: true },
                ]}
              />
            </Section>

            <Section titulo="Reportar un Problema">
              <FormularioContacto
                tipo="reporte"
                botonTexto="Enviar reporte"
                descripcion="Si encontraste un error en la plataforma, describilo con el mayor detalle posible para que podamos resolverlo rápido."
                campos={[
                  { key: 'correo', label: 'Tu correo', tipo: 'email', required: true },
                  { key: 'pantalla', label: '¿En qué pantalla ocurrió? (ej: Agenda, Panel...)', required: true },
                  { key: 'descripcion', label: 'Describí el problema con detalle', tipo: 'textarea', required: true },
                ]}
              />
            </Section>

            <Section titulo="¿Cómo funcionan las notificaciones de WhatsApp?">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                <p style={{ margin: 0 }}>
                  BarberSaaS envía mensajes de WhatsApp automáticamente a tus clientes. <strong style={{ color: '#F5F5F5' }}>No necesitás configurar nada</strong> — el sistema lo maneja por vos.
                </p>

                <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: '16px 18px' }}>
                  <p style={{ margin: '0 0 10px', fontWeight: 700, color: '#F5F5F5' }}>¿Qué mensajes se envían automáticamente?</p>
                  {[
                    'Confirmación al cliente cuando se agenda una cita',
                    'Recordatorio 24 horas antes de la cita',
                    'Recordatorio 1 hora antes de la cita',
                    'Notificación al barbero cuando llega una cita nueva',
                    'Aviso al cliente si hay un lugar disponible en lista de espera',
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 8 }}>
                      <span style={{ color: '#4ade80', flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
                  <p style={{ margin: '0 0 10px', fontWeight: 700, color: '#F5F5F5' }}>¿Por qué un cliente no recibió su mensaje?</p>
                  {[
                    { t: 'Número mal escrito', d: 'Verificá que el número tenga exactamente 8 dígitos en la cita. El prefijo +506 se agrega automáticamente.' },
                    { t: 'El cliente bloqueó el número', d: 'Si el cliente bloqueó el número de WhatsApp de BarberSaaS, los mensajes no llegarán. Pedile que lo desbloquee.' },
                    { t: 'Problema temporal del servicio', d: 'Ocasionalmente puede haber demoras de algunos minutos. Si el mensaje no llega en 10 min, reportanos el caso.' },
                  ].map((item, i) => (
                    <div key={i} style={{ marginTop: i > 0 ? 12 : 0 }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#C9A84C', fontSize: 13 }}>{item.t}</p>
                      <p style={{ margin: 0, fontSize: 12 }}>{item.d}</p>
                    </div>
                  ))}
                </div>

                <p style={{ margin: 0, fontSize: 12 }}>
                  Si el problema persiste, usá el formulario <strong style={{ color: '#F5F5F5' }}>"Reportar un Problema"</strong> más abajo con el número del cliente y la fecha de la cita.
                </p>
              </div>
            </Section>

            <Section titulo="Contacto Directo">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 2px' }}>Correo de soporte</p>
                    <a href="mailto:saascompany.cr@gmail.com" style={{ fontSize: 14, color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}>saascompany.cr@gmail.com</a>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>
                  </svg>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 2px' }}>Horario de atención</p>
                    <p style={{ fontSize: 14, color: '#F5F5F5', margin: 0, fontWeight: 500 }}>Lunes a Viernes, 8am – 6pm (Costa Rica)</p>
                  </div>
                </div>
              </div>
            </Section>

          </div>
        </div>
      </div>
    </div>
  );
}
