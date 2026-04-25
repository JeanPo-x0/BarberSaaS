import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    id: 'uso',
    title: '1. Uso del Servicio',
    content: `BarberSaaS es una plataforma de gestión de citas y administración para barberías, disponible para establecimientos en Costa Rica y otros países de habla hispana. Al utilizar el servicio, el usuario acepta cumplir con estos términos en su totalidad.

La plataforma está destinada a tres tipos de usuarios:
- Dueños de barbería: responsables de la configuración del establecimiento, la gestión de barberos y los servicios ofrecidos.
- Barberos: empleados o colaboradores con acceso a su agenda personal mediante cuenta propia, invitados por el dueño.
- Clientes: personas que agendan citas a través del enlace público de la barbería.

Los dueños son responsables del uso correcto de la plataforma dentro de su establecimiento, de la configuración de políticas de pago y cancelación, y de garantizar que sus clientes estén informados sobre el uso de sus datos.

Está prohibido usar BarberSaaS para actividades ilegales, fraudulentas o que violen los derechos de terceros. Nos reservamos el derecho de suspender o cancelar cuentas que incumplan estas condiciones sin previo aviso.`,
  },
  {
    id: 'agendamiento',
    title: '2. Agendamiento y Servicios',
    content: `Los clientes pueden agendar citas seleccionando uno o varios servicios simultáneamente (por ejemplo: corte + barba + cejas). La duración total y el precio se calculan automáticamente según los servicios seleccionados.

El agendamiento queda sujeto a la disponibilidad del barbero seleccionado y al horario configurado por el dueño de la barbería. Cada barbería define sus días de atención y horario de apertura/cierre; los días cerrados aparecen deshabilitados en el calendario de reservas y no pueden ser seleccionados por el cliente.

BarberSaaS no garantiza la disponibilidad de un turno específico y no se hace responsable por errores en la disponibilidad mostrada si la barbería no mantiene su agenda y horario actualizados.

Cada cita queda registrada con el cliente, el barbero asignado, los servicios seleccionados y el método de pago indicado. El cliente recibirá una confirmación vía WhatsApp al momento de agendar.`,
  },
  {
    id: 'cancelacion',
    title: '3. Política de Cancelación',
    content: `Los clientes pueden cancelar citas respondiendo CANCELAR al número de WhatsApp de la barbería.

Cada barbería configura su propia política de cancelación dentro de la plataforma, la cual es informada al cliente antes de confirmar el agendamiento e incluye:
- Un tiempo mínimo de anticipación para cancelar sin costo (configurable por el dueño).
- Un porcentaje de retención sobre el monto pagado en caso de cancelación tardía o inasistencia (no-show).

BarberSaaS actúa únicamente como intermediario tecnológico. La aplicación de cargos por cancelación es responsabilidad exclusiva de cada barbería. El cliente acepta esta política al confirmar su cita.`,
  },
  {
    id: 'pagos-citas',
    title: '4. Pagos de Citas (SINPE / Efectivo)',
    content: `Las barberías pueden requerir un depósito previo para confirmar la cita, configurable como porcentaje del valor total. Los métodos de pago habilitados por cada barbería pueden incluir:
- SINPE Móvil: el cliente realiza la transferencia al número indicado y sube el comprobante a través de la plataforma. El dueño o barbero confirma o rechaza el comprobante manualmente.
- Efectivo: el pago se realiza en el establecimiento al momento de la cita.

BarberSaaS no procesa ni retiene dinero de las citas. Actúa únicamente como intermediario para la coordinación del pago entre el cliente y la barbería. Cualquier disputa sobre el monto, reembolso o confirmación de pago debe resolverse directamente entre el cliente y la barbería.

Los comprobantes de pago (imágenes) subidos por los clientes se almacenan de forma segura y son accesibles únicamente por el dueño y el barbero asignado a la cita.`,
  },
  {
    id: 'suscripciones',
    title: '5. Suscripciones y Facturación',
    content: `Las suscripciones a los planes de BarberSaaS se cobran de forma mensual o anual, según la elección del dueño al momento del registro. Los pagos de suscripción se procesan mediante Stripe, una pasarela de pago certificada PCI DSS. BarberSaaS no almacena datos de tarjetas de crédito en sus servidores.

Período de prueba: Los nuevos usuarios tienen acceso a 14 días de prueba gratuita al registrar un método de pago válido. Al finalizar el período de prueba, se cobra automáticamente el plan seleccionado.

Cancelación durante el trial: Si cancelás antes de que terminen los 14 días, no se realiza ningún cobro y la cuenta conserva acceso hasta que venza el plazo.

Cancelación de plan activo: La suscripción permanece activa hasta el fin del período ya pagado. No se generan cobros adicionales ni se reembolsa el período en curso.

Reembolsos: No se realizan reembolsos por períodos ya facturados, salvo fallo técnico grave atribuible a BarberSaaS. Las solicitudes deben enviarse a saascompany.cr@gmail.com dentro de los 7 días calendario posteriores al cobro.

Precios: BarberSaaS se reserva el derecho de modificar los precios con un aviso previo de al menos 30 días a los usuarios activos.`,
  },
  {
    id: 'responsabilidad',
    title: '6. Responsabilidad del Prestador',
    content: `BarberSaaS provee la plataforma tecnológica "tal cual" (as-is). No garantizamos disponibilidad ininterrumpida del 100%, ya que pueden presentarse períodos de mantenimiento o situaciones fuera de nuestro control.

BarberSaaS no se hace responsable por:
- Pérdidas económicas derivadas de interrupciones del servicio.
- Errores en la información ingresada por el dueño, barberos o clientes.
- Incumplimientos de citas por parte de clientes o barberos.
- Disputas de pago entre clientes y barberías.
- Daños indirectos, incidentales o consecuentes relacionados con el uso de la plataforma.

La responsabilidad total de BarberSaaS ante cualquier reclamación no excederá el monto pagado por el usuario en los tres (3) meses anteriores al evento.`,
  },
  {
    id: 'datos',
    title: '7. Datos Personales',
    content: `El tratamiento de datos personales en BarberSaaS se rige por la Ley N.° 8968 — Ley de Protección de la Persona frente al tratamiento de sus datos personales — de la República de Costa Rica, y su reglamento.

Los datos recopilados (nombre, teléfono WhatsApp, email del barbero, historial de citas) se utilizan exclusivamente para proveer el servicio. No se venden ni se comparten con terceros con fines comerciales ajenos al servicio.

Los titulares de los datos tienen derecho a:
- Acceder a sus datos personales almacenados en la plataforma.
- Solicitar la rectificación de datos incorrectos o incompletos.
- Solicitar la supresión de sus datos, sujeto a obligaciones legales vigentes.
- Oponerse al tratamiento de sus datos en los casos contemplados por la ley.

Para ejercer cualquiera de estos derechos, envíe una solicitud a saascompany.cr@gmail.com. La atenderemos en un plazo máximo de 10 días hábiles. Para mayor detalle, consulte nuestra Política de Privacidad.`,
  },
  {
    id: 'modificaciones',
    title: '8. Modificaciones a los Términos',
    content: `BarberSaaS se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Cuando se realicen cambios relevantes, notificaremos a los usuarios activos mediante un aviso en la plataforma o por correo electrónico con al menos 15 días de anticipación.

El uso continuado del servicio tras la entrada en vigor de los nuevos términos constituye su aceptación. Si no está de acuerdo, puede cancelar su suscripción antes de la fecha de entrada en vigor.`,
  },
  {
    id: 'contacto',
    title: '9. Contacto',
    content: `Para consultas, reclamos o solicitudes relacionadas con estos Términos y Condiciones:

Correo electrónico: saascompany.cr@gmail.com

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
              href="mailto:saascompany.cr@gmail.com"
              style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}
            >
              saascompany.cr@gmail.com
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
          © {new Date().getFullYear()} BarberSaaS &mdash; Hecho en Costa Rica &mdash;{' '}
          <Link to="/privacidad" style={{ color: '#C9A84C', textDecoration: 'none' }}>
            Política de Privacidad
          </Link>
        </p>
      </footer>
    </div>
  );
}
