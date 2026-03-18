from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.barbero import Barbero
from app.schemas import BarberoCreate, BarberoResponse
from typing import List

router = APIRouter(prefix="/barberos", tags=["Barberos"])

@router.post("/", response_model=BarberoResponse)
def crear_barbero(barbero: BarberoCreate, db: Session = Depends(get_db)):
    nuevo = Barbero(**barbero.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/", response_model=List[BarberoResponse])
def listar_barberos(db: Session = Depends(get_db)):
    return db.query(Barbero).all()

@router.get("/{barbero_id}", response_model=BarberoResponse)
def obtener_barbero(barbero_id: int, db: Session = Depends(get_db)):
    barbero = db.query(Barbero).filter(Barbero.id == barbero_id).first()
    if not barbero:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")
    return barbero