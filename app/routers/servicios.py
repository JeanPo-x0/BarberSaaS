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
def crear_servicio(servicio: ServicioCreate, db: Session = Depends(get_db)):
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

@router.get("/", response_model=List[ServicioResponse])
def listar_servicios(db: Session = Depends(get_db)):
    return db.query(Servicio).all()

@router.get("/{servicio_id}", response_model=ServicioResponse)
def obtener_servicio(servicio_id: int, db: Session = Depends(get_db)):
    servicio = db.query(Servicio).filter(Servicio.id == servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return servicio
