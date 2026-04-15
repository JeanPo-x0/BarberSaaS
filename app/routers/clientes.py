from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.cliente import Cliente
from app.schemas import ClienteCreate, ClienteResponse
from app.utils.phone import formatear_telefono
from typing import List

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.post("/buscar-o-crear", response_model=ClienteResponse)
def buscar_o_crear_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
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

@router.post("/", response_model=ClienteResponse)
def crear_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    nuevo = Cliente(**cliente.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/", response_model=List[ClienteResponse])
def listar_clientes(db: Session = Depends(get_db)):
    return db.query(Cliente).all()

@router.get("/{cliente_id}", response_model=ClienteResponse)
def obtener_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente