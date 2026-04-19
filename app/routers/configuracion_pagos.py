from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.configuracion_pagos import ConfiguracionPagos
from app.schemas.configuracion_pagos import (
    ConfiguracionPagosUpdate,
    ConfiguracionPagosResponse,
    ConfiguracionPagosPublica,
)
from app.models.usuario import Usuario
from app.core.deps import get_usuario_actual

router = APIRouter(prefix="/configuracion-pagos", tags=["Pagos"])


def _get_or_create(db: Session, barberia_id: int) -> ConfiguracionPagos:
    config = db.query(ConfiguracionPagos).filter(
        ConfiguracionPagos.barberia_id == barberia_id
    ).first()
    if not config:
        config = ConfiguracionPagos(barberia_id=barberia_id)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.get("/publica/{barberia_id}", response_model=ConfiguracionPagosPublica)
def get_config_publica(barberia_id: int, db: Session = Depends(get_db)):
    return _get_or_create(db, barberia_id)


@router.get("/mia", response_model=ConfiguracionPagosResponse)
def get_config_mia(
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    return _get_or_create(db, usuario.barberia_id)


@router.put("/mia", response_model=ConfiguracionPagosResponse)
def update_config_mia(
    data: ConfiguracionPagosUpdate,
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    config = _get_or_create(db, usuario.barberia_id)
    for field, value in data.model_dump().items():
        setattr(config, field, value)
    db.commit()
    db.refresh(config)
    return config
