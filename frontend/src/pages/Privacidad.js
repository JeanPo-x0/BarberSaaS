import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    id: 'que-datos',
    title: '1. Qué Datos Recopilamos',
    content: `BarberSaaS recopila únicamente los datos personales estrictamente necesarios para prestar el servicio de agendamiento de citas. Estos son:

- Nombre completo o nombre de pila del cliente.
- Número de teléfono asociado a WhatsApp.
- Historial de citas (fecha, hora, servicio solicitado, barbería visitada).
- Información del dueño de la barbería: nombre, correo electrónico y datos del establecimiento (nombre, dirección, horario).

No recopilamos datos sensibles como número de cédula, datos bancarios propios del cliente final ni información de salud. Los datos de pago de suscripciones son procesados directamente por la pasarela de pago y nunca quedan almacenados en nuestros servidores.`,
  },
  {
    id: 'como-usamos',
    title: '2. Cómo Usamos Sus Datos',
    content: `Los datos personales recopilados se utilizan exclusivamente para los siguientes fines:

- Agendar, confirmar, modificar o cancelar citas en nombre del cliente.
- Enviar recordatorios automáticos vía WhatsApp (24 horas y 1 hora antes de la cita).
- Notificar disponibilidad en lista de espera cuando se libera un turno.
- Permitir al dueño de la barbería gestionar su agenda y consultar el historial de clientes.
- Mejorar la experiencia de uso de la plataforma mediante análisis estadísticos agregados y anónimos.

Nunca utilizamos sus datos para enviar publicidad de terceros, ni para ningún propósito ajeno al servicio de agendamiento.`,
  },
  {
    id: 'con-quien',
    title: '3. Con Quién Compartimos Sus Datos',
    content: `BarberSaaS no vende, alquila ni comercializa datos personales a terceros bajo ninguna circunstancia.

Los datos son compartidos únicamente con los siguientes proveedores de servicios tecnológicos, quienes actúan como encargados del tratamiento bajo acuerdos de confidencialidad:

- Twilio Inc.: proveedor del servicio de mensajería WhatsApp utilizado para enviar confirmaciones y recordatorios de citas. Twilio procesa el número de teléfono del cliente para la entrega de mensajes. Puede consultar la política de privacidad de Twilio en twilio.com/legal/privacy.
- Proveedores de infraestructura en la nube (servidores y bases de datos): utilizados para almacenar la información de manera segura.

En caso de requerimiento legal o judicial por parte de autoridades competentes de la República de Costa Rica, BarberSaaS podrá divulgar la información estrictamente necesaria para cumplir con dicha obligación legal.`,
  },
  {
    id: 'derechos',
    title: '4. Derechos del Usuario',
    content: `De conformidad con la Ley N.° 8968 — Ley de Protección de la Persona frente al tratamiento de sus datos personales — de la República de Costa Rica, usted tiene los siguientes derechos como titular de sus datos:

- Acceso: solicitar una copia de los datos personales que BarberSaaS tiene sobre usted.
- Rectificación: solicitar la corrección de datos inexactos, incompletos o desactualizados.
- Supresión (derecho al olvido): solicitar la eliminación de sus datos cuando ya no sean necesarios para el propósito con que fueron recopilados, o cuando retire su consentimiento, salvo que exista una obligación legal de conservarlos.
- Oposición: oponerse al tratamiento de sus datos en los supuestos legalmente establecidos.
- Limitación del tratamiento: solicitar que sus datos no sean utilizados para determinados fines mientras se resuelve una reclamación.

Para ejercer cualquiera de estos derechos, envíe una solicitud escrita con su nombre completo y número de teléfono al correo soporte@barbersaas.com. Atenderemos su solicitud en un plazo máximo de 10 días hábiles, conforme lo establece la ley.

Si considera que sus derechos han sido vulnerados, puede presentar una denuncia ante la Agencia de Protección de Datos de los Habitantes (PRODHAB) de Costa Rica.`,
  },
  {
    id: 'seguridad',
    title: '5. Seguridad de los Datos',
    content: `BarberSaaS implementa medidas técnicas y organizativas razonables para proteger los datos personales contra acceso no autorizado, pérdida, destrucción o alteración. Entre estas medidas se incluyen:

- Conexiones cifradas mediante HTTPS/TLS.
- Contraseñas almacenadas con algoritmos de hash seguros (bcrypt).
- Acceso restringido a los datos según el rol del usuario (dueño, administrador).
- Copias de seguridad periódicas de la base de datos.

Ningún sistema es 100% infalible. En caso de una brecha de seguridad que afecte sus datos, le notificaremos en un plazo razonable y tomaremos las medidas correctivas pertinentes.`,
  },
  {
    id: 'retencion',
    title: '6. Retención de Datos',
    content: `Los datos de clientes se conservan mientras la cuenta de la barbería permanezca activa en BarberSaaS. Si un dueño cancela su suscripción y solicita la eliminación de su cuenta, los datos asociados a sus clientes serán eliminados en un plazo máximo de 30 días, salvo obligación legal de retención.

Los clientes individuales que deseen eliminar sus datos pueden solicitarlo directamente a la barbería o escribirnos al correo de contacto.`,
  },
  {
    id: 'contacto',
    title: '7. Contacto',
    content: `Para consultas, solicitudes o reclamos relacionados con el tratamiento de sus datos personales, puede comunicarse con nosotros a través de:

Correo electrónico: soporte@barbersaas.com
Responsable del tratamiento: BarberSaaS, operado desde Costa Rica.

Esta Política de Privacidad puede ser actualizada periódicamente. Le notificaremos cambios relevantes a través del correo registrado o mediante un aviso visible en la plataforma.

Última actualización: abril de 2026.`,
  },
];

export default function Privacidad() {
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
            Política de Privacidad
          </h1>
          <p style={{ color: '#8A8A8A', fontSize: 15, margin: 0, lineHeight: 1.7 }}>
            En BarberSaaS nos tomamos la privacidad de nuestros usuarios en serio. Este
            documento explica qué datos recopilamos, para qué los usamos y cómo los
            protegemos, de conformidad con la Ley 8968 de Costa Rica.
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
            ¿Tiene más preguntas sobre su privacidad?{' '}
            <Link
              to="/terminos"
              style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}
            >
              Consulte también nuestros Términos y Condiciones
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
          <Link to="/terminos" style={{ color: '#C9A84C', textDecoration: 'none' }}>
            Términos y Condiciones
          </Link>
        </p>
      </footer>
    </div>
  );
}
