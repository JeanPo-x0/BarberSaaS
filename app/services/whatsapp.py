import os
from twilio.rest import Client
from dotenv import load_dotenv
from app.utils.phone import formatear_telefono

load_dotenv()

TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
FROM = os.getenv("TWILIO_WHATSAPP_FROM")

if not TWILIO_SID or not TWILIO_TOKEN:
    print("[WhatsApp] ADVERTENCIA: TWILIO_ACCOUNT_SID o TWILIO_AUTH_TOKEN no estan configurados.")

client = Client(TWILIO_SID, TWILIO_TOKEN)

def enviar_mensaje(telefono: str, mensaje: str, media_url: str = None):
    if not FROM:
        print("[WhatsApp] ERROR: TWILIO_WHATSAPP_FROM no esta configurado.")
        return
    if not TWILIO_SID or not TWILIO_TOKEN:
        print("[WhatsApp] ERROR: Credenciales de Twilio no configuradas.")
        return

    numero_e164 = formatear_telefono(telefono)
    numero_wa = f"whatsapp:{numero_e164}"

    try:
        kwargs = dict(from_=FROM, to=numero_wa, body=mensaje)
        if media_url:
            kwargs["media_url"] = [media_url]
        msg = client.messages.create(**kwargs)
        print(f"[WhatsApp] Enviado a {numero_wa} | SID: {msg.sid}")
    except Exception as e:
        print(f"[WhatsApp] ERROR enviando a {numero_wa}: {e}")


def confirmar_cita(
    telefono: str, nombre: str, fecha_hora: str,
    servicio: str, barbero: str,
    barberia_nombre: str = "", link_agendamiento: str = "",
):
    mensaje = (
        f"✅ *Reserva confirmada{f' en {barberia_nombre}' if barberia_nombre else ''}*\n\n"
        f"Hola {nombre}, tu cita quedó agendada con éxito.\n\n"
        f"📅 *Fecha y hora:* {fecha_hora}\n"
        f"✂️ *Servicio:* {servicio}\n"
        f"💈 *Barbero:* {barbero}\n\n"
        f"Para cancelar tu cita respondé *CANCELAR* a este mensaje."
    )
    enviar_mensaje(telefono, mensaje)


def confirmar_cita_pago_pendiente(
    telefono: str, nombre: str, fecha_hora: str,
    servicio: str, barbero: str,
    barberia_nombre: str = "",
):
    mensaje = (
        f"⏳ *Reserva recibida{f' en {barberia_nombre}' if barberia_nombre else ''}*\n\n"
        f"Hola {nombre}, recibimos tu solicitud de cita.\n\n"
        f"📅 *Fecha y hora:* {fecha_hora}\n"
        f"✂️ *Servicio:* {servicio}\n"
        f"💈 *Barbero:* {barbero}\n\n"
        f"💳 Tu pago SINPE está *pendiente de verificación*. Una vez que el equipo confirme "
        f"el comprobante, tu cita quedará reservada definitivamente.\n\n"
        f"Si querés cancelar antes de que se confirme, respondé *CANCELAR*."
    )
    enviar_mensaje(telefono, mensaje)


def recordatorio_cita(telefono: str, nombre: str, fecha_hora: str, barberia_nombre: str = ""):
    mensaje = (
        f"⏰ *Recordatorio de cita{f' — {barberia_nombre}' if barberia_nombre else ''}*\n\n"
        f"Hola {nombre}, mañana tenés una cita reservada.\n\n"
        f"📅 *Hora:* {fecha_hora}\n\n"
        f"Si no podés asistir, respondé *CANCELAR* para liberar el turno."
    )
    enviar_mensaje(telefono, mensaje)


def recordatorio_1h(telefono: str, nombre: str, fecha_hora: str, barberia_nombre: str = ""):
    mensaje = (
        f"🔔 *Tu cita comienza en 1 hora{f' — {barberia_nombre}' if barberia_nombre else ''}*\n\n"
        f"Hola {nombre}, te recordamos que tu cita es a las *{fecha_hora}*.\n\n"
        f"¡Te esperamos! Si no podés asistir, respondé *CANCELAR*."
    )
    enviar_mensaje(telefono, mensaje)


def notificar_cancelacion(telefono: str, nombre: str, link_agendamiento: str = "", barberia_nombre: str = ""):
    mensaje = (
        f"Tu cita{f' en *{barberia_nombre}*' if barberia_nombre else ''} fue cancelada.\n\n"
        f"Hola {nombre}, lamentamos informarte que tu cita fue cancelada por la barbería.\n\n"
        f"Podés agendar una nueva cita cuando gustés"
        + (f":\n{link_agendamiento}" if link_agendamiento else ".")
    )
    enviar_mensaje(telefono, mensaje)


def notificar_barbero_nueva_cita(
    telefono: str, nombre_barbero: str, cliente: str, servicio: str, fecha_hora: str,
):
    mensaje = (
        f"🔔 *Nueva reserva*\n\n"
        f"Hola {nombre_barbero}, tenés una nueva cita agendada:\n\n"
        f"👤 *Cliente:* {cliente}\n"
        f"✂️ *Servicio:* {servicio}\n"
        f"📅 *Fecha y hora:* {fecha_hora}"
    )
    enviar_mensaje(telefono, mensaje)


def notificar_barbero_cancelacion(
    telefono: str, nombre_barbero: str, cliente: str, fecha_hora: str,
):
    mensaje = (
        f"❌ *Cita cancelada*\n\n"
        f"Hola {nombre_barbero}, {cliente} canceló su cita del *{fecha_hora}*.\n\n"
        f"Ese horario quedó disponible para nuevas reservas."
    )
    enviar_mensaje(telefono, mensaje)


def notificar_completada_cliente(telefono: str, nombre: str, barberia_nombre: str, link_agendamiento: str = ""):
    mensaje = (
        f"✅ *¡Gracias por tu visita a {barberia_nombre}!*\n\n"
        f"Hola {nombre}, fue un placer atenderte. Tu cita quedó registrada como completada.\n\n"
        f"Cuando quieras reservar de nuevo, estamos para servirte"
        + (f":\n{link_agendamiento}" if link_agendamiento else ".")
    )
    enviar_mensaje(telefono, mensaje)


def notificar_cobro_efectivo(telefono: str, nombre: str, servicio: str, monto: float, barberia_nombre: str = ""):
    mensaje = (
        f"✅ *Pago en efectivo registrado{f' — {barberia_nombre}' if barberia_nombre else ''}*\n\n"
        f"Hola {nombre}, el pago de tu cita fue registrado exitosamente.\n\n"
        f"✂️ *Servicio:* {servicio}\n"
        f"💵 *Monto:* ₡{monto:,.0f}\n\n"
        f"¡Gracias por elegirnos! Hasta la próxima."
    )
    enviar_mensaje(telefono, mensaje)


def notificar_lista_espera(
    telefono: str, nombre: str, barberia_nombre: str, link_agendamiento: str,
):
    mensaje = (
        f"🔔 *¡Turno disponible en {barberia_nombre}!*\n\n"
        f"Hola {nombre}, se liberó un espacio en la agenda.\n\n"
        f"Tenés *30 minutos* para confirmar tu cita:\n"
        f"{link_agendamiento}\n\n"
        f"Si no confirmás en ese tiempo, ofreceremos el turno al siguiente en lista."
    )
    enviar_mensaje(telefono, mensaje)


def notificar_comprobante_barbero(
    telefono: str, nombre_barbero: str, cliente: str,
    servicio: str, fecha_hora: str, monto: float, comprobante_url: str,
):
    mensaje = (
        f"📋 *Comprobante SINPE recibido*\n\n"
        f"Hola {nombre_barbero}, {cliente} envió un comprobante de pago.\n\n"
        f"✂️ *Servicio:* {servicio} — ₡{monto:,.0f}\n"
        f"📅 *Fecha:* {fecha_hora}\n\n"
        f"Revisá la imagen adjunta y confirmá o rechazá el pago desde tu panel."
    )
    enviar_mensaje(telefono, mensaje, media_url=comprobante_url)


def notificar_pago_pendiente_barbero(
    telefono: str, nombre_barbero: str, cliente: str,
    servicio: str, metodo: str, fecha_hora: str, monto: float,
):
    metodo_label = "SINPE Móvil" if metodo == "sinpe" else "Efectivo"
    mensaje = (
        f"🔔 *Pago pendiente de verificar*\n\n"
        f"Hola {nombre_barbero}, hay un pago que requiere tu confirmación:\n\n"
        f"👤 *Cliente:* {cliente}\n"
        f"✂️ *Servicio:* {servicio} — ₡{monto:,.0f}\n"
        f"💳 *Método:* {metodo_label}\n"
        f"📅 *Fecha:* {fecha_hora}\n\n"
        f"Confirmá o rechazá el pago desde tu panel."
    )
    enviar_mensaje(telefono, mensaje)


def notificar_cita_confirmada_pago(
    telefono: str, nombre: str, servicio: str, fecha_hora: str,
    barberia_nombre: str = "",
):
    mensaje = (
        f"✅ *Pago confirmado{f' — {barberia_nombre}' if barberia_nombre else ''}*\n\n"
        f"Hola {nombre}, tu pago fue verificado exitosamente.\n\n"
        f"✂️ *Servicio:* {servicio}\n"
        f"📅 *Fecha y hora:* {fecha_hora}\n\n"
        f"Tu cita está confirmada. ¡Te esperamos!"
    )
    enviar_mensaje(telefono, mensaje)


def notificar_pago_rechazado(telefono: str, nombre: str, barberia_nombre: str = ""):
    mensaje = (
        f"Hola {nombre}, tu comprobante de pago no pudo ser verificado y tu cita fue cancelada.\n\n"
        f"Si creés que es un error o querés intentarlo de nuevo, contactá directamente "
        f"{'a *' + barberia_nombre + '*' if barberia_nombre else 'a la barbería'}."
    )
    enviar_mensaje(telefono, mensaje)


def reenganche_cliente(
    telefono: str, nombre: str, barberia_nombre: str, link_agendamiento: str,
):
    mensaje = (
        f"✂️ *¡Te extrañamos en {barberia_nombre}!*\n\n"
        f"Hola {nombre}, ya pasó un tiempo desde tu última visita. "
        f"Agendá tu próximo corte en segundos:\n"
        f"{link_agendamiento}\n\n"
        f"¡Te esperamos cuando estés listo!"
    )
    enviar_mensaje(telefono, mensaje)
