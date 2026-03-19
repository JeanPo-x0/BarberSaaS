from fastapi import APIRouter, Request, Depends, BackgroundTasks
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.bot import procesar_mensaje

router = APIRouter(prefix="/webhook", tags=["webhook"])


@router.post("/whatsapp")
async def webhook_whatsapp(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    form = await request.form()
    from_number = form.get("From", "").replace("whatsapp:", "")
    to_number = form.get("To", "").replace("whatsapp:", "")
    body = form.get("Body", "").strip()

    respuesta, tarea_background = procesar_mensaje(db, from_number, to_number, body)

    if tarea_background:
        background_tasks.add_task(tarea_background)

    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f"<Response><Message>{respuesta}</Message></Response>"
    )
    return Response(content=twiml, media_type="application/xml")
