from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime

from app.database import get_db
from app.core.deps import get_usuario_actual
from app.models.usuario import Usuario
from app.models.barberia import Barberia
from app.models.lista_espera import ListaEspera
from app.schemas import ListaEsperaCreate, ListaEsperaResponse

router = APIRouter(prefix="/lista-espera", tags=["ListaEspera"])


@router.post("/{barberia_id}", response_model=ListaEsperaResponse)
def anotarse_en_lista(
    barberia_id: int,
    datos: ListaEsperaCreate,
    db: Session = Depends(get_db),
):
    barberia = db.query(Barberia).filter(Barberia.id == barberia_id, Barberia.activa == True).first()
    if not barberia:
        raise HTTPException(status_code=404, detail="Barberia no encontrada")

    ultima_posicion = (
        db.query(func.max(ListaEspera.posicion))
        .filter(
            ListaEspera.barberia_id == barberia_id,
            ListaEspera.estado == "esperando",
        )
        .scalar() or 0
    )

    entrada = ListaEspera(
        barberia_id=barberia_id,
        barbero_id=datos.barbero_id,
        servicio_id=datos.servicio_id,
        cliente_nombre=datos.cliente_nombre,
        cliente_telefono=datos.cliente_telefono,
        fecha_preferida=datos.fecha_preferida,
        posicion=ultima_posicion + 1,
        creado_en=datetime.utcnow(),
    )
    db.add(entrada)
    db.commit()
    db.refresh(entrada)
    return entrada


@router.get("/{barberia_id}", response_model=List[ListaEsperaResponse])
def ver_lista(
    barberia_id: int,
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    if usuario.barberia_id != barberia_id and usuario.rol != "superadmin":
        raise HTTPException(status_code=403, detail="Sin acceso")
    return (
        db.query(ListaEspera)
        .filter(ListaEspera.barberia_id == barberia_id, ListaEspera.estado == "esperando")
        .order_by(ListaEspera.posicion.asc())
        .all()
    )


@router.delete("/{entrada_id}")
def eliminar_de_lista(
    entrada_id: int,
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    entrada = db.query(ListaEspera).filter(ListaEspera.id == entrada_id).first()
    if not entrada:
        raise HTTPException(status_code=404, detail="No encontrado")
    if entrada.barberia_id != usuario.barberia_id and usuario.rol != "superadmin":
        raise HTTPException(status_code=403, detail="Sin acceso")
    db.delete(entrada)
    db.commit()
    return {"ok": True}
