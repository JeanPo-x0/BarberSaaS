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

def enviar_bienvenida(email: str, nombre_barberia: str, link_agendamiento: str):
    cuerpo = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background:#111; color:#fff; padding:32px; border-radius:12px;">
        <h2 style="color:#facc15; margin-bottom:4px;">Bienvenido a BarberSaaS</h2>
        <p style="color:#ccc;">Tu barbería <strong style="color:#fff;">{nombre_barberia}</strong> ya está lista. Tienes <strong>14 días de prueba gratis</strong>.</p>
        <h3 style="color:#facc15;">Tu link de agendamiento:</h3>
        <a href="{link_agendamiento}" style="display:inline-block;background:#facc15;color:#111;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">{link_agendamiento}</a>
        <p style="color:#aaa; margin-top:24px;">Pasos para arrancar:</p>
        <ol style="color:#ccc; line-height:1.8;">
            <li>Agrega tus barberos en el Panel</li>
            <li>Configura tus servicios y precios</li>
            <li>Comparte tu link con tus clientes</li>
        </ol>
        <p style="color:#666; font-size:12px; margin-top:24px;">BarberSaaS — gestiona tu barbería como un pro.</p>
    </div>
    """
    enviar_email(email, f"¡Bienvenido a BarberSaaS! Tu link de agendamiento está listo", cuerpo)


def enviar_recibo_pago(email: str, nombre_barberia: str, plan: str, monto: float, periodo: str, fecha: str):
    cuerpo = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background:#111; color:#fff; padding:32px; border-radius:12px;">
        <h2 style="color:#facc15;">Recibo de pago ✅</h2>
        <p style="color:#ccc;">Hola <strong style="color:#fff;">{nombre_barberia}</strong>, tu pago fue procesado exitosamente.</p>
        <table style="width:100%; border-collapse:collapse; margin:20px 0;">
            <tr style="border-bottom:1px solid #333;">
                <td style="padding:10px; color:#aaa;">Plan</td>
                <td style="padding:10px; color:#fff; text-align:right; text-transform:capitalize;">{plan} ({periodo})</td>
            </tr>
            <tr style="border-bottom:1px solid #333;">
                <td style="padding:10px; color:#aaa;">Monto</td>
                <td style="padding:10px; color:#facc15; text-align:right; font-weight:bold;">${monto:.2f} USD</td>
            </tr>
            <tr>
                <td style="padding:10px; color:#aaa;">Fecha</td>
                <td style="padding:10px; color:#fff; text-align:right;">{fecha}</td>
            </tr>
        </table>
        <p style="color:#666; font-size:12px;">Gracias por usar BarberSaaS.</p>
    </div>
    """
    enviar_email(email, f"Recibo de pago — BarberSaaS Plan {plan.capitalize()}", cuerpo)


def enviar_aviso_suspension(email: str, nombre_barberia: str):
    cuerpo = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background:#111; color:#fff; padding:32px; border-radius:12px;">
        <h2 style="color:#ef4444;">Cuenta suspendida ⚠️</h2>
        <p style="color:#ccc;">Hola <strong style="color:#fff;">{nombre_barberia}</strong>, tu cuenta ha sido <strong style="color:#ef4444;">suspendida</strong> porque no pudimos procesar tu pago.</p>
        <p style="color:#ccc;">Para reactivar tu cuenta, actualiza tu método de pago:</p>
        <a href="{settings.FRONTEND_URL}/suscripcion/portal" style="display:inline-block;background:#facc15;color:#111;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Actualizar método de pago</a>
        <p style="color:#666; font-size:12px; margin-top:24px;">Si necesitas ayuda contáctanos.</p>
    </div>
    """
    enviar_email(email, "Tu cuenta BarberSaaS fue suspendida — actualiza tu pago", cuerpo)


def enviar_reset_password(email: str, token: str, base_url: str):
    link = f"{base_url}/reset-password?token={token}"
    cuerpo = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #facc15;">BarberSaaS</h2>
        <p>Recibimos una solicitud para restablecer tu contrasena.</p>
        <p>Haz click en el boton para crear una nueva contrasena:</p>
        <a href="{link}" style="
            display: inline-block;
            background: #facc15;
            color: #111;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            margin: 16px 0;
        ">Restablecer contrasena</a>
        <p style="color: #888; font-size: 13px;">Este link expira en 15 minutos y solo puede usarse una vez.</p>
        <p style="color: #888; font-size: 13px;">Si no solicitaste esto, ignora este correo.</p>
    </div>
    """
    enviar_email(email, "Restablecer contrasena — BarberSaaS", cuerpo)
