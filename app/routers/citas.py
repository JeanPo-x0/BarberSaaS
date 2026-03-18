from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from typing import List
from app.database import get_db
from app.models.cita import Cita
from app.models.barbero import Barbero
from app.schemas import CitaCreate, CitaResponse

router = APIRouter(prefix="/citas", tags=["Citas"])

@router.post("/", response_model=CitaResponse)
def crear_cita(cita: CitaCreate, db: Session = Depends(get_db)):
    barbero = db.query(Barbero).filter(Barbero.id == cita.barbero_id).first()
    if not barbero:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")
    if not barbero.activo:
        raise HTTPException(status_code=400, detail="El barbero no esta disponible")

    margen = timedelta(minutes=30)
    conflicto = db.query(Cita).filter(
        and_(
            Cita.barbero_id == cita.barbero_id,
            Cita.estado != "cancelada",
            Cita.fecha_hora >= cita.fecha_hora - margen,
            Cita.fecha_hora <= cita.fecha_hora + margen
        )
    ).first()
    if conflicto:
        raise HTTPException(status_code=400, detail="El barbero ya tiene una cita en ese horario")

    nueva = Cita(**cita.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@router.get("/disponibilidad/{barbero_id}")
def ver_disponibilidad(barbero_id: int, fecha: str, db: Session = Depends(get_db)):
    barbero = db.query(Barbero).filter(Barbero.id == barbero_id).first()
    if not barbero:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")

    try:
        dia = datetime.strptime(fecha, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha invalido. Usa YYYY-MM-DD")

    slots = []
    hora_actual = dia.replace(hour=9, minute=0)
    hora_fin = dia.replace(hour=18, minute=0)

    citas_del_dia = db.query(Cita).filter(
        and_(
            Cita.barbero_id == barbero_id,
            Cita.estado != "cancelada",
            Cita.fecha_hora >= dia.replace(hour=0, minute=0),
            Cita.fecha_hora < dia.replace(hour=23, minute=59)
        )
    ).all()

    horas_ocupadas = [c.fecha_hora for c in citas_del_dia]

    while hora_actual < hora_fin:
        ocupado = any(
            abs((hora_actual - h).total_seconds()) < 1800
            for h in horas_ocupadas
        )
        slots.append({
            "hora": hora_actual.strftime("%H:%M"),
            "disponible": not ocupado
        })
        hora_actual += timedelta(minutes=30)

    return {"barbero_id": barbero_id, "fecha": fecha, "slots": slots}

@router.get("/", response_model=List[CitaResponse])
def listar_citas(db: Session = Depends(get_db)):
    return db.query(Cita).all()

@router.get("/{cita_id}", response_model=CitaResponse)
def obtener_cita(cita_id: int, db: Session = Depends(get_db)):
    cita = db.query(Cita).filter(Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return cita

@router.patch("/{cita_id}/cancelar", response_model=CitaResponse)
def cancelar_cita(cita_id: int, db: Session = Depends(get_db)):
    cita = db.query(Cita).filter(Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    if cita.estado == "cancelada":
        raise HTTPException(status_code=400, detail="La cita ya fue cancelada")
    cita.estado = "cancelada"
    db.commit()
    db.refresh(cita)
    return cita
