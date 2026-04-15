from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from app.core.config import settings
from app.routers import barberias, barberos, clientes, servicios, citas, auth, webhook
from app.routers import suscripcion, stats, admin, lista_espera
from app.models.lista_espera import ListaEspera
from app.models.suscripcion import Suscripcion
from app.services.whatsapp import notificar_lista_espera
from app.core.config import settings
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
                fecha_hora=cita.fecha_hora.strftime("%d/%m/%y %H:%M")
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

def procesar_lista_espera():
    """
    Cuando una cita se cancela (manejado en routers/citas.py),
    este job corre cada 5 minutos para:
    1. Expirar notificaciones sin confirmar después de 30 min
    2. Notificar al siguiente en la lista
    """
    db = SessionLocal()
    try:
        ahora = datetime.utcnow()
        expira = ahora - timedelta(minutes=30)

        # Expirar notificados hace más de 30 min sin confirmar
        notificados = db.query(ListaEspera).filter(
            ListaEspera.estado == "notificado",
            ListaEspera.notificado_en < expira,
        ).all()

        for entrada in notificados:
            entrada.estado = "expirado"

        db.flush()

        # Para cada barbería con expirados, notificar al siguiente en cola
        barberias_con_expirados = {e.barberia_id for e in notificados}
        for barberia_id in barberias_con_expirados:
            siguiente = (
                db.query(ListaEspera)
                .filter(
                    ListaEspera.barberia_id == barberia_id,
                    ListaEspera.estado == "esperando",
                )
                .order_by(ListaEspera.posicion.asc())
                .first()
            )
            if siguiente:
                link = f"{settings.FRONTEND_URL}/agendar/{barberia_id}"
                # Obtener nombre de barbería
                from app.models.barberia import Barberia as BarberiaModel
                barberia = db.query(BarberiaModel).filter(BarberiaModel.id == barberia_id).first()
                nombre_barberia = barberia.nombre if barberia else "la barbería"
                try:
                    notificar_lista_espera(
                        telefono=siguiente.cliente_telefono,
                        nombre=siguiente.cliente_nombre,
                        barberia_nombre=nombre_barberia,
                        link_agendamiento=link,
                    )
                    siguiente.estado = "notificado"
                    siguiente.notificado_en = ahora
                except Exception as e:
                    print(f"[lista_espera] Error notificando: {e}")

        db.commit()
    except Exception as e:
        print(f"[lista_espera] Error: {e}")
    finally:
        db.close()


def verificar_trials_vencidos():
    """Suspender barberias cuyo trial venció hace más de 1 día sin suscripción activa."""
    db = SessionLocal()
    try:
        ahora = datetime.utcnow()
        vencidos = db.query(Suscripcion).filter(
            Suscripcion.estado == "trial",
            Suscripcion.fecha_trial_fin < ahora,
        ).all()
        for sus in vencidos:
            sus.estado = "suspendida"
            from app.models.barberia import Barberia as BarberiaModel
            barberia = db.query(BarberiaModel).filter(BarberiaModel.id == sus.barberia_id).first()
            if barberia:
                barberia.activa = False
        if vencidos:
            db.commit()
            print(f"[trials] {len(vencidos)} trials vencidos suspendidos.")
    except Exception as e:
        print(f"[trials] Error: {e}")
    finally:
        db.close()


scheduler = BackgroundScheduler()
scheduler.add_job(limpiar_citas_antiguas, "interval", hours=24)
scheduler.add_job(enviar_recordatorios_24h, "interval", minutes=30)
scheduler.add_job(enviar_recordatorios_1h, "interval", minutes=30)
scheduler.add_job(auto_cancelar_citas_sin_atender, "interval", hours=1)
scheduler.add_job(procesar_lista_espera, "interval", minutes=5)
scheduler.add_job(verificar_trials_vencidos, "interval", hours=6)

@asynccontextmanager
async def lifespan(app):
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Safe: no cookies, JWT only (allow_credentials=False)
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    allow_credentials=False,
)

app.include_router(auth.router)
app.include_router(webhook.router)
app.include_router(barberias.router)
app.include_router(barberos.router)
app.include_router(clientes.router)
app.include_router(servicios.router)
app.include_router(citas.router)
app.include_router(suscripcion.router)
app.include_router(stats.router)
app.include_router(admin.router)
app.include_router(lista_espera.router)

@app.get("/")
def root():
    return {"mensaje": "BarberSaaS activo"}

@app.get("/health")
def health():
    return {"status": "ok"}
