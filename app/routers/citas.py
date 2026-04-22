import os, uuid, shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from typing import List
from app.database import get_db
from app.models.cita import Cita
from app.models.barbero import Barbero
from app.models.cliente import Cliente
from app.models.servicio import Servicio
from app.models.usuario import Usuario
from app.schemas import CitaCreate, CitaResponse
from app.services.whatsapp import (
    confirmar_cita, notificar_cancelacion,
    notificar_barbero_nueva_cita, notificar_barbero_cancelacion,
    notificar_lista_espera, notificar_completada_cliente,
    notificar_pago_pendiente_barbero, notificar_cita_confirmada_pago,
    notificar_pago_rechazado, notificar_comprobante_barbero,
)
from app.models.configuracion_pagos import ConfiguracionPagos
from app.models.barberia import Barberia
from app.core.deps import get_usuario_actual, get_barbero_actual
from app.core.config import settings
from app.models.lista_espera import ListaEspera

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

    # Determinar estado_pago según configuración de la barbería
    barberia_id = barbero.barberia_id
    config_pagos = db.query(ConfiguracionPagos).filter(
        ConfiguracionPagos.barberia_id == barberia_id
    ).first()

    metodo = cita.metodo_pago
    estado_pago = "exento"
    if config_pagos and config_pagos.deposito_requerido and metodo in ("sinpe", "efectivo"):
        estado_pago = "pendiente"

    datos = cita.model_dump()
    datos["estado_pago"] = estado_pago
    nueva = Cita(**datos)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    # Enviar confirmacion por WhatsApp
    try:
        cliente = db.query(Cliente).filter(Cliente.id == nueva.cliente_id).first()
        servicio = db.query(Servicio).filter(Servicio.id == nueva.servicio_id).first()
        fecha_hora_str = nueva.fecha_hora.strftime("%d/%m/%y a las %H:%M")
        if cliente and cliente.telefono:
            confirmar_cita(
                telefono=cliente.telefono,
                nombre=cliente.nombre,
                fecha_hora=fecha_hora_str,
                servicio=servicio.nombre if servicio else "Servicio",
                barbero=barbero.nombre
            )
        if barbero.telefono:
            notificar_barbero_nueva_cita(
                telefono=barbero.telefono,
                nombre_barbero=barbero.nombre,
                cliente=cliente.nombre if cliente else "Cliente",
                servicio=servicio.nombre if servicio else "Servicio",
                fecha_hora=fecha_hora_str
            )
            # Notificar al barbero que hay un pago pendiente de verificar
            if estado_pago == "pendiente" and metodo and servicio:
                notificar_pago_pendiente_barbero(
                    telefono=barbero.telefono,
                    nombre_barbero=barbero.nombre,
                    cliente=cliente.nombre if cliente else "Cliente",
                    servicio=servicio.nombre,
                    metodo=metodo,
                    fecha_hora=fecha_hora_str,
                    monto=servicio.precio,
                )
        else:
            print(f"[WhatsApp] Barbero {barbero.id} ({barbero.nombre}) no tiene telefono guardado")
    except Exception as e:
        print(f"[WhatsApp] ERROR en notificacion de nueva cita: {e}")  # Si falla WhatsApp, la cita igual se guarda

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
    hora_actual = dia.replace(hour=5, minute=0)
    hora_fin = dia.replace(hour=23, minute=30)

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

@router.get("/mias", response_model=List[CitaResponse])
def listar_mis_citas(usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    return (
        db.query(Cita)
        .join(Barbero, Cita.barbero_id == Barbero.id)
        .filter(Barbero.barberia_id == usuario.barberia_id)
        .order_by(Cita.fecha_hora.asc())
        .all()
    )

@router.patch("/{cita_id}/completar", response_model=CitaResponse)
def completar_cita(cita_id: int, usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    cita = db.query(Cita).filter(Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    barbero = db.query(Barbero).filter(Barbero.id == cita.barbero_id).first()
    if not barbero or barbero.barberia_id != usuario.barberia_id:
        raise HTTPException(status_code=403, detail="No tienes permiso sobre esta cita")
    if cita.estado != "pendiente":
        raise HTTPException(status_code=400, detail="Solo se pueden completar citas pendientes")
    cita.estado = "completada"
    db.commit()
    db.refresh(cita)

    # Notificar al cliente que su cita fue completada
    try:
        cliente = db.query(Cliente).filter(Cliente.id == cita.cliente_id).first()
        barberia = db.query(Barberia).filter(Barberia.id == barbero.barberia_id).first()
        if cliente and cliente.telefono and barberia:
            notificar_completada_cliente(
                telefono=cliente.telefono,
                nombre=cliente.nombre,
                barberia_nombre=barberia.nombre,
            )
    except Exception as e:
        print(f"[WhatsApp] ERROR en notificacion de completada: {e}")

    return cita

@router.patch("/{cita_id}/descompletar", response_model=CitaResponse)
def descompletar_cita(cita_id: int, usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    cita = db.query(Cita).filter(Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    barbero = db.query(Barbero).filter(Barbero.id == cita.barbero_id).first()
    if not barbero or barbero.barberia_id != usuario.barberia_id:
        raise HTTPException(status_code=403, detail="No tienes permiso sobre esta cita")
    if cita.estado != "completada":
        raise HTTPException(status_code=400, detail="Solo se pueden revertir citas completadas")
    cita.estado = "pendiente"
    db.commit()
    db.refresh(cita)
    return cita


@router.patch("/{cita_id}/completar-barbero")
def completar_cita_barbero(
    cita_id: int,
    barbero: Barbero = Depends(get_barbero_actual),
    db: Session = Depends(get_db),
):
    cita = db.query(Cita).filter(Cita.id == cita_id, Cita.barbero_id == barbero.id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    if cita.estado != "pendiente":
        raise HTTPException(status_code=400, detail="Solo se pueden completar citas pendientes")
    cita.estado = "completada"
    db.commit()
    db.refresh(cita)
    return {"ok": True}


@router.get("/", response_model=List[CitaResponse])
def listar_citas(usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    return (
        db.query(Cita)
        .join(Barbero, Cita.barbero_id == Barbero.id)
        .filter(Barbero.barberia_id == usuario.barberia_id)
        .all()
    )

@router.get("/{cita_id}", response_model=CitaResponse)
def obtener_cita(cita_id: int, usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    cita = db.query(Cita).filter(Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    barbero = db.query(Barbero).filter(Barbero.id == cita.barbero_id).first()
    if not barbero or barbero.barberia_id != usuario.barberia_id:
        raise HTTPException(status_code=403, detail="No tienes permiso sobre esta cita")
    return cita

@router.patch("/{cita_id}/confirmar-pago", response_model=CitaResponse)
def confirmar_pago(cita_id: int, usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    cita = db.query(Cita).filter(Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    barbero = db.query(Barbero).filter(Barbero.id == cita.barbero_id).first()
    if not barbero or barbero.barberia_id != usuario.barberia_id:
        raise HTTPException(status_code=403, detail="No tienes permiso sobre esta cita")
    if cita.estado_pago != "pendiente":
        raise HTTPException(status_code=400, detail="Esta cita no tiene un pago pendiente")
    cita.estado_pago = "confirmado"
    db.commit()
    db.refresh(cita)
    try:
        cliente = db.query(Cliente).filter(Cliente.id == cita.cliente_id).first()
        servicio = db.query(Servicio).filter(Servicio.id == cita.servicio_id).first()
        if cliente and cliente.telefono:
            notificar_cita_confirmada_pago(
                telefono=cliente.telefono,
                nombre=cliente.nombre,
                servicio=servicio.nombre if servicio else "Servicio",
                fecha_hora=cita.fecha_hora.strftime("%d/%m/%y a las %H:%M"),
            )
    except Exception as e:
        print(f"[WhatsApp] ERROR confirmar pago: {e}")
    return cita


@router.patch("/{cita_id}/rechazar-pago", response_model=CitaResponse)
def rechazar_pago(cita_id: int, usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    cita = db.query(Cita).filter(Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    barbero = db.query(Barbero).filter(Barbero.id == cita.barbero_id).first()
    if not barbero or barbero.barberia_id != usuario.barberia_id:
        raise HTTPException(status_code=403, detail="No tienes permiso sobre esta cita")
    if cita.estado_pago != "pendiente":
        raise HTTPException(status_code=400, detail="Esta cita no tiene un pago pendiente")
    cita.estado_pago = "rechazado"
    cita.estado = "cancelada"
    db.commit()
    db.refresh(cita)
    try:
        cliente = db.query(Cliente).filter(Cliente.id == cita.cliente_id).first()
        if cliente and cliente.telefono:
            notificar_pago_rechazado(telefono=cliente.telefono, nombre=cliente.nombre)
    except Exception as e:
        print(f"[WhatsApp] ERROR rechazar pago: {e}")
    return cita


COMPROBANTES_DIR = "/tmp/comprobantes"
MAX_FILE_SIZE = 8 * 1024 * 1024  # 8 MB

# Validated by magic bytes, NOT by content_type (which is user-controlled)
IMAGE_SIGNATURES = {
    b"\xff\xd8\xff": "jpg",
    b"\x89PNG\r\n\x1a\n": "png",
    b"RIFF": "webp",   # checked further below
    b"GIF87a": "gif",
    b"GIF89a": "gif",
}

def _detect_image_ext(header: bytes) -> str | None:
    if header[:3] == b"\xff\xd8\xff":
        return "jpg"
    if header[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if header[:4] == b"RIFF" and header[8:12] == b"WEBP":
        return "webp"
    if header[:6] in (b"GIF87a", b"GIF89a"):
        return "gif"
    return None

@router.post("/{cita_id}/comprobante", response_model=CitaResponse)
async def subir_comprobante(cita_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Read full file into memory with size cap to prevent disk exhaustion
    data = await file.read(MAX_FILE_SIZE + 1)
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="El archivo no puede superar 8 MB")

    # Validate by actual magic bytes, not by content_type (user-controlled)
    ext = _detect_image_ext(data[:12])
    if ext is None:
        raise HTTPException(status_code=400, detail="Solo se aceptan imágenes (jpg, png, webp, gif)")

    cita = db.query(Cita).filter(Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    # Filename is a pure UUID hex + validated ext — never derived from user input
    filename = f"{uuid.uuid4().hex}.{ext}"
    os.makedirs(COMPROBANTES_DIR, exist_ok=True)
    dest = os.path.join(COMPROBANTES_DIR, filename)
    with open(dest, "wb") as f:
        f.write(data)

    comprobante_url = f"{settings.BACKEND_URL}/comprobantes/{filename}"
    cita.comprobante_url = comprobante_url
    cita.estado_pago = "pendiente"
    db.commit()
    db.refresh(cita)

    try:
        barbero = db.query(Barbero).filter(Barbero.id == cita.barbero_id).first()
        cliente = db.query(Cliente).filter(Cliente.id == cita.cliente_id).first()
        servicio = db.query(Servicio).filter(Servicio.id == cita.servicio_id).first()
        fecha_str = cita.fecha_hora.strftime("%d/%m/%y a las %H:%M")
        if barbero and barbero.telefono:
            notificar_comprobante_barbero(
                telefono=barbero.telefono,
                nombre_barbero=barbero.nombre,
                cliente=cliente.nombre if cliente else "Cliente",
                servicio=servicio.nombre if servicio else "Servicio",
                fecha_hora=fecha_str,
                monto=servicio.precio if servicio else 0,
                comprobante_url=comprobante_url,
            )
        # Notificar al cliente que su pago está pendiente de confirmación
        if cliente and cliente.telefono:
            from app.services.whatsapp import enviar_mensaje
            enviar_mensaje(
                cliente.telefono,
                f"Hola {cliente.nombre}! Recibimos tu comprobante de pago.\n\n"
                f"Servicio: {servicio.nombre if servicio else 'Servicio'}\n"
                f"Fecha: {fecha_str}\n\n"
                f"Tu cita queda *pendiente de confirmacion* hasta que el barbero verifique el pago. "
                f"Te avisaremos cuando este confirmada."
            )
    except Exception as e:
        print(f"[WhatsApp] ERROR enviando comprobante: {e}")

    return cita


@router.patch("/{cita_id}/cancelar", response_model=CitaResponse)
def cancelar_cita(cita_id: int, usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    cita = db.query(Cita).filter(Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    barbero = db.query(Barbero).filter(Barbero.id == cita.barbero_id).first()
    if not barbero or barbero.barberia_id != usuario.barberia_id:
        raise HTTPException(status_code=403, detail="No tienes permiso sobre esta cita")
    if cita.estado == "cancelada":
        raise HTTPException(status_code=400, detail="La cita ya fue cancelada")
    cita.estado = "cancelada"
    db.commit()
    db.refresh(cita)

    # Notificar cancelacion por WhatsApp al cliente y al barbero
    try:
        cliente = db.query(Cliente).filter(Cliente.id == cita.cliente_id).first()
        barbero = db.query(Barbero).filter(Barbero.id == cita.barbero_id).first()
        fecha_hora_str = cita.fecha_hora.strftime("%d/%m/%y a las %H:%M")
        if cliente and cliente.telefono:
            barberia_obj = db.query(Barberia).filter(Barberia.id == barbero.barberia_id).first() if barbero else None
            link_ag = f"{settings.FRONTEND_URL}/agendar/{barbero.barberia_id}" if barbero else ""
            if barberia_obj and barberia_obj.slug:
                link_ag = f"{settings.FRONTEND_URL}/b/{barberia_obj.slug}"
            notificar_cancelacion(cliente.telefono, cliente.nombre, link_agendamiento=link_ag)
        if barbero and barbero.telefono:
            notificar_barbero_cancelacion(
                telefono=barbero.telefono,
                nombre_barbero=barbero.nombre,
                cliente=cliente.nombre if cliente else "Cliente",
                fecha_hora=fecha_hora_str
            )
    except Exception as e:
        print(f"[WhatsApp] ERROR en notificacion de cancelacion: {e}")

    # Notificar al primero en lista de espera de esta barbería
    try:
        barbero_cita = db.query(Barbero).filter(Barbero.id == cita.barbero_id).first()
        if barbero_cita:
            siguiente = (
                db.query(ListaEspera)
                .filter(
                    ListaEspera.barberia_id == barbero_cita.barberia_id,
                    ListaEspera.estado == "esperando",
                )
                .order_by(ListaEspera.posicion.asc())
                .first()
            )
            if siguiente:
                barberia = db.query(Barberia).filter(Barberia.id == barbero_cita.barberia_id).first()
                link = f"{settings.FRONTEND_URL}/agendar/{barbero_cita.barberia_id}"
                notificar_lista_espera(
                    telefono=siguiente.cliente_telefono,
                    nombre=siguiente.cliente_nombre,
                    barberia_nombre=barberia.nombre if barberia else "la barbería",
                    link_agendamiento=link,
                )
                siguiente.estado = "notificado"
                siguiente.notificado_en = datetime.utcnow()
                db.commit()
    except Exception:
        pass

    return cita
