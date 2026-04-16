from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.cliente import Cliente
from app.models.cita import Cita
from app.models.barbero import Barbero
from app.models.usuario import Usuario
from app.schemas import ClienteCreate, ClienteResponse
from app.utils.phone import formatear_telefono
from app.core.deps import get_usuario_actual
from typing import List

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.post("/buscar-o-crear", response_model=ClienteResponse)
def buscar_o_crear_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    """Endpoint público — usado por la página de agendamiento de clientes."""
    telefono_normalizado = formatear_telefono(cliente.telefono)
    existente = db.query(Cliente).filter(Cliente.telefono == telefono_normalizado).first()
    if existente:
        return existente
    datos = cliente.model_dump()
    datos['telefono'] = telefono_normalizado
    nuevo = Cliente(**datos)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=List[ClienteResponse])
def listar_clientes(
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    """Solo devuelve los clientes que tienen citas en la barbería del usuario logueado."""
    return (
        db.query(Cliente)
        .join(Cita, Cita.cliente_id == Cliente.id)
        .join(Barbero, Barbero.id == Cita.barbero_id)
        .filter(Barbero.barberia_id == usuario.barberia_id)
        .distinct()
        .all()
    )


@router.get("/{cliente_id}", response_model=ClienteResponse)
def obtener_cliente(
    cliente_id: int,
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    """Devuelve un cliente solo si tiene citas en la barbería del usuario logueado."""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    tiene_acceso = (
        db.query(Cita)
        .join(Barbero, Barbero.id == Cita.barbero_id)
        .filter(
            Cita.cliente_id == cliente_id,
            Barbero.barberia_id == usuario.barberia_id,
        )
        .first()
    )
    if not tiene_acceso:
        raise HTTPException(status_code=403, detail="No tienes acceso a este cliente")

    return cliente
