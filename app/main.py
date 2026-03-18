from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from app.core.config import settings
from app.routers import barberias, barberos, clientes, servicios, citas, auth, webhook
from app.database import SessionLocal
from app.models.cita import Cita
from app.models.barbero import Barbero
from app.services.whatsapp import recordatorio_cita, recordatorio_1h
from sqlalchemy import and_

def limpiar_citas_antiguas():
    db = SessionLocal()
    try:
        hace_30_dias = datetime.utcnow() - timedelta(days=30)
        db.query(Cita).filter(
            and_(
                Cita.estado.in_(["cancelada", "completada"]),
                Cita.fecha_hora < hace_30_dias
            )
        ).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()

def enviar_recordatorios_24h():
    db = SessionLocal()
    try:
        ahora = datetime.utcnow()
        ventana_inicio = ahora + timedelta(hours=23, minutes=30)
        ventana_fin = ahora + timedelta(hours=24)
        citas = (
            db.query(Cita)
            .join(Barbero, Cita.barbero_id == Barbero.id)
            .filter(
                and_(
                    Cita.fecha_hora >= ventana_inicio,
                    Cita.fecha_hora < ventana_fin,
                    Cita.estado == "pendiente"
                )
            )
            .all()
        )
        for cita in citas:
            recordatorio_cita(
                telefono=cita.cliente.telefono,
                nombre=cita.cliente.nombre,
                fecha_hora=cita.fecha_hora.strftime("%d/%m/%Y %H:%M")
            )
    except Exception as e:
        print(f"[recordatorios_24h] Error: {e}")
    finally:
        db.close()

def enviar_recordatorios_1h():
    db = SessionLocal()
    try:
        ahora = datetime.utcnow()
        ventana_inicio = ahora + timedelta(minutes=30)
        ventana_fin = ahora + timedelta(hours=1)
        citas = (
            db.query(Cita)
            .join(Barbero, Cita.barbero_id == Barbero.id)
            .filter(
                and_(
                    Cita.fecha_hora >= ventana_inicio,
                    Cita.fecha_hora < ventana_fin,
                    Cita.estado == "pendiente"
                )
            )
            .all()
        )
        for cita in citas:
            recordatorio_1h(
                telefono=cita.cliente.telefono,
                nombre=cita.cliente.nombre,
                fecha_hora=cita.fecha_hora.strftime("%H:%M")
            )
    except Exception as e:
        print(f"[recordatorios_1h] Error: {e}")
    finally:
        db.close()

def auto_cancelar_citas_sin_atender():
    """
    +30 min: cancela la cita (estado = cancelada).
    +1h:     elimina el registro completamente de la BD.
    """
    db = SessionLocal()
    try:
        ahora = datetime.utcnow()
        hace_30min = ahora - timedelta(minutes=30)
        hace_1h = ahora - timedelta(hours=1)

        # Primero eliminar las que ya llevan 1h sin atender
        db.query(Cita).filter(
            and_(
                Cita.estado == "cancelada",
                Cita.fecha_hora < hace_1h
            )
        ).delete(synchronize_session=False)

        # Luego cancelar las que llevan 30 min sin atender
        citas_a_cancelar = db.query(Cita).filter(
            and_(
                Cita.estado == "pendiente",
                Cita.fecha_hora < hace_30min
            )
        ).all()
        for cita in citas_a_cancelar:
            cita.estado = "cancelada"

        db.commit()
        print(f"[auto_cancelar] {len(citas_a_cancelar)} canceladas, eliminacion de vencidas ejecutada.")
    except Exception as e:
        print(f"[auto_cancelar] Error: {e}")
    finally:
        db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(limpiar_citas_antiguas, "interval", hours=24)
scheduler.add_job(enviar_recordatorios_24h, "interval", minutes=30)
scheduler.add_job(enviar_recordatorios_1h, "interval", minutes=30)
scheduler.add_job(auto_cancelar_citas_sin_atender, "interval", hours=1)

@asynccontextmanager
async def lifespan(app):
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(webhook.router)
app.include_router(barberias.router)
app.include_router(barberos.router)
app.include_router(clientes.router)
app.include_router(servicios.router)
app.include_router(citas.router)

@app.get("/")
def root():
    return {"mensaje": "BarberSaaS activo, vibras lo mas importante!!🔥"}
