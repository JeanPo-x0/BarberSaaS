import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
FROM = os.getenv("TWILIO_WHATSAPP_FROM")

def enviar_mensaje(telefono: str, mensaje: str):
    numero = f"whatsapp:{telefono}" if telefono.startswith("+") else f"whatsapp:+{telefono}"
    client.messages.create(
        from_=FROM,
        to=numero,
        body=mensaje
    )

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

def notificar_cancelacion(telefono: str, nombre: str):
    mensaje = f"Hola {nombre}, tu cita ha sido cancelada. Puedes agendar una nueva cuando quieras."
    enviar_mensaje(telefono, mensaje)
