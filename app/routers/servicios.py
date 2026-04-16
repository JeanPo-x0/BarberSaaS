from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.servicio import Servicio
from app.models.usuario import Usuario
from app.schemas import ServicioCreate, ServicioResponse
from app.core.deps import get_usuario_actual
from typing import List

router = APIRouter(prefix="/servicios", tags=["Servicios"])

@router.post("/", response_model=ServicioResponse)
def crear_servicio(
    servicio: ServicioCreate,
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    from app.models.barberia import Barberia
    barberia = db.query(Barberia).filter(
        Barberia.id == servicio.barberia_id,
        Barberia.dueno_id == usuario.id,
    ).first()
    if not barberia:
        barberia = db.query(Barberia).filter(
            Barberia.id == servicio.barberia_id,
            Barberia.id == usuario.barberia_id,
        ).first()
    if not barberia:
        raise HTTPException(status_code=403, detail="No tienes permiso sobre esa barberia")
    nuevo = Servicio(**servicio.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/mios", response_model=List[ServicioResponse])
def mis_servicios(usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    if not usuario.barberia_id:
        return []
    return db.query(Servicio).filter(Servicio.barberia_id == usuario.barberia_id).all()

@router.get("/barberia/{barberia_id}", response_model=List[ServicioResponse])
def servicios_por_barberia(barberia_id: int, db: Session = Depends(get_db)):
    # Returns all services (available and unavailable) so the public page can show unavailable ones
    return db.query(Servicio).filter(Servicio.barberia_id == barberia_id).all()

@router.patch("/{servicio_id}/toggle", response_model=ServicioResponse)
def toggle_servicio(servicio_id: int, usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    servicio = db.query(Servicio).filter(
        Servicio.id == servicio_id,
        Servicio.barberia_id == usuario.barberia_id
    ).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    servicio.disponible = not servicio.disponible
    db.commit()
    db.refresh(servicio)
    return servicio

@router.delete("/{servicio_id}")
def eliminar_servicio(servicio_id: int, usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    from app.models.cita import Cita
    from datetime import datetime
    servicio = db.query(Servicio).filter(
        Servicio.id == servicio_id,
        Servicio.barberia_id == usuario.barberia_id
    ).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    citas_futuras = db.query(Cita).filter(
        Cita.servicio_id == servicio_id,
        Cita.estado == "pendiente",
        Cita.fecha_hora > datetime.utcnow()
    ).count()
    if citas_futuras > 0:
        raise HTTPException(status_code=400, detail=f"El servicio tiene {citas_futuras} cita(s) pendiente(s). Cancelalas antes de eliminar.")
    db.delete(servicio)
    db.commit()
    return {"ok": True}

@router.get("/", response_model=List[ServicioResponse])
def listar_servicios(
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    """Solo devuelve los servicios de la barbería del usuario logueado."""
    return db.query(Servicio).filter(Servicio.barberia_id == usuario.barberia_id).all()

@router.get("/{servicio_id}", response_model=ServicioResponse)
def obtener_servicio(servicio_id: int, db: Session = Depends(get_db)):
    servicio = db.query(Servicio).filter(Servicio.id == servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return servicio
