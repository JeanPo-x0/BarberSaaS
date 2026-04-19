import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

const FAQS = [
  {
    q: '¿Cómo agendo una cita para mi cliente?',
    a: 'Desde la pantalla de Agenda, usá el botón "Nueva cita" en la parte superior. Completá los datos del cliente, elegí el barbero, servicio y horario disponible.',
  },
  {
    q: '¿Qué pasa si un cliente no llega a su cita?',
    a: 'El sistema cancela automáticamente la cita 30 minutos después del horario pactado si no fue marcada como completada. Podés también cancelarla manualmente desde la Agenda.',
  },
  {
    q: '¿Cómo cancelo o reprogramo una cita?',
    a: 'Desde la Agenda, hacé click en la cita y seleccioná "Cancelar". Para reprogramar, cancelá la existente y creá una nueva con el horario correcto.',
  },
  {
    q: '¿Por qué no me llegan las notificaciones de WhatsApp?',
    a: 'Verificá que el número de teléfono del cliente tenga el prefijo correcto (+506 para Costa Rica). También asegurate de que tu cuenta Twilio esté activa y con saldo suficiente.',
  },
  {
    q: '¿Puedo tener varias barberías con mi cuenta?',
    a: 'Sí. El plan Pro permite hasta 3 barberías y el plan Premium permite barberías ilimitadas. Con el plan Básico solo podés tener 1.',
  },
  {
    q: '¿Cómo cambio de plan?',
    a: 'Desde la sección de Planes podés seleccionar un plan nuevo. El cambio aplica inmediatamente y el cobro se ajusta proporcional al tiempo restante del ciclo.',
  },
  {
    q: '¿Cómo cancelo mi suscripción?',
    a: 'Escribinos a saascompany.cr@gmail.com con el asunto "Cancelar suscripción" y tu correo de registro. Procesamos la cancelación en máximo 2 días hábiles.',
  },
  {
    q: '¿Qué pasa cuando termina el período de prueba?',
    a: 'Al finalizar los 14 días de prueba, se cobra automáticamente el plan seleccionado a la tarjeta registrada. Si no querés continuar, debés cancelar antes de que venza el trial.',
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
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 18px',
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: 12,
    }}>
      <span style={{
        width: 10, height: 10, borderRadius: '50%',
        background: config.dot, flexShrink: 0,
        boxShadow: estado === 'ok' ? `0 0 8px ${config.dot}` : 'none',
      }} />
      <span style={{ fontSize: 14, color: config.color, fontWeight: 600 }}>{config.texto}</span>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          padding: '16px 20px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 14, fontWeight: 600, color: '#F5F5F5',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {q}
        <span style={{
          color: '#C9A84C', fontSize: 20, lineHeight: 1, flexShrink: 0,
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}>+</span>
      </button>
      {open && (
        <div style={{
          padding: '0 20px 16px',
          fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7,
          borderTop: '1px solid var(--border)',
          paddingTop: 14,
        }}>
          {a}
        </div>
      )}
    </div>
  );
}

function FormularioEmail({ asunto, campos, placeholder }) {
  const [datos, setDatos] = useState({});
  const [enviado, setEnviado] = useState(false);

  const handleEnviar = () => {
    const cuerpo = campos.map(c => `${c.label}: ${datos[c.key] || ''}`).join('\n');
    const mailto = `mailto:saascompany.cr@gmail.com?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    window.location.href = mailto;
    setEnviado(true);
    setTimeout(() => setEnviado(false), 4000);
  };

  const completo = campos.every(c => !c.required || datos[c.key]?.trim());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {campos.map(c => (
        c.tipo === 'textarea'
          ? <textarea
              key={c.key}
              placeholder={c.label}
              rows={4}
              className="input-dark"
              style={{ resize: 'vertical', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}
              value={datos[c.key] || ''}
              onChange={e => setDatos(d => ({ ...d, [c.key]: e.target.value }))}
            />
          : <input
              key={c.key}
              type={c.tipo || 'text'}
              placeholder={c.label + (c.required ? ' *' : '')}
              className="input-dark"
              style={{ fontSize: 13 }}
              value={datos[c.key] || ''}
              onChange={e => setDatos(d => ({ ...d, [c.key]: e.target.value }))}
            />
      ))}
      <button
        onClick={handleEnviar}
        disabled={!completo}
        className="btn-gold"
        style={{ opacity: completo ? 1 : 0.4, cursor: completo ? 'pointer' : 'not-allowed', fontSize: 13, padding: '11px' }}
      >
        {enviado ? '✓ Abriendo tu correo...' : placeholder}
      </button>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
        Al hacer click se abrirá tu cliente de correo con el mensaje prellenado.
      </p>
    </div>
  );
}

function Section({ titulo, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '28px 24px',
    }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F5F5F5', margin: '0 0 20px' }}>
        {titulo}
      </h2>
      {children}
    </div>
  );
}

export default function Soporte() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />

      <div style={{ marginLeft: 0 }} className="main-content">
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 100px' }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 8px' }}>
              Centro de ayuda
            </p>
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(32px,7vw,48px)', color: '#F5F5F5', margin: '0 0 8px', letterSpacing: '0.04em' }}>
              Soporte
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
              Encontrá respuestas rápidas o contactanos directamente.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Estado del servidor */}
            <Section titulo="Estado del Servicio">
              <EstadoServidor />
            </Section>

            {/* FAQ */}
            <Section titulo="Preguntas Frecuentes">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
              </div>
            </Section>

            {/* Solicitar reembolso */}
            <Section titulo="Solicitar Reembolso">
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.7 }}>
                Los reembolsos aplican cuando: hubo un cobro duplicado, el plan no se activó por error técnico, o solicitás dentro de los primeros 7 días de un nuevo ciclo sin haber usado el servicio.<br/>
                <span style={{ color: '#E63946' }}>No aplica</span> si ya usaste el servicio ese período o si el trial terminó sin cancelar.
              </p>
              <FormularioEmail
                asunto="Solicitud de Reembolso — BarberSaaS"
                placeholder="Enviar solicitud de reembolso"
                campos={[
                  { key: 'nombre', label: 'Tu nombre', required: true },
                  { key: 'correo', label: 'Correo de tu cuenta', tipo: 'email', required: true },
                  { key: 'fecha', label: 'Fecha del cobro (ej: 15/04/2026)', required: true },
                  { key: 'motivo', label: 'Motivo del reembolso', tipo: 'textarea', required: true },
                ]}
              />
            </Section>

            {/* Reportar problema */}
            <Section titulo="Reportar un Problema">
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.7 }}>
                Si encontraste un error en la plataforma, describilo con el mayor detalle posible para que podamos resolverlo rápido.
              </p>
              <FormularioEmail
                asunto="Reporte de Problema — BarberSaaS"
                placeholder="Enviar reporte"
                campos={[
                  { key: 'correo', label: 'Tu correo', tipo: 'email', required: true },
                  { key: 'pantalla', label: '¿En qué pantalla ocurrió? (ej: Agenda, Panel...)', required: true },
                  { key: 'descripcion', label: 'Describí el problema con detalle', tipo: 'textarea', required: true },
                ]}
              />
            </Section>

            {/* Contacto directo */}
            <Section titulo="Contacto Directo">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px',
                  background: 'rgba(201,168,76,0.06)',
                  border: '1px solid rgba(201,168,76,0.15)',
                  borderRadius: 12,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 2px' }}>Correo de soporte</p>
                    <a href="mailto:saascompany.cr@gmail.com" style={{ fontSize: 14, color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}>
                      saascompany.cr@gmail.com
                    </a>
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9"/>
                    <polyline points="12 7 12 12 15 15"/>
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
