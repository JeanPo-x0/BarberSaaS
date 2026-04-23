from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import date, datetime
from typing import List
from pydantic import BaseModel

from app.database import get_db
from app.models.bloqueo import BloqueoDisponibilidad
from app.models.barbero import Barbero
from app.core.deps import get_barbero_actual

router = APIRouter(prefix="/bloqueos", tags=["Bloqueos"])


class BloqueoCreate(BaseModel):
    fecha: date
    motivo: str | None = None


class BloqueoResponse(BaseModel):
    id: int
    barbero_id: int
    fecha: date
    motivo: str | None
    creado_en: datetime

    class Config:
        from_attributes = True


@router.get("/mis", response_model=List[BloqueoResponse])
def listar_mis_bloqueos(
    barbero: Barbero = Depends(get_barbero_actual),
    db: Session = Depends(get_db),
):
    return (
        db.query(BloqueoDisponibilidad)
        .filter(BloqueoDisponibilidad.barbero_id == barbero.id)
        .order_by(BloqueoDisponibilidad.fecha.asc())
        .all()
    )


@router.post("/", response_model=BloqueoResponse, status_code=201)
def crear_bloqueo(
    data: BloqueoCreate,
    barbero: Barbero = Depends(get_barbero_actual),
    db: Session = Depends(get_db),
):
    if data.fecha < date.today():
        raise HTTPException(status_code=400, detail="No podés bloquear fechas pasadas")

    existente = db.query(BloqueoDisponibilidad).filter(
        and_(
            BloqueoDisponibilidad.barbero_id == barbero.id,
            BloqueoDisponibilidad.fecha == data.fecha,
        )
    ).first()
    if existente:
        raise HTTPException(status_code=400, detail="Esa fecha ya está bloqueada")

    bloqueo = BloqueoDisponibilidad(
        barbero_id=barbero.id,
        fecha=data.fecha,
        motivo=data.motivo,
    )
    db.add(bloqueo)
    db.commit()
    db.refresh(bloqueo)
    return bloqueo


@router.delete("/{bloqueo_id}", status_code=204)
def eliminar_bloqueo(
    bloqueo_id: int,
    barbero: Barbero = Depends(get_barbero_actual),
    db: Session = Depends(get_db),
):
    bloqueo = db.query(BloqueoDisponibilidad).filter(
        BloqueoDisponibilidad.id == bloqueo_id,
        BloqueoDisponibilidad.barbero_id == barbero.id,
    ).first()
    if not bloqueo:
        raise HTTPException(status_code=404, detail="Bloqueo no encontrado")
    db.delete(bloqueo)
    db.commit()
