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

    # Validar firma de Twilio para rechazar requests falsos
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    if auth_token:
        validator = RequestValidator(auth_token)
        signature = request.headers.get("X-Twilio-Signature", "")
        url = str(request.url)
        if not validator.validate(url, form_dict, signature):
            return Response(content="Forbidden", status_code=403)

    from_number = form_dict.get("From", "").replace("whatsapp:", "")
    to_number = form_dict.get("To", "").replace("whatsapp:", "")
    body = form_dict.get("Body", "").strip()

    respuesta, tarea_background = procesar_mensaje(db, from_number, to_number, body)

    if tarea_background:
        background_tasks.add_task(tarea_background)

    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f"<Response><Message>{respuesta}</Message></Response>"
    )
    return Response(content=twiml, media_type="application/xml")
