from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import io
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from typing import List

from app.database import get_db
from app.core.deps import get_usuario_actual
from app.core.config import settings
from app.models.usuario import Usuario
from app.models.barberia import Barberia
from app.models.suscripcion import Suscripcion
from app.models.cita import Cita
from app.models.barbero import Barbero
from app.models.servicio import Servicio
from app.models.cliente import Cliente
from app.services.whatsapp import reenganche_cliente


class ReengancharRequest(BaseModel):
    cliente_id: int

router = APIRouter(prefix="/stats", tags=["Stats"])

PLANES_CON_DASHBOARD = ("basico", "pro", "premium")  # basico = trial pre-pago, accede igual que pro


def _verificar_plan(usuario: Usuario, db: Session):
    barberia = db.query(Barberia).filter(Barberia.id == usuario.barberia_id).first()
    if not barberia:
        raise HTTPException(status_code=404, detail="Barberia no encontrada")
    sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == barberia.id).first()
    plan = sus.plan if sus else barberia.plan
    estado = sus.estado if sus else "trial"
    if plan not in PLANES_CON_DASHBOARD or estado not in ("activa", "trial", "cancelacion_pendiente"):
        raise HTTPException(status_code=403, detail="Esta funcion requiere plan Pro o Premium")
    return barberia


def _sumar_ingresos(db: Session, barberia_id: int, desde: datetime, hasta: datetime) -> float:
    resultado = (
        db.query(func.sum(Servicio.precio))
        .join(Cita, Cita.servicio_id == Servicio.id)
        .filter(
            and_(
                Cita.fecha_hora >= desde,
                Cita.fecha_hora < hasta,
                Cita.estado == "completada",
                Servicio.barberia_id == barberia_id,
            )
        )
        .scalar()
    )
    return float(resultado or 0)


def _citas_del_periodo(db: Session, barberia_id: int, desde: datetime, hasta: datetime):
    return (
        db.query(Cita)
        .join(Barbero, Cita.barbero_id == Barbero.id)
        .filter(
            and_(
                Cita.fecha_hora >= desde,
                Cita.fecha_hora < hasta,
                Cita.estado == "completada",
                Barbero.barberia_id == barberia_id,
            )
        )
        .all()
    )


@router.get("/ingresos")
def ingresos(
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    barberia = _verificar_plan(usuario, db)
    ahora = datetime.utcnow()

    hoy_inicio = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
    semana_inicio = hoy_inicio - timedelta(days=hoy_inicio.weekday())
    if ahora.day <= 15:
        quincena_inicio = hoy_inicio.replace(day=1)
    else:
        quincena_inicio = hoy_inicio.replace(day=16)
    mes_inicio = hoy_inicio.replace(day=1)

    # Ingresos por período
    ingresos_hoy = _sumar_ingresos(db, barberia.id, hoy_inicio, ahora)
    ingresos_semana = _sumar_ingresos(db, barberia.id, semana_inicio, ahora)
    ingresos_quincena = _sumar_ingresos(db, barberia.id, quincena_inicio, ahora)
    ingresos_mes = _sumar_ingresos(db, barberia.id, mes_inicio, ahora)

    # Gráfico diario del mes actual (día → monto)
    grafico = []
    for i in range((hoy_inicio - mes_inicio).days + 1):
        dia = mes_inicio + timedelta(days=i)
        dia_fin = dia + timedelta(days=1)
        monto = _sumar_ingresos(db, barberia.id, dia, dia_fin)
        grafico.append({"fecha": dia.strftime("%d/%m"), "monto": round(monto, 2)})

    # Barbero más productivo de la semana
    barbero_top = None
    rows = (
        db.query(Barbero.nombre, func.count(Cita.id).label("total"))
        .join(Cita, Cita.barbero_id == Barbero.id)
        .filter(
            and_(
                Barbero.barberia_id == barberia.id,
                Cita.fecha_hora >= semana_inicio,
                Cita.estado == "completada",
            )
        )
        .group_by(Barbero.nombre)
        .order_by(func.count(Cita.id).desc())
        .first()
    )
    if rows:
        barbero_top = {"nombre": rows[0], "citas": rows[1]}

    return {
        "ingresos": {
            "hoy": round(ingresos_hoy, 2),
            "semana": round(ingresos_semana, 2),
            "quincena": round(ingresos_quincena, 2),
            "mes": round(ingresos_mes, 2),
        },
        "grafico_mensual": grafico,
        "barbero_top_semana": barbero_top,
    }


@router.get("/retencion")
def retencion(
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    """Clientes sin volver en más de 30 días — solo Premium."""
    barberia = _verificar_plan(usuario, db)
    sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == barberia.id).first()
    plan = sus.plan if sus else barberia.plan
    if plan != "premium":
        raise HTTPException(status_code=403, detail="Esta funcion requiere plan Premium")

    hace_30 = datetime.utcnow() - timedelta(days=30)

    # Última cita por cliente en esta barbería
    subq = (
        db.query(Cita.cliente_id, func.max(Cita.fecha_hora).label("ultima"))
        .join(Barbero, Cita.barbero_id == Barbero.id)
        .filter(Barbero.barberia_id == barberia.id)
        .group_by(Cita.cliente_id)
        .subquery()
    )

    clientes_inactivos = (
        db.query(Cliente, subq.c.ultima)
        .join(subq, Cliente.id == subq.c.cliente_id)
        .filter(subq.c.ultima < hace_30)
        .order_by(subq.c.ultima.asc())
        .limit(50)
        .all()
    )

    return {
        "clientes_inactivos": [
            {
                "id": c.id,
                "nombre": c.nombre,
                "telefono": c.telefono,
                "ultima_visita": ultima.strftime("%d/%m/%Y"),
                "dias_ausente": (datetime.utcnow() - ultima).days,
            }
            for c, ultima in clientes_inactivos
        ]
    }


@router.get("/avanzadas")
def estadisticas_avanzadas(
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    """Métricas avanzadas — solo Premium."""
    barberia = _verificar_plan(usuario, db)
    sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == barberia.id).first()
    plan = sus.plan if sus else barberia.plan
    if plan != "premium":
        raise HTTPException(status_code=403, detail="Esta funcion requiere plan Premium")

    ahora = datetime.utcnow()
    hace_30 = ahora - timedelta(days=30)
    hace_60 = ahora - timedelta(days=60)

    total_clientes = (
        db.query(func.count(func.distinct(Cita.cliente_id)))
        .join(Barbero, Cita.barbero_id == Barbero.id)
        .filter(Barbero.barberia_id == barberia.id)
        .scalar() or 0
    )

    clientes_mes = (
        db.query(func.count(func.distinct(Cita.cliente_id)))
        .join(Barbero, Cita.barbero_id == Barbero.id)
        .filter(and_(Barbero.barberia_id == barberia.id, Cita.fecha_hora >= hace_30))
        .scalar() or 0
    )

    clientes_mes_anterior = (
        db.query(func.count(func.distinct(Cita.cliente_id)))
        .join(Barbero, Cita.barbero_id == Barbero.id)
        .filter(and_(Barbero.barberia_id == barberia.id, Cita.fecha_hora >= hace_60, Cita.fecha_hora < hace_30))
        .scalar() or 0
    )

    servicio_popular = (
        db.query(Servicio.nombre, func.count(Cita.id).label("total"))
        .join(Cita, Cita.servicio_id == Servicio.id)
        .join(Barbero, Cita.barbero_id == Barbero.id)
        .filter(and_(Barbero.barberia_id == barberia.id, Cita.estado == "completada"))
        .group_by(Servicio.nombre)
        .order_by(func.count(Cita.id).desc())
        .first()
    )

    return {
        "total_clientes": total_clientes,
        "clientes_activos_mes": clientes_mes,
        "clientes_mes_anterior": clientes_mes_anterior,
        "tasa_retencion": round((clientes_mes / clientes_mes_anterior * 100) if clientes_mes_anterior > 0 else 0, 1),
        "servicio_mas_popular": {"nombre": servicio_popular[0], "total": servicio_popular[1]} if servicio_popular else None,
    }


@router.post("/reenganche")
def enviar_whatsapp_reenganche(
    datos: ReengancharRequest,
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    """Enviar WhatsApp de reenganche a un cliente inactivo — solo Premium."""
    barberia = _verificar_plan(usuario, db)
    sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == barberia.id).first()
    plan = sus.plan if sus else barberia.plan
    if plan != "premium":
        raise HTTPException(status_code=403, detail="Esta funcion requiere plan Premium")

    cliente = db.query(Cliente).filter(Cliente.id == datos.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # Verificar que el cliente tiene citas en la barberia del usuario autenticado
    cita_propia = (
        db.query(Cita)
        .join(Barbero, Cita.barbero_id == Barbero.id)
        .filter(Cita.cliente_id == datos.cliente_id, Barbero.barberia_id == barberia.id)
        .first()
    )
    if not cita_propia:
        raise HTTPException(status_code=403, detail="Este cliente no pertenece a tu barberia")

    link = f"https://{settings.FRONTEND_URL.replace('http://', '').replace('https://', '')}/agendar/{barberia.id}"
    try:
        reenganche_cliente(
            telefono=cliente.telefono,
            nombre=cliente.nombre,
            barberia_nombre=barberia.nombre,
            link_agendamiento=link,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enviando WhatsApp: {e}")

    return {"ok": True, "mensaje": f"WhatsApp enviado a {cliente.nombre}"}


@router.get("/exportar-pdf")
def exportar_pdf(
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    """Genera y descarga un reporte PDF de los últimos 30 días — solo Premium."""
    barberia = _verificar_plan(usuario, db)
    sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == barberia.id).first()
    plan = sus.plan if sus else barberia.plan
    if plan != "premium":
        raise HTTPException(status_code=403, detail="Esta funcion requiere plan Premium")

    from fpdf import FPDF

    ahora = datetime.utcnow()
    hace_30 = ahora - timedelta(days=30)

    citas = (
        db.query(Cita)
        .join(Barbero, Cita.barbero_id == Barbero.id)
        .filter(
            and_(
                Barbero.barberia_id == barberia.id,
                Cita.fecha_hora >= hace_30,
            )
        )
        .order_by(Cita.fecha_hora.desc())
        .all()
    )

    total = len(citas)
    completadas = sum(1 for c in citas if c.estado == "completada")
    canceladas  = sum(1 for c in citas if c.estado == "cancelada")
    pendientes  = sum(1 for c in citas if c.estado == "pendiente")
    ingresos    = _sumar_ingresos(db, barberia.id, hace_30, ahora)

    # ── Construir PDF ────────────────────────────────────────────
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_page()
    pdf.set_margins(16, 16, 16)

    GOLD   = (201, 168, 76)
    DARK   = (20,  20,  20)
    MUTED  = (120, 120, 120)
    WHITE  = (255, 255, 255)
    GREEN  = (74,  222, 128)
    RED    = (230, 57,  70)
    ORANGE = (251, 146, 60)

    def safe(text: str) -> str:
        replacements = {'á':'a','é':'e','í':'i','ó':'o','ú':'u','ü':'u',
                        'Á':'A','É':'E','Í':'I','Ó':'O','Ú':'U','Ü':'U',
                        'ñ':'n','Ñ':'N','¿':'','¡':'','—':'-','–':'-'}
        for k, v in replacements.items():
            text = text.replace(k, v)
        return text

    # Header band
    pdf.set_fill_color(*DARK)
    pdf.rect(0, 0, 210, 36, 'F')
    pdf.set_y(10)
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(*GOLD)
    pdf.cell(0, 8, "BarberSaaS", align='L')
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*MUTED)
    pdf.set_y(10)
    pdf.cell(0, 8, f"Generado: {ahora.strftime('%d/%m/%Y %H:%M')} UTC", align='R', new_x="LMARGIN", new_y="NEXT")
    pdf.set_y(40)

    # Barbería y periodo
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 10, safe(barberia.nombre), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 6, safe(f"Reporte de citas — {hace_30.strftime('%d/%m/%Y')} al {ahora.strftime('%d/%m/%Y')}"), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    # Línea separadora
    pdf.set_draw_color(*GOLD)
    pdf.set_line_width(0.6)
    pdf.line(16, pdf.get_y(), 194, pdf.get_y())
    pdf.ln(8)

    # Resumen — 4 chips en fila
    col_w = 43
    chips = [
        ("TOTAL CITAS", str(total), DARK),
        ("COMPLETADAS", str(completadas), GREEN),
        ("CANCELADAS",  str(canceladas),  RED),
        ("INGRESOS",    f"CRC {ingresos:,.0f}", GOLD),
    ]
    y0 = pdf.get_y()
    for i, (label, value, color) in enumerate(chips):
        x = 16 + i * (col_w + 2)
        pdf.set_fill_color(245, 245, 245)
        pdf.rect(x, y0, col_w, 22, 'F')
        pdf.set_xy(x, y0 + 3)
        pdf.set_font("Helvetica", "", 7)
        pdf.set_text_color(*MUTED)
        pdf.cell(col_w, 4, label, align='C')
        pdf.set_xy(x, y0 + 9)
        pdf.set_font("Helvetica", "B", 13)
        pdf.set_text_color(*color)
        pdf.cell(col_w, 8, safe(value), align='C')
    pdf.set_y(y0 + 28)

    if not citas:
        pdf.set_font("Helvetica", "", 12)
        pdf.set_text_color(*MUTED)
        pdf.cell(0, 10, "No hay citas en este periodo.", align='C', new_x="LMARGIN", new_y="NEXT")
    else:
        # Encabezado tabla
        headers = ["Fecha", "Hora", "Barbero", "Cliente", "Servicio", "Precio", "Estado"]
        col_ws  = [24,       16,     36,         40,         40,         26,       22]

        pdf.set_fill_color(*DARK)
        pdf.set_text_color(*WHITE)
        pdf.set_font("Helvetica", "B", 8)
        for h, w in zip(headers, col_ws):
            pdf.cell(w, 7, h, border=0, fill=True, align='C')
        pdf.ln()

        # Filas
        pdf.set_font("Helvetica", "", 7.5)
        for idx, c in enumerate(citas):
            barbero_obj  = db.query(Barbero).filter(Barbero.id == c.barbero_id).first()
            cliente_obj  = db.query(Cliente).filter(Cliente.id == c.cliente_id).first()
            servicio_obj = db.query(Servicio).filter(Servicio.id == c.servicio_id).first()

            fill_bg = (248, 248, 248) if idx % 2 == 0 else WHITE
            pdf.set_fill_color(*fill_bg)

            if c.estado == "completada":
                estado_color = GREEN
            elif c.estado == "cancelada":
                estado_color = RED
            else:
                estado_color = ORANGE

            row = [
                c.fecha_hora.strftime("%d/%m/%y"),
                c.fecha_hora.strftime("%H:%M"),
                safe(barbero_obj.nombre  if barbero_obj  else "-"),
                safe(cliente_obj.nombre  if cliente_obj  else "-"),
                safe(servicio_obj.nombre if servicio_obj else "-"),
                f"{float(servicio_obj.precio):,.0f}" if servicio_obj else "-",
                c.estado.capitalize(),
            ]

            for i, (val, w) in enumerate(zip(row, col_ws)):
                if i == 6:
                    pdf.set_text_color(*estado_color)
                else:
                    pdf.set_text_color(*DARK)
                pdf.cell(w, 6, val, border=0, fill=True, align='C')
            pdf.ln()

        # Línea cierre tabla
        pdf.set_draw_color(220, 220, 220)
        pdf.set_line_width(0.3)
        pdf.line(16, pdf.get_y(), 194, pdf.get_y())
        pdf.ln(4)

        # Totales pie
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*DARK)
        total_w = sum(col_ws[:6])
        pdf.cell(total_w, 7, f"Total ingresos ({completadas} citas completadas):", align='R')
        pdf.set_text_color(*GOLD)
        pdf.cell(col_ws[6], 7, safe(f"CRC {ingresos:,.0f}"), align='C', new_x="LMARGIN", new_y="NEXT")

    # Footer
    pdf.set_y(-18)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 6, "BarberSaaS — Sistema de gestion de barberias | barbersas.com", align='C')

    buf = io.BytesIO(pdf.output())
    filename = f"reporte_{barberia.nombre.lower().replace(' ', '_')}_{ahora.strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
