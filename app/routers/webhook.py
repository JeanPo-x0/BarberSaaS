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
    url = str(request.url)
    if not validator.validate(url, form_dict, signature):
        return Response(content="Forbidden", status_code=403)

    body = form_dict.get("Body", "").strip()

    # Si el cliente escribe CANCELAR, procesarlo — es la única acción entrante activa
    if body.upper().startswith("CANCELAR"):
        from_number = form_dict.get("From", "").replace("whatsapp:", "")
        to_number = form_dict.get("To", "").replace("whatsapp:", "")
        respuesta, tarea_background = procesar_mensaje(db, from_number, to_number, body)
        if tarea_background:
            background_tasks.add_task(tarea_background)
        twiml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            f"<Response><Message>{respuesta}</Message></Response>"
        )
        return Response(content=twiml, media_type="application/xml")

    # Para cualquier otro mensaje, buscar la barbería y devolver el link
    to_number = form_dict.get("To", "").replace("whatsapp:", "")
    from app.models.barberia import Barberia
    from sqlalchemy import and_
    from app.core.config import settings
    barberia = db.query(Barberia).filter(
        and_(Barberia.twilio_numero == to_number, Barberia.activa == True)
    ).first()

    if barberia:
        link = (
            f"{settings.FRONTEND_URL}/b/{barberia.subdominio}"
            if barberia.subdominio
            else f"{settings.FRONTEND_URL}/agendar/{barberia.id}"
        )
        respuesta = (
            f"Hola! 👋 Las citas en *{barberia.nombre}* se agendan desde el siguiente link:\n"
            f"{link}\n\n"
            f"Si querés *cancelar* una cita existente, simplemente respondé *CANCELAR* aquí y lo hacemos en segundos."
        )
    else:
        respuesta = (
            "Hola! Las citas se agendan desde el link que te compartió tu barbería. "
            "Para cancelar una cita existente respondé CANCELAR."
        )

    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f"<Response><Message>{respuesta}</Message></Response>"
    )
    return Response(content=twiml, media_type="application/xml")
