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

def enviar_mensaje(telefono: str, mensaje: str):
    if not FROM:
        print("[WhatsApp] ERROR: TWILIO_WHATSAPP_FROM no esta configurado.")
        return
    if not TWILIO_SID or not TWILIO_TOKEN:
        print("[WhatsApp] ERROR: Credenciales de Twilio no configuradas.")
        return

    numero_e164 = formatear_telefono(telefono)
    numero_wa = f"whatsapp:{numero_e164}"

    try:
        msg = client.messages.create(from_=FROM, to=numero_wa, body=mensaje)
        print(f"[WhatsApp] Enviado a {numero_wa} | SID: {msg.sid}")
    except Exception as e:
        print(f"[WhatsApp] ERROR enviando a {numero_wa}: {e}")

def confirmar_cita(telefono: str, nombre: str, fecha_hora: str, servicio: str, barbero: str):
    mensaje = (
        f"Hola {nombre}! Tu cita ha sido agendada.\n\n"
        f"Barbero: {barbero}\n"
        f"Servicio: {servicio}\n"
        f"Fecha y hora: {fecha_hora}\n\n"
        f"Te esperamos. Si necesitas cancelar responde CANCELAR."
    )
    enviar_mensaje(telefono, mensaje)

def recordatorio_cita(telefono: str, nombre: str, fecha_hora: str):
    mensaje = (
        f"Hola {nombre}! Te recordamos que manana tienes una cita.\n"
        f"Hora: {fecha_hora}\n\n"
        f"Si necesitas cancelar responde CANCELAR."
    )
    enviar_mensaje(telefono, mensaje)

def recordatorio_1h(telefono: str, nombre: str, fecha_hora: str):
    mensaje = (
        f"Hola {nombre}! En 1 hora tienes tu cita.\n"
        f"Hora: {fecha_hora}\n\n"
        f"Te esperamos. Si necesitas cancelar responde CANCELAR."
    )
    enviar_mensaje(telefono, mensaje)

def notificar_cancelacion(telefono: str, nombre: str):
    mensaje = f"Hola {nombre}, tu cita ha sido cancelada. Puedes agendar una nueva cuando quieras."
    enviar_mensaje(telefono, mensaje)

def notificar_barbero_nueva_cita(telefono: str, nombre_barbero: str, cliente: str, servicio: str, fecha_hora: str):
    mensaje = (
        f"Nueva reserva, {nombre_barbero}!\n\n"
        f"Cliente: {cliente}\n"
        f"Servicio: {servicio}\n"
        f"Fecha y hora: {fecha_hora}"
    )
    enviar_mensaje(telefono, mensaje)

def notificar_barbero_cancelacion(telefono: str, nombre_barbero: str, cliente: str, fecha_hora: str):
    mensaje = (
        f"Cita cancelada, {nombre_barbero}.\n\n"
        f"Cliente: {cliente}\n"
        f"Fecha y hora: {fecha_hora}\n\n"
        f"Ese horario quedo libre."
    )
    enviar_mensaje(telefono, mensaje)


def notificar_lista_espera(telefono: str, nombre: str, barberia_nombre: str, link_agendamiento: str):
    """Avisa al primero en lista de espera que se liberó un turno."""
    mensaje = (
        f"Hola {nombre}! Tenemos buenas noticias.\n\n"
        f"Se libero un turno en *{barberia_nombre}*.\n"
        f"Tienes 30 minutos para confirmar tu cita:\n"
        f"{link_agendamiento}\n\n"
        f"Si no confirmas, le avisaremos al siguiente en la lista."
    )
    enviar_mensaje(telefono, mensaje)


def reenganche_cliente(telefono: str, nombre: str, barberia_nombre: str, link_agendamiento: str):
    """WhatsApp de reenganche para clientes inactivos +30 días."""
    mensaje = (
        f"Hola {nombre}! Te echamos de menos en *{barberia_nombre}* ✂️\n\n"
        f"Ya paso un tiempo desde tu ultima visita. Agenda tu proximo corte rapido:\n"
        f"{link_agendamiento}\n\n"
        f"Te esperamos!"
    )
    enviar_mensaje(telefono, mensaje)
