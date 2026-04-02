from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta

from app.database import get_db
from app.core.deps import get_usuario_actual
from app.core.config import settings
from app.models.usuario import Usuario
from app.models.barberia import Barberia
from app.models.suscripcion import Suscripcion
from app.models.cita import Cita
from app.models.barbero import Barbero
from app.models.servicio import Servicio

router = APIRouter(prefix="/admin", tags=["SuperAdmin"])


def _verificar_superadmin(usuario: Usuario):
    if usuario.rol != "superadmin" and usuario.email != settings.SUPERADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Acceso restringido a super-admin")


@router.get("/barberias")
def listar_todas_las_barberias(
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    _verificar_superadmin(usuario)

    barberias = db.query(Barberia).all()
    resultado = []
    for b in barberias:
        sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == b.id).first()
        total_barberos = db.query(func.count(Barbero.id)).filter(Barbero.barberia_id == b.id).scalar() or 0
        total_citas = (
            db.query(func.count(Cita.id))
            .join(Barbero, Cita.barbero_id == Barbero.id)
            .filter(Barbero.barberia_id == b.id)
            .scalar() or 0
        )
        resultado.append({
            "id": b.id,
            "nombre": b.nombre,
            "email": b.email,
            "activa": b.activa,
            "plan": sus.plan if sus else b.plan,
            "estado_suscripcion": sus.estado if sus else "sin_suscripcion",
            "periodo": sus.periodo if sus else None,
            "fecha_trial_fin": sus.fecha_trial_fin.strftime("%d/%m/%Y") if sus and sus.fecha_trial_fin else None,
            "fecha_renovacion": sus.fecha_renovacion.strftime("%d/%m/%Y") if sus and sus.fecha_renovacion else None,
            "total_barberos": total_barberos,
            "total_citas": total_citas,
            "subdominio": b.subdominio,
        })
    return resultado


@router.get("/stats")
def stats_globales(
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    _verificar_superadmin(usuario)

    total_barberias = db.query(func.count(Barberia.id)).scalar() or 0
    activas = db.query(func.count(Barberia.id)).filter(Barberia.activa == True).scalar() or 0
    en_trial = db.query(func.count(Suscripcion.id)).filter(Suscripcion.estado == "trial").scalar() or 0
    suspendidas = db.query(func.count(Suscripcion.id)).filter(Suscripcion.estado == "suspendida").scalar() or 0

    plan_pro = db.query(func.count(Suscripcion.id)).filter(Suscripcion.plan == "pro", Suscripcion.estado == "activa").scalar() or 0
    plan_premium = db.query(func.count(Suscripcion.id)).filter(Suscripcion.plan == "premium", Suscripcion.estado == "activa").scalar() or 0

    # MRR estimado (solo activas)
    mrr = plan_pro * 29 + plan_premium * 59

    # Ingresos totales de citas completadas este mes
    mes_inicio = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    ingresos_mes = (
        db.query(func.sum(Servicio.precio))
        .join(Cita, Cita.servicio_id == Servicio.id)
        .filter(and_(Cita.estado == "completada", Cita.fecha_hora >= mes_inicio))
        .scalar() or 0
    )

    return {
        "total_barberias": total_barberias,
        "barberias_activas": activas,
        "en_trial": en_trial,
        "suspendidas": suspendidas,
        "plan_pro_activo": plan_pro,
        "plan_premium_activo": plan_premium,
        "mrr_estimado_usd": mrr,
        "ingresos_citas_mes": round(float(ingresos_mes), 2),
    }


@router.patch("/barberias/{barberia_id}/suspender")
def suspender_barberia(
    barberia_id: int,
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    _verificar_superadmin(usuario)
    barberia = db.query(Barberia).filter(Barberia.id == barberia_id).first()
    if not barberia:
        raise HTTPException(status_code=404, detail="Barberia no encontrada")
    barberia.activa = False
    sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == barberia_id).first()
    if sus:
        sus.estado = "suspendida"
    db.commit()
    return {"ok": True, "mensaje": f"Barberia {barberia.nombre} suspendida"}


@router.patch("/barberias/{barberia_id}/reactivar")
def reactivar_barberia(
    barberia_id: int,
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    _verificar_superadmin(usuario)
    barberia = db.query(Barberia).filter(Barberia.id == barberia_id).first()
    if not barberia:
        raise HTTPException(status_code=404, detail="Barberia no encontrada")
    barberia.activa = True
    sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == barberia_id).first()
    if sus:
        sus.estado = "activa"
    db.commit()
    return {"ok": True, "mensaje": f"Barberia {barberia.nombre} reactivada"}
