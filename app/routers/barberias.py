from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.barberia import Barberia
from app.models.suscripcion import Suscripcion
from app.schemas import BarberiaCreate, BarberiaResponse
from app.core.deps import get_usuario_actual
from app.models.usuario import Usuario
from typing import List
from pydantic import BaseModel
import re

class SubdominioUpdate(BaseModel):
    subdominio: str

router = APIRouter(prefix="/barberias", tags=["Barberias"])

LIMITE_POR_PLAN = {"basico": 1, "pro": 3, "premium": None}  # None = ilimitado


@router.post("/", response_model=BarberiaResponse)
def crear_barberia(barberia: BarberiaCreate, db: Session = Depends(get_db)):
    nueva = Barberia(**barberia.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.get("/mia", response_model=List[BarberiaResponse])
def mi_barberia(usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    # Returns all barbershops owned by this user (via dueno_id or primary barberia_id)
    owned = db.query(Barberia).filter(Barberia.dueno_id == usuario.id).all()
    if not owned and usuario.barberia_id:
        # Fallback for older accounts created before dueno_id was added
        b = db.query(Barberia).filter(Barberia.id == usuario.barberia_id).first()
        return [b] if b else []
    return owned


@router.post("/nueva", response_model=BarberiaResponse)
def crear_barberia_adicional(
    datos: BarberiaCreate,
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    """Creates an additional barbershop for the owner, respecting plan limits."""
    sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == usuario.barberia_id).first()
    plan = sus.plan if sus else "basico"
    limite = LIMITE_POR_PLAN.get(plan, 1)

    cantidad_actual = db.query(Barberia).filter(Barberia.dueno_id == usuario.id).count()
    if limite is not None and cantidad_actual >= limite:
        raise HTTPException(
            status_code=400,
            detail=f"Tu plan {plan} permite hasta {limite} barberia(s). Mejora tu plan para agregar mas."
        )

    nueva = Barberia(
        nombre=datos.nombre,
        direccion=datos.direccion,
        telefono=datos.telefono,
        email=datos.email,
        plan=plan,
        activa=True,
        dueno_id=usuario.id,
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.patch("/{barberia_id}/toggle", response_model=BarberiaResponse)
def toggle_barberia(barberia_id: int, usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    barberia = db.query(Barberia).filter(
        Barberia.id == barberia_id,
        Barberia.dueno_id == usuario.id
    ).first()
    if not barberia:
        # Fallback: also allow toggle of primary barberia
        barberia = db.query(Barberia).filter(
            Barberia.id == barberia_id,
            Barberia.id == usuario.barberia_id
        ).first()
    if not barberia:
        raise HTTPException(status_code=404, detail="Barberia no encontrada")
    barberia.activa = not barberia.activa
    db.commit()
    db.refresh(barberia)
    return barberia


@router.get("/", response_model=List[BarberiaResponse])
def listar_barberias(db: Session = Depends(get_db)):
    return db.query(Barberia).all()


@router.get("/slug/{subdominio}", response_model=BarberiaResponse)
def obtener_barberia_por_slug(subdominio: str, db: Session = Depends(get_db)):
    barberia = db.query(Barberia).filter(Barberia.subdominio == subdominio.lower()).first()
    if not barberia:
        raise HTTPException(status_code=404, detail="Barberia no encontrada")
    return barberia


@router.patch("/{barberia_id}/subdominio", response_model=BarberiaResponse)
def actualizar_subdominio(
    barberia_id: int,
    datos: SubdominioUpdate,
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    slug = datos.subdominio.lower().strip()
    if not re.match(r'^[a-z0-9][a-z0-9\-]{1,28}[a-z0-9]$', slug):
        raise HTTPException(
            status_code=400,
            detail="El subdominio solo puede contener letras minusculas, numeros y guiones (3-30 caracteres)"
        )

    barberia = db.query(Barberia).filter(
        Barberia.id == barberia_id,
        Barberia.dueno_id == usuario.id
    ).first()
    if not barberia:
        barberia = db.query(Barberia).filter(
            Barberia.id == barberia_id,
            Barberia.id == usuario.barberia_id
        ).first()
    if not barberia:
        raise HTTPException(status_code=404, detail="Barberia no encontrada")

    existente = db.query(Barberia).filter(
        Barberia.subdominio == slug,
        Barberia.id != barberia_id
    ).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ese subdominio ya esta en uso")

    barberia.subdominio = slug
    db.commit()
    db.refresh(barberia)
    return barberia


@router.get("/{barberia_id}", response_model=BarberiaResponse)
def obtener_barberia(barberia_id: int, db: Session = Depends(get_db)):
    barberia = db.query(Barberia).filter(Barberia.id == barberia_id).first()
    if not barberia:
        raise HTTPException(status_code=404, detail="Barberia no encontrada")
    return barberia
