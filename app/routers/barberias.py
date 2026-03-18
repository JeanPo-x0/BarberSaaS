from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.barberia import Barberia
from app.schemas import BarberiaCreate, BarberiaResponse
from app.core.deps import get_usuario_actual
from app.models.usuario import Usuario
from typing import List

router = APIRouter(prefix="/barberias", tags=["Barberias"])

@router.post("/", response_model=BarberiaResponse)
def crear_barberia(barberia: BarberiaCreate, db: Session = Depends(get_db)):
    nueva = Barberia(**barberia.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@router.get("/mia", response_model=List[BarberiaResponse])
def mi_barberia(usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    if not usuario.barberia_id:
        return []
    barberia = db.query(Barberia).filter(Barberia.id == usuario.barberia_id).first()
    return [barberia] if barberia else []

@router.get("/", response_model=List[BarberiaResponse])
def listar_barberias(db: Session = Depends(get_db)):
    return db.query(Barberia).all()

@router.get("/{barberia_id}", response_model=BarberiaResponse)
def obtener_barberia(barberia_id: int, db: Session = Depends(get_db)):
    barberia = db.query(Barberia).filter(Barberia.id == barberia_id).first()
    if not barberia:
        raise HTTPException(status_code=404, detail="Barberia no encontrada")
    return barberia
