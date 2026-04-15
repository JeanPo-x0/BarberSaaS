from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.barbero import Barbero
from app.models.usuario import Usuario
from app.schemas import BarberoCreate, BarberoResponse
from app.core.deps import get_usuario_actual
from app.utils.phone import formatear_telefono
from typing import List

router = APIRouter(prefix="/barberos", tags=["Barberos"])

@router.post("/", response_model=BarberoResponse)
def crear_barbero(barbero: BarberoCreate, db: Session = Depends(get_db)):
    datos = barbero.model_dump()
    if datos.get('telefono'):
        datos['telefono'] = formatear_telefono(datos['telefono'])
    nuevo = Barbero(**datos)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/mios", response_model=List[BarberoResponse])
def mis_barberos(usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    if not usuario.barberia_id:
        return []
    return db.query(Barbero).filter(Barbero.barberia_id == usuario.barberia_id).all()

@router.get("/barberia/{barberia_id}", response_model=List[BarberoResponse])
def barberos_por_barberia(barberia_id: int, db: Session = Depends(get_db)):
    # Returns all barbers (active and inactive) so the public page can show unavailable ones
    return db.query(Barbero).filter(Barbero.barberia_id == barberia_id).all()

@router.patch("/{barbero_id}/toggle", response_model=BarberoResponse)
def toggle_barbero(barbero_id: int, usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    barbero = db.query(Barbero).filter(
        Barbero.id == barbero_id,
        Barbero.barberia_id == usuario.barberia_id
    ).first()
    if not barbero:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")
    barbero.activo = not barbero.activo
    db.commit()
    db.refresh(barbero)
    return barbero

@router.delete("/{barbero_id}")
def eliminar_barbero(barbero_id: int, usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    from app.models.cita import Cita
    from datetime import datetime
    barbero = db.query(Barbero).filter(
        Barbero.id == barbero_id,
        Barbero.barberia_id == usuario.barberia_id
    ).first()
    if not barbero:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")
    citas_futuras = db.query(Cita).filter(
        Cita.barbero_id == barbero_id,
        Cita.estado == "pendiente",
        Cita.fecha_hora > datetime.utcnow()
    ).count()
    if citas_futuras > 0:
        raise HTTPException(status_code=400, detail=f"El barbero tiene {citas_futuras} cita(s) pendiente(s). Cancelalas antes de eliminar.")
    db.delete(barbero)
    db.commit()
    return {"ok": True}

@router.get("/", response_model=List[BarberoResponse])
def listar_barberos(db: Session = Depends(get_db)):
    return db.query(Barbero).all()

@router.get("/{barbero_id}", response_model=BarberoResponse)
def obtener_barbero(barbero_id: int, db: Session = Depends(get_db)):
    barbero = db.query(Barbero).filter(Barbero.id == barbero_id).first()
    if not barbero:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")
    return barbero
