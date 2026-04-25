import os
from fastapi import APIRouter, Request, Depends, BackgroundTasks
from fastapi.responses import Response
from sqlalchemy.orm import Session
from twilio.request_validator import RequestValidator
from app.database import get_db
from app.services.bot import procesar_mensaje

router = APIRouter(prefix="/webhook", tags=["webhook"])


@router.post("/whatsapp")
async def webhook_whatsapp(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    form = await request.form()
    form_dict = dict(form)

    # Validar firma de Twilio — fallo duro si no está configurado
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    if not auth_token:
        return Response(content="Service unavailable", status_code=503)
    validator = RequestValidator(auth_token)
    signature = request.headers.get("X-Twilio-Signature", "")
    # Render expone RENDER_EXTERNAL_URL con la URL pública exacta del servicio
    base = os.getenv("RENDER_EXTERNAL_URL", "").rstrip("/")
    path = request.url.path
    query = request.url.query
    if base:
        url = f"{base}{path}"
    else:
        host = request.headers.get("x-forwarded-host") or request.headers.get("host", "")
        url = f"https://{host}{path}"
    if query:
        url += f"?{query}"
    print(f"[Webhook] URL validando: {url!r} | sig: {signature[:20]!r}...")
    if not validator.validate(url, form_dict, signature):
        return Response(content="Forbidden", status_code=403)

    body = form_dict.get("Body", "").strip()

    # Si el cliente escribe CANCELAR, procesarlo — es la única acción entrante activa
    if body.upper().startswith("CANCELAR"):
        from_number = form_dict.get("From", "").replace("whatsapp:", "")
        to_number = form_dict.get("To", "").replace("whatsapp:", "")
        try:
            respuesta, tarea_background = procesar_mensaje(db, from_number, to_number, body)
            if tarea_background:
                background_tasks.add_task(tarea_background)
        except Exception as e:
            print(f"[Webhook] ERROR en procesar_mensaje: {e}")
            respuesta = (
                "Hubo un problema al procesar tu solicitud. "
                "Intentá de nuevo o contactá directamente a tu barbería."
            )
        twiml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            f"<Response><Message>{respuesta}</Message></Response>"
        )
        return Response(content=twiml, media_type="application/xml")

    # Para cualquier otro mensaje: identificar la barbería del cliente por su cita más reciente
    from_number = form_dict.get("From", "").replace("whatsapp:", "")
    from app.models.barberia import Barberia
    from app.models.cliente import Cliente
    from app.models.cita import Cita
    from app.models.barbero import Barbero as BarberoModel
    from app.services.bot import _buscar_cliente
    from sqlalchemy import and_
    from app.core.config import settings

    barberia = None
    cliente = _buscar_cliente(db, from_number)
    if cliente:
        cita_reciente = (
            db.query(Cita)
            .join(BarberoModel, Cita.barbero_id == BarberoModel.id)
            .filter(
                Cita.cliente_id == cliente.id,
                Cita.estado == "pendiente",
            )
            .order_by(Cita.fecha_hora.asc())
            .first()
        )
        if cita_reciente:
            barbero = db.query(BarberoModel).filter(BarberoModel.id == cita_reciente.barbero_id).first()
            if barbero:
                barberia = db.query(Barberia).filter(Barberia.id == barbero.barberia_id).first()

    if barberia:
        link = (
            f"{settings.FRONTEND_URL}/b/{barberia.subdominio}"
            if barberia.subdominio
            else f"{settings.FRONTEND_URL}/agendar/{barberia.id}"
        )
        respuesta = (
            f"¡Hola! Gracias por contactar a *{barberia.nombre}*. 💈\n\n"
            f"Podés reservar tu próxima cita fácilmente desde aquí:\n{link}\n\n"
            f"Si necesitás *cancelar* una cita existente, simplemente respondé *CANCELAR* y lo gestionamos de inmediato."
        )
    else:
        respuesta = (
            "¡Hola! Gracias por escribirnos. 💈\n\n"
            "Para reservar tu cita, usá el link de agendamiento que te compartió tu barbería.\n\n"
            "Si necesitás *cancelar* una cita existente, respondé *CANCELAR* y lo procesamos en segundos."
        )

    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f"<Response><Message>{respuesta}</Message></Response>"
    )
    return Response(content=twiml, media_type="application/xml")
