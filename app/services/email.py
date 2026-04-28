import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from app.core.config import settings

load_dotenv()


def enviar_email(destinatario: str, asunto: str, cuerpo_html: str):
    remitente = os.getenv("EMAIL_USER")
    password = os.getenv("EMAIL_PASSWORD")
    smtp_host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("EMAIL_PORT", "587"))

    msg = MIMEMultipart("alternative")
    msg["Subject"] = asunto
    msg["From"] = remitente
    msg["To"] = destinatario
    msg.attach(MIMEText(cuerpo_html, "html"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(remitente, password)
        server.sendmail(remitente, destinatario, msg.as_string())


def _base(contenido: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:#0A0A0A;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:560px;width:100%;background:#111111;border-radius:16px;
                      overflow:hidden;border:1px solid #222222;">

          <!-- Barra dorada superior -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,transparent 0%,#C9A84C 35%,#e8c96a 50%,#C9A84C 65%,transparent 100%);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:28px 40px 22px;border-bottom:1px solid #1E1E1E;">
              <span style="font-size:13px;font-weight:800;letter-spacing:0.18em;
                           color:#C9A84C;text-transform:uppercase;">BarberSaaS</span>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding:40px 40px 36px;">
              {contenido}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 40px;border-top:1px solid #1A1A1A;background:#0E0E0E;">
              <p style="margin:0;font-size:11px;color:#3A3A3A;line-height:1.7;">
                Recibiste este correo porque estas registrado en BarberSaaS.<br>
                Si no reconoces esta actividad, podes ignorar este mensaje.<br>
                &copy; 2025 BarberSaaS &mdash; Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _boton(texto: str, url: str, color: str = "#C9A84C", texto_color: str = "#0A0A0A") -> str:
    return f"""
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
  <tr>
    <td style="border-radius:8px;background:{color};">
      <a href="{url}"
         style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;
                color:{texto_color};text-decoration:none;letter-spacing:0.03em;
                font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">{texto}</a>
    </td>
  </tr>
</table>"""


def _titulo(texto: str, color: str = "#F5F5F5") -> str:
    return f'<h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:{color};letter-spacing:-0.01em;line-height:1.2;">{texto}</h1>'


def _parrafo(texto: str, color: str = "#888888") -> str:
    return f'<p style="margin:0 0 14px;font-size:14px;line-height:1.75;color:{color};">{texto}</p>'


def _separador() -> str:
    return '<div style="height:1px;background:#1E1E1E;margin:28px 0;"></div>'


def _dato(label: str, valor: str, valor_color: str = "#F5F5F5") -> str:
    return f"""
<tr>
  <td style="padding:12px 16px;font-size:13px;color:#555555;border-bottom:1px solid #1A1A1A;">{label}</td>
  <td style="padding:12px 16px;font-size:13px;color:{valor_color};text-align:right;font-weight:600;border-bottom:1px solid #1A1A1A;">{valor}</td>
</tr>"""


# ── Emails ─────────────────────────────────────────────────────────────────────

def enviar_bienvenida(email: str, nombre_barberia: str, link_agendamiento: str):
    contenido = f"""
{_titulo("Tu barberia ya esta activa")}
{_parrafo(f"Hola, <strong style='color:#F5F5F5;'>{nombre_barberia}</strong> esta lista para recibir reservas. Tenes 14 dias de prueba para explorar todo lo que BarberSaaS tiene para ofrecer.")}
{_separador()}
<p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#555555;text-transform:uppercase;">Tu link de agendamiento</p>
<div style="background:#161616;border:1px solid #222;border-radius:8px;padding:14px 18px;">
  <a href="{link_agendamiento}" style="font-size:13px;color:#C9A84C;text-decoration:none;word-break:break-all;">{link_agendamiento}</a>
</div>
{_boton("Ir a mi panel", f"{settings.FRONTEND_URL}/agenda")}
{_separador()}
<p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#555555;text-transform:uppercase;">Proximos pasos</p>
<table cellpadding="0" cellspacing="0" role="presentation" width="100%">
  <tr><td style="padding:10px 0;font-size:13px;color:#888;border-bottom:1px solid #1A1A1A;">
    <span style="color:#C9A84C;font-weight:700;margin-right:12px;">01</span>Agrega tus barberos desde el panel
  </td></tr>
  <tr><td style="padding:10px 0;font-size:13px;color:#888;border-bottom:1px solid #1A1A1A;">
    <span style="color:#C9A84C;font-weight:700;margin-right:12px;">02</span>Configura tus servicios y precios
  </td></tr>
  <tr><td style="padding:10px 0;font-size:13px;color:#888;">
    <span style="color:#C9A84C;font-weight:700;margin-right:12px;">03</span>Comparte tu link con tus clientes
  </td></tr>
</table>"""
    enviar_email(email, f"Bienvenido a BarberSaaS — {nombre_barberia} ya esta activa", _base(contenido))


def enviar_confirmacion_trial(email: str, nombre_barberia: str, fecha_fin: str):
    contenido = f"""
{_titulo("Tu prueba gratuita esta activa")}
{_parrafo(f"Hola, <strong style='color:#F5F5F5;'>{nombre_barberia}</strong>. Tu periodo de prueba de <strong style='color:#F5F5F5;'>14 dias</strong> en el Plan Pro esta activo.")}
{_separador()}
<table cellpadding="0" cellspacing="0" role="presentation" width="100%"
       style="border:1px solid #1E1E1E;border-radius:8px;overflow:hidden;">
  {_dato("Plan", "Pro &mdash; Mensual")}
  {_dato("Periodo de prueba", "14 dias gratis")}
  {_dato("Vence", fecha_fin, "#C9A84C")}
  {_dato("Cobro al vencer", "USD 29.00 / mes")}
</table>
{_boton("Ir a mi panel", f"{settings.FRONTEND_URL}/agenda")}
{_separador()}
<div style="background:#161616;border:1px solid #1E1E1E;border-radius:8px;padding:16px 18px;">
  <p style="margin:0;font-size:13px;color:#888888;line-height:1.7;">
    No se realizara ningun cobro hasta que finalice el periodo de prueba.<br>
    Podes cancelar en cualquier momento desde <a href="{settings.FRONTEND_URL}/cuenta" style="color:#C9A84C;text-decoration:none;">tu cuenta</a> sin costo.
  </p>
</div>"""
    enviar_email(email, "Tu prueba de 14 dias comenzo — BarberSaaS Plan Pro", _base(contenido))


def enviar_recibo_pago(email: str, nombre_barberia: str, plan: str, monto: float, periodo: str, fecha: str):
    contenido = f"""
{_titulo("Pago confirmado")}
{_parrafo(f"Hola, <strong style='color:#F5F5F5;'>{nombre_barberia}</strong>. Tu pago fue procesado correctamente. A continuacion encontras el detalle de la transaccion.")}
{_separador()}
<table cellpadding="0" cellspacing="0" role="presentation" width="100%"
       style="border:1px solid #1E1E1E;border-radius:8px;overflow:hidden;">
  {_dato("Plan", f"{plan.capitalize()} &mdash; {periodo.capitalize()}")}
  {_dato("Monto", f"USD {monto:.2f}", "#C9A84C")}
  {_dato("Fecha", fecha)}
  {_dato("Estado", "Pagado", "#4ade80")}
</table>
{_boton("Ver mi suscripcion", f"{settings.FRONTEND_URL}/cuenta")}
{_separador()}
{_parrafo("Gracias por confiar en BarberSaaS. Si tenes alguna consulta sobre este cobro, no dudes en contactarnos.", "#555555")}"""
    enviar_email(email, f"Recibo de pago — Plan {plan.capitalize()} BarberSaaS", _base(contenido))


def enviar_aviso_suspension(email: str, nombre_barberia: str):
    contenido = f"""
{_titulo("Cuenta suspendida temporalmente", "#E63946")}
{_parrafo(f"Hola, <strong style='color:#F5F5F5;'>{nombre_barberia}</strong>. Detectamos un problema al procesar tu ultimo pago, por lo que tu cuenta fue suspendida de forma temporal.")}
{_parrafo("Mientras la cuenta este suspendida, tus clientes no podran acceder al sistema de reservas. Podes reactivarla en cualquier momento actualizando tu metodo de pago.")}
{_separador()}
<div style="background:#1A0A0A;border:1px solid #3A1010;border-radius:8px;padding:18px 20px;">
  <p style="margin:0;font-size:13px;color:#E63946;font-weight:600;">Para reactivar tu cuenta, actualiza tu metodo de pago desde el portal de facturacion.</p>
</div>
{_boton("Actualizar metodo de pago", f"{settings.FRONTEND_URL}/cuenta", "#E63946", "#FFFFFF")}
{_separador()}
{_parrafo("Si ya actualizaste tu pago y el problema persiste, contactate con nosotros.", "#555555")}"""
    enviar_email(email, "Accion requerida — Tu cuenta BarberSaaS fue suspendida", _base(contenido))


def enviar_invitacion_barbero(email: str, nombre_barbero: str, nombre_barberia: str, token: str, base_url: str):
    link = f"{base_url}/activar-barbero?token={token}"
    contenido = f"""
{_titulo("Te invitaron a unirte a BarberSaaS")}
{_parrafo(f"Hola, <strong style='color:#F5F5F5;'>{nombre_barbero}</strong>. La barberia <strong style='color:#F5F5F5;'>{nombre_barberia}</strong> te agrego como barbero en BarberSaaS.")}
{_parrafo("Activa tu cuenta para comenzar a recibir turnos y gestionar tu agenda de citas.")}
{_boton("Activar mi cuenta", link)}
{_separador()}
<div style="background:#161616;border:1px solid #222;border-radius:8px;padding:14px 18px;">
  <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#555;text-transform:uppercase;">Link de activacion</p>
  <a href="{link}" style="font-size:12px;color:#C9A84C;text-decoration:none;word-break:break-all;">{link}</a>
</div>
{_separador()}
{_parrafo("Este link expira en 48 horas. Si no esperabas esta invitacion, podes ignorar este correo.", "#555555")}"""
    enviar_email(email, f"Invitacion para unirte a {nombre_barberia} en BarberSaaS", _base(contenido))


def enviar_verificacion_email(email: str, token: str, base_url: str):
    link = f"{base_url}/verificar-email?token={token}"
    contenido = f"""
{_titulo("Verifica tu direccion de email")}
{_parrafo("Solo falta un paso para activar tu cuenta en BarberSaaS. Hace clic en el boton para confirmar tu direccion de email y comenzar a usar la plataforma.")}
{_boton("Verificar mi email", link)}
{_separador()}
<div style="background:#161616;border:1px solid #222;border-radius:8px;padding:14px 18px;">
  <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#555;text-transform:uppercase;">Si el boton no funciona, usa este link</p>
  <a href="{link}" style="font-size:12px;color:#C9A84C;text-decoration:none;word-break:break-all;">{link}</a>
</div>
{_separador()}
{_parrafo("Este link es valido por 24 horas. Si no creaste una cuenta en BarberSaaS, podes ignorar este correo.", "#555555")}"""
    enviar_email(email, "Verifica tu email — BarberSaaS", _base(contenido))


def enviar_reset_password(email: str, token: str, base_url: str):
    link = f"{base_url}/reset-password?token={token}"
    contenido = f"""
{_titulo("Restablecer contrasena")}
{_parrafo("Recibimos una solicitud para restablecer la contrasena de tu cuenta. Hace clic en el boton para crear una nueva contrasena.")}
{_boton("Restablecer contrasena", link)}
{_separador()}
<div style="background:#161616;border:1px solid #222;border-radius:8px;padding:14px 18px;">
  <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#555;text-transform:uppercase;">Si el boton no funciona, usa este link</p>
  <a href="{link}" style="font-size:12px;color:#C9A84C;text-decoration:none;word-break:break-all;">{link}</a>
</div>
{_separador()}
<div style="background:#161616;border:1px solid #1E1E1E;border-radius:8px;padding:14px 18px;">
  <p style="margin:0;font-size:13px;color:#888888;line-height:1.6;">
    Este link expira en <strong style="color:#F5F5F5;">15 minutos</strong> y solo puede usarse una vez.<br>
    Si no solicitaste el restablecimiento de contrasena, podes ignorar este correo. Tu cuenta permanece segura.
  </p>
</div>"""
    enviar_email(email, "Restablece tu contrasena — BarberSaaS", _base(contenido))
