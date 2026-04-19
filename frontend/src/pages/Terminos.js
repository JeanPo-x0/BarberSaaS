import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    id: 'uso',
    title: '1. Uso del Servicio',
    content: `BarberSaaS es una plataforma de gestión de citas y administración para barberías, disponible para establecimientos en Costa Rica y otros países de habla hispana. Al utilizar el servicio, el usuario acepta cumplir con estos términos en su totalidad.

El servicio está destinado a propietarios de barberías ("dueños") y a sus clientes finales ("usuarios"). Los dueños son responsables del uso correcto de la plataforma dentro de su establecimiento y de garantizar que sus clientes estén informados sobre el uso de sus datos.

Está prohibido usar BarberSaaS para actividades ilegales, fraudulentas o que violen los derechos de terceros. Nos reservamos el derecho de suspender o cancelar cuentas que incumplan estas condiciones sin previo aviso.`,
  },
  {
    id: 'responsabilidad',
    title: '2. Responsabilidad del Prestador',
    content: `BarberSaaS provee la plataforma tecnológica "tal cual" (as-is). Si bien nos esforzamos por mantener el servicio disponible de manera continua, no garantizamos una disponibilidad ininterrumpida del 100%, ya que pueden presentarse períodos de mantenimiento, actualizaciones o situaciones fuera de nuestro control.

BarberSaaS no se hace responsable por:
- Pérdidas económicas derivadas de interrupciones del servicio.
- Errores u omisiones en la información ingresada por el dueño o los clientes.
- Incumplimientos de citas por parte de clientes o barberos.
- Daños indirectos, incidentales o consecuentes relacionados con el uso de la plataforma.

La responsabilidad total de BarberSaaS ante cualquier reclamación no excederá el monto pagado por el usuario en los tres (3) meses anteriores al evento que origina la reclamación.`,
  },
  {
    id: 'cancelacion',
    title: '3. Política de Cancelación',
    content: `Los clientes pueden cancelar o reprogramar citas a través de los canales habilitados por cada barbería (WhatsApp, enlace de agendamiento, etc.).

Cada barbería puede configurar su propia política de cancelación dentro de la plataforma, incluyendo:
- Un tiempo mínimo de anticipación requerido para cancelaciones sin costo (por ejemplo, 24 horas antes de la cita).
- Un porcentaje de cobro sobre el valor del servicio en caso de cancelaciones tardías o inasistencias (no-show), según lo establecido por el dueño de la barbería.

BarberSaaS actúa únicamente como intermediario tecnológico. La aplicación o no de cargos por cancelación es responsabilidad exclusiva de cada barbería. Se recomienda a los clientes revisar la política de cancelación del establecimiento antes de agendar.`,
  },
  {
    id: 'pagos',
    title: '4. Pagos y Reembolsos',
    content: `Las suscripciones a los planes de BarberSaaS se cobran de forma mensual o anual, según la elección del dueño de la barbería al momento del registro. Los pagos se procesan a través de pasarelas de pago seguras de terceros.

Período de prueba: Los nuevos usuarios tienen acceso a un período de prueba gratuito (actualmente 14 días) sin necesidad de proporcionar información de pago. Al finalizar el período de prueba, se requerirá la suscripción a un plan pago para continuar usando las funcionalidades completas.

Reembolsos: No se realizan reembolsos por períodos ya facturados, salvo que exista un fallo técnico grave atribuible directamente a BarberSaaS que haya impedido el uso del servicio por un período prolongado. Cualquier solicitud de reembolso debe enviarse a nuestro correo de contacto dentro de los 7 días calendario posteriores al cobro.

Precios: BarberSaaS se reserva el derecho de modificar los precios de los planes con un aviso previo de al menos 30 días a los usuarios activos.`,
  },
  {
    id: 'datos',
    title: '5. Datos Personales',
    content: `El tratamiento de datos personales en BarberSaaS se rige por la Ley N.° 8968 — Ley de Protección de la Persona frente al tratamiento de sus datos personales — de la República de Costa Rica, y su reglamento.

Los datos recopilados (nombre, número de teléfono WhatsApp, historial de citas) se utilizan exclusivamente para proveer el servicio de agendamiento y enviar notificaciones relacionadas con las citas. No se venden ni se comparten con terceros con fines comerciales ajenos al servicio.

Los titulares de los datos tienen derecho a:
- Acceder a sus datos personales almacenados en la plataforma.
- Solicitar la rectificación de datos incorrectos o incompletos.
- Solicitar la supresión de sus datos, sujeto a obligaciones legales vigentes.
- Oponerse al tratamiento de sus datos en los casos contemplados por la ley.

Para ejercer cualquiera de estos derechos, el titular debe enviar una solicitud escrita al correo de contacto indicado en la sección 6 de estos términos. Atenderemos su solicitud en un plazo máximo de 10 días hábiles.

Para mayor detalle, consulte nuestra Política de Privacidad.`,
  },
  {
    id: 'contacto',
    title: '6. Contacto',
    content: `Para consultas, reclamos o solicitudes relacionadas con estos Términos y Condiciones, puede comunicarse con nosotros a través de los siguientes medios:

Correo electrónico: soporte@barbersaas.com
WhatsApp: disponible en la plataforma una vez iniciada sesión.

BarberSaaS opera desde Costa Rica. Cualquier controversia derivada de estos términos se resolverá de conformidad con la legislación costarricense vigente.

Última actualización: abril de 2026.`,
  },
];

export default function Terminos() {
  return (
    <div
      className="bg-orbs bg-noise"
      style={{
        minHeight: '100vh',
        background: '#0A0A0A',
        color: '#F5F5F5',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Simple header */}
      <header
        style={{
          borderBottom: '1px solid rgba(201,168,76,0.18)',
          padding: '0 24px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(10,10,10,0.9)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Link
          to="/"
          style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 22,
            color: '#C9A84C',
            textDecoration: 'none',
            letterSpacing: '0.08em',
          }}
        >
          BarberSaaS
        </Link>
        <Link
          to="/"
          style={{
            fontSize: 14,
            color: '#8A8A8A',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#F5F5F5')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8A8A8A')}
        >
          ← Volver
        </Link>
      </header>

      {/* Content */}
      <main
        className="mobile-px"
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '56px 24px 80px',
        }}
      >
        {/* Page title */}
        <div style={{ marginBottom: 48 }}>
          <p
            style={{
              fontSize: 12,
              color: '#C9A84C',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              margin: '0 0 14px 0',
            }}
          >
            Documento legal
          </p>
          <h1
            style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 'clamp(38px, 8vw, 60px)',
              color: '#F5F5F5',
              margin: '0 0 16px 0',
              letterSpacing: '0.04em',
              lineHeight: 1.05,
            }}
          >
            Términos y Condiciones
          </h1>
          <p style={{ color: '#8A8A8A', fontSize: 15, margin: 0, lineHeight: 1.7 }}>
            Lea detenidamente estos términos antes de utilizar la plataforma BarberSaaS.
            Al registrarse o hacer uso del servicio, usted acepta quedar vinculado por las
            condiciones aquí descritas.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {SECTIONS.map((sec) => (
            <section key={sec.id} id={sec.id}>
              <h2
                style={{
                  fontFamily: "'Bebas Neue', cursive",
                  fontSize: 'clamp(20px, 4vw, 26px)',
                  color: '#C9A84C',
                  margin: '0 0 14px 0',
                  letterSpacing: '0.06em',
                  borderBottom: '1px solid rgba(201,168,76,0.15)',
                  paddingBottom: 10,
                }}
              >
                {sec.title}
              </h2>
              {sec.content.split('\n\n').map((para, i) => {
                if (para.startsWith('-')) {
                  const items = para
                    .split('\n')
                    .filter((l) => l.startsWith('-'))
                    .map((l) => l.replace(/^-\s*/, ''));
                  return (
                    <ul
                      key={i}
                      style={{
                        margin: '10px 0',
                        paddingLeft: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      {items.map((item, j) => (
                        <li
                          key={j}
                          style={{
                            fontSize: 15,
                            color: '#8A8A8A',
                            lineHeight: 1.7,
                            listStyle: 'none',
                            paddingLeft: 16,
                            position: 'relative',
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              left: 0,
                              color: '#C9A84C',
                              fontWeight: 700,
                            }}
                          >
                            ·
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p
                    key={i}
                    style={{
                      fontSize: 15,
                      color: '#8A8A8A',
                      lineHeight: 1.8,
                      margin: '0 0 12px 0',
                    }}
                  >
                    {para}
                  </p>
                );
              })}
            </section>
          ))}
        </div>

        {/* Bottom note */}
        <div
          style={{
            marginTop: 56,
            padding: '20px 24px',
            background: 'rgba(201,168,76,0.05)',
            border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: 12,
          }}
        >
          <p style={{ fontSize: 13, color: '#8A8A8A', margin: 0, lineHeight: 1.7 }}>
            ¿Tiene dudas sobre estos términos?{' '}
            <Link
              to="/privacidad"
              style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}
            >
              Consulte también nuestra Política de Privacidad
            </Link>
            {' '}o escríbanos a{' '}
            <a
              href="mailto:soporte@barbersaas.com"
              style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}
            >
              soporte@barbersaas.com
            </a>
            .
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '24px',
          textAlign: 'center',
          background: '#111111',
        }}
      >
        <p style={{ fontSize: 12, color: '#8A8A8A', margin: 0 }}>
          © 2026 BarberSaaS &mdash; Hecho en Costa Rica &mdash;{' '}
          <Link to="/privacidad" style={{ color: '#C9A84C', textDecoration: 'none' }}>
            Política de Privacidad
          </Link>
        </p>
      </footer>
    </div>
  );
}
