from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db
from app.models.cliente import Cliente
from app.models.cita import Cita
from app.models.barbero import Barbero
from app.models.servicio import Servicio
from app.models.usuario import Usuario
from app.schemas import ClienteCreate, ClienteResponse
from app.utils.phone import formatear_telefono
from app.core.deps import get_usuario_actual
from app.core.limiter import limiter
from app.services.whatsapp import notificar_barbero_cancelacion
from typing import List

router = APIRouter(prefix="/clientes", tags=["Clientes"])


class ConsultaCitasRequest(BaseModel):
    telefono: str


class CancelarCitaClienteRequest(BaseModel):
    telefono: str


class CitaPublicaResponse(BaseModel):
    id: int
    fecha_hora: datetime
    barbero_nombre: str
    servicio_nombre: str
    estado: str
    estado_pago: str

    class Config:
        from_attributes = True


@router.post("/buscar-o-crear", response_model=ClienteResponse)
@limiter.limit("10/minute")
def buscar_o_crear_cliente(request: Request, cliente: ClienteCreate, db: Session = Depends(get_db)):
    """Endpoint público — usado por la página de agendamiento de clientes."""
    telefono_normalizado = formatear_telefono(cliente.telefono)
    existente = db.query(Cliente).filter(Cliente.telefono == telefono_normalizado).first()
    if existente:
        if cliente.nombre and cliente.nombre.strip() and cliente.nombre.strip() != existente.nombre:
            existente.nombre = cliente.nombre.strip()
            db.commit()
            db.refresh(existente)
        return existente
    datos = cliente.model_dump()
    datos['telefono'] = telefono_normalizado
    nuevo = Cliente(**datos)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.post("/consultar-citas", response_model=List[CitaPublicaResponse])
@limiter.limit("5/minute")
def consultar_citas_cliente(request: Request, data: ConsultaCitasRequest, db: Session = Depends(get_db)):
    """Endpoint público — el cliente busca sus citas pendientes por teléfono."""
    tel = formatear_telefono(data.telefono)
    cliente = db.query(Cliente).filter(Cliente.telefono == tel).first()
    if not cliente:
        return []

    ahora = datetime.utcnow()
    rows = (
        db.query(Cita, Barbero, Servicio)
        .join(Barbero, Barbero.id == Cita.barbero_id)
        .outerjoin(Servicio, Servicio.id == Cita.servicio_id)
        .filter(
            Cita.cliente_id == cliente.id,
            Cita.estado == "pendiente",
            Cita.fecha_hora > ahora,
        )
        .order_by(Cita.fecha_hora.asc())
        .limit(5)
        .all()
    )
    return [
        CitaPublicaResponse(
            id=cita.id,
            fecha_hora=cita.fecha_hora,
            barbero_nombre=barbero.nombre,
            servicio_nombre=servicio.nombre if servicio else "Servicio",
            estado=cita.estado,
            estado_pago=cita.estado_pago,
        )
        for cita, barbero, servicio in rows
    ]


@router.patch("/{cita_id}/cancelar-por-cliente")
@limiter.limit("3/minute")
def cancelar_cita_por_cliente(
    request: Request,
    cita_id: int,
    data: CancelarCitaClienteRequest,
    db: Session = Depends(get_db),
):
    """Endpoint público — el cliente cancela su propia cita verificando por teléfono."""
    tel = formatear_telefono(data.telefono)
    cliente = db.query(Cliente).filter(Cliente.telefono == tel).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="No encontramos una cuenta con ese número")

    cita = db.query(Cita).filter(Cita.id == cita_id, Cita.cliente_id == cliente.id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    if cita.estado != "pendiente":
        raise HTTPException(status_code=400, detail="Esta cita ya fue cancelada o completada")

    estado_pago_previo = cita.estado_pago
    cita.estado = "cancelada"
    db.commit()

    try:
        barbero = db.query(Barbero).filter(Barbero.id == cita.barbero_id).first()
        if barbero and barbero.telefono:
            notificar_barbero_cancelacion(
                telefono=barbero.telefono,
                nombre_barbero=barbero.nombre,
                cliente=cliente.nombre,
                fecha_hora=cita.fecha_hora.strftime("%d/%m/%y a las %H:%M"),
            )
    except Exception:
        pass

    return {"ok": True, "estado_pago": estado_pago_previo}


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
