from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from app.core.config import settings
from app.routers import barberias, barberos, clientes, servicios, citas, auth
from app.database import SessionLocal
from app.models.cita import Cita
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

scheduler = BackgroundScheduler()
scheduler.add_job(limpiar_citas_antiguas, "interval", hours=24)

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
app.include_router(barberias.router)
app.include_router(barberos.router)
app.include_router(clientes.router)
app.include_router(servicios.router)
app.include_router(citas.router)

@app.get("/")
def root():
    return {"mensaje": "BarberSaaS activo, vibras lo mas importante!!🔥"}
