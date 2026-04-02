from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from typing import List

from app.database import get_db
from app.core.deps import get_usuario_actual
from app.core.config import settings
from app.models.usuario import Usuario
from app.models.barberia import Barberia
from app.models.suscripcion import Suscripcion
from app.models.cita import Cita
from app.models.barbero import Barbero
from app.models.servicio import Servicio
from app.models.cliente import Cliente
from app.services.whatsapp import reenganche_cliente


class ReengancharRequest(BaseModel):
    cliente_id: int

router = APIRouter(prefix="/stats", tags=["Stats"])

PLANES_CON_DASHBOARD = ("pro", "premium")


def _verificar_plan(usuario: Usuario, db: Session):
    barberia = db.query(Barberia).filter(Barberia.id == usuario.barberia_id).first()
    if not barberia:
        raise HTTPException(status_code=404, detail="Barberia no encontrada")
    sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == barberia.id).first()
    plan = sus.plan if sus else barberia.plan
    estado = sus.estado if sus else "trial"
    if plan not in PLANES_CON_DASHBOARD and estado not in ("activa", "trial"):
        raise HTTPException(status_code=403, detail="Esta funcion requiere plan Pro o Premium")
    return barberia


def _sumar_ingresos(db: Session, barberia_id: int, desde: datetime, hasta: datetime) -> float:
    resultado = (
        db.query(func.sum(Servicio.precio))
        .join(Cita, Cita.servicio_id == Servicio.id)
        .filter(
            and_(
                Cita.fecha_hora >= desde,
                Cita.fecha_hora < hasta,
                Cita.estado == "completada",
                Servicio.barberia_id == barberia_id,
            )
        )
        .scalar()
    )
    return float(resultado or 0)


def _citas_del_periodo(db: Session, barberia_id: int, desde: datetime, hasta: datetime):
    return (
        db.query(Cita)
        .join(Barbero, Cita.barbero_id == Barbero.id)
        .filter(
            and_(
                Cita.fecha_hora >= desde,
                Cita.fecha_hora < hasta,
                Cita.estado == "completada",
                Barbero.barberia_id == barberia_id,
            )
        )
        .all()
    )


@router.get("/ingresos")
def ingresos(
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    barberia = _verificar_plan(usuario, db)
    ahora = datetime.utcnow()

    hoy_inicio = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
    semana_inicio = hoy_inicio - timedelta(days=hoy_inicio.weekday())
    if ahora.day <= 15:
        quincena_inicio = hoy_inicio.replace(day=1)
    else:
        quincena_inicio = hoy_inicio.replace(day=16)
    mes_inicio = hoy_inicio.replace(day=1)

    # Ingresos por período
    ingresos_hoy = _sumar_ingresos(db, barberia.id, hoy_inicio, ahora)
    ingresos_semana = _sumar_ingresos(db, barberia.id, semana_inicio, ahora)
    ingresos_quincena = _sumar_ingresos(db, barberia.id, quincena_inicio, ahora)
    ingresos_mes = _sumar_ingresos(db, barberia.id, mes_inicio, ahora)

    # Gráfico diario del mes actual (día → monto)
    grafico = []
    for i in range((hoy_inicio - mes_inicio).days + 1):
        dia = mes_inicio + timedelta(days=i)
        dia_fin = dia + timedelta(days=1)
        monto = _sumar_ingresos(db, barberia.id, dia, dia_fin)
        grafico.append({"fecha": dia.strftime("%d/%m"), "monto": round(monto, 2)})

    # Barbero más productivo de la semana
    barbero_top = None
    rows = (
        db.query(Barbero.nombre, func.count(Cita.id).label("total"))
        .join(Cita, Cita.barbero_id == Barbero.id)
        .filter(
            and_(
                Barbero.barberia_id == barberia.id,
                Cita.fecha_hora >= semana_inicio,
                Cita.estado == "completada",
            )
        )
        .group_by(Barbero.nombre)
        .order_by(func.count(Cita.id).desc())
        .first()
    )
    if rows:
        barbero_top = {"nombre": rows[0], "citas": rows[1]}

    return {
        "ingresos": {
            "hoy": round(ingresos_hoy, 2),
            "semana": round(ingresos_semana, 2),
            "quincena": round(ingresos_quincena, 2),
            "mes": round(ingresos_mes, 2),
        },
        "grafico_mensual": grafico,
        "barbero_top_semana": barbero_top,
    }


@router.get("/retencion")
def retencion(
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    """Clientes sin volver en más de 30 días — solo Premium."""
    barberia = _verificar_plan(usuario, db)
    sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == barberia.id).first()
    plan = sus.plan if sus else barberia.plan
    if plan != "premium":
        raise HTTPException(status_code=403, detail="Esta funcion requiere plan Premium")

    hace_30 = datetime.utcnow() - timedelta(days=30)

    # Última cita por cliente en esta barbería
    subq = (
        db.query(Cita.cliente_id, func.max(Cita.fecha_hora).label("ultima"))
        .join(Barbero, Cita.barbero_id == Barbero.id)
        .filter(Barbero.barberia_id == barberia.id)
        .group_by(Cita.cliente_id)
        .subquery()
    )

    clientes_inactivos = (
        db.query(Cliente, subq.c.ultima)
        .join(subq, Cliente.id == subq.c.cliente_id)
        .filter(subq.c.ultima < hace_30)
        .order_by(subq.c.ultima.asc())
        .limit(50)
        .all()
    )

    return {
        "clientes_inactivos": [
            {
                "id": c.id,
                "nombre": c.nombre,
                "telefono": c.telefono,
                "ultima_visita": ultima.strftime("%d/%m/%Y"),
                "dias_ausente": (datetime.utcnow() - ultima).days,
            }
            for c, ultima in clientes_inactivos
        ]
    }


@router.get("/avanzadas")
def estadisticas_avanzadas(
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    """Métricas avanzadas — solo Premium."""
    barberia = _verificar_plan(usuario, db)
    sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == barberia.id).first()
    plan = sus.plan if sus else barberia.plan
    if plan != "premium":
        raise HTTPException(status_code=403, detail="Esta funcion requiere plan Premium")

    ahora = datetime.utcnow()
    hace_30 = ahora - timedelta(days=30)
    hace_60 = ahora - timedelta(days=60)

    total_clientes = (
        db.query(func.count(func.distinct(Cita.cliente_id)))
        .join(Barbero, Cita.barbero_id == Barbero.id)
        .filter(Barbero.barberia_id == barberia.id)
        .scalar() or 0
    )

    clientes_mes = (
        db.query(func.count(func.distinct(Cita.cliente_id)))
        .join(Barbero, Cita.barbero_id == Barbero.id)
        .filter(and_(Barbero.barberia_id == barberia.id, Cita.fecha_hora >= hace_30))
        .scalar() or 0
    )

    clientes_mes_anterior = (
        db.query(func.count(func.distinct(Cita.cliente_id)))
        .join(Barbero, Cita.barbero_id == Barbero.id)
        .filter(and_(Barbero.barberia_id == barberia.id, Cita.fecha_hora >= hace_60, Cita.fecha_hora < hace_30))
        .scalar() or 0
    )

    servicio_popular = (
        db.query(Servicio.nombre, func.count(Cita.id).label("total"))
        .join(Cita, Cita.servicio_id == Servicio.id)
        .join(Barbero, Cita.barbero_id == Barbero.id)
        .filter(and_(Barbero.barberia_id == barberia.id, Cita.estado == "completada"))
        .group_by(Servicio.nombre)
        .order_by(func.count(Cita.id).desc())
        .first()
    )

    return {
        "total_clientes": total_clientes,
        "clientes_activos_mes": clientes_mes,
        "clientes_mes_anterior": clientes_mes_anterior,
        "tasa_retencion": round((clientes_mes / clientes_mes_anterior * 100) if clientes_mes_anterior > 0 else 0, 1),
        "servicio_mas_popular": {"nombre": servicio_popular[0], "total": servicio_popular[1]} if servicio_popular else None,
    }


@router.post("/reenganche")
def enviar_whatsapp_reenganche(
    datos: ReengancharRequest,
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    """Enviar WhatsApp de reenganche a un cliente inactivo — solo Premium."""
    barberia = _verificar_plan(usuario, db)
    sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == barberia.id).first()
    plan = sus.plan if sus else barberia.plan
    if plan != "premium":
        raise HTTPException(status_code=403, detail="Esta funcion requiere plan Premium")

    cliente = db.query(Cliente).filter(Cliente.id == datos.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    link = f"https://{settings.FRONTEND_URL.replace('http://', '').replace('https://', '')}/agendar/{barberia.id}"
    try:
        reenganche_cliente(
            telefono=cliente.telefono,
            nombre=cliente.nombre,
            barberia_nombre=barberia.nombre,
            link_agendamiento=link,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enviando WhatsApp: {e}")

    return {"ok": True, "mensaje": f"WhatsApp enviado a {cliente.nombre}"}
