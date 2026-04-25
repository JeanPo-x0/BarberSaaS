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
    try:
        from fpdf import FPDF, __version__ as fpdf_version
        print(f"[PDF] fpdf2 version: {fpdf_version}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"fpdf2 no disponible: {e}")

    barberia = _verificar_plan(usuario, db)
    sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == barberia.id).first()
    plan = sus.plan if sus else barberia.plan
    if plan != "premium":
        raise HTTPException(status_code=403, detail="Esta funcion requiere plan Premium")

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
    LM = 14        # left/right margin
    PW = 210       # A4 width mm
    UW = PW - LM * 2   # usable width = 182mm

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()
    pdf.set_margins(LM, LM, LM)

    GOLD    = (201, 168, 76)
    DARK    = (18,  18,  18)
    DARK2   = (40,  40,  40)
    MUTED   = (140, 140, 140)
    WHITE   = (255, 255, 255)
    GREEN   = (22,  163, 74)
    RED     = (220, 38,  38)
    ORANGE  = (234, 88,  12)
    LIGHT   = (248, 248, 248)
    BORDER  = (220, 220, 220)

    def safe(text: str) -> str:
        reps = {'á':'a','é':'e','í':'i','ó':'o','ú':'u','ü':'u',
                'Á':'A','É':'E','Í':'I','Ó':'O','Ú':'U','Ü':'U',
                'ñ':'n','Ñ':'N','¿':'','¡':'','—':'-','–':'-','·':'-'}
        for k, v in reps.items():
            text = text.replace(k, v)
        return text

    def trunc(text: str, max_chars: int) -> str:
        return text if len(text) <= max_chars else text[:max_chars - 1] + "."

    # ── HEADER (full-width dark band) ────────────────────────────
    pdf.set_fill_color(*DARK)
    pdf.rect(0, 0, PW, 44, 'F')
    pdf.set_fill_color(*GOLD)
    pdf.rect(0, 0, 5, 44, 'F')          # gold left accent

    pdf.set_xy(LM + 2, 11)
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(*GOLD)
    pdf.cell(80, 10, "BarberSaaS", align='L')

    pdf.set_xy(LM + 2, 25)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(160, 160, 160)
    pdf.cell(80, 5, "Sistema de Gestion de Barberias", align='L')

    pdf.set_xy(LM + 82, 13)
    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(180, 180, 180)
    pdf.cell(UW - 82, 6, f"Generado: {ahora.strftime('%d/%m/%Y  %H:%M')} UTC", align='R')

    pdf.set_xy(LM + 82, 22)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(UW - 82, 6, "barbersas.com", align='R')

    pdf.set_y(54)

    # ── BARBERÍA NAME + PERIODO ──────────────────────────────────
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 9, safe(barberia.nombre), new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_text_color(*MUTED)
    periodo = f"Reporte de citas: {hace_30.strftime('%d/%m/%Y')} al {ahora.strftime('%d/%m/%Y')}"
    pdf.cell(0, 5, safe(periodo), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

    # Gold separator
    pdf.set_draw_color(*GOLD)
    pdf.set_line_width(0.7)
    pdf.line(LM, pdf.get_y(), PW - LM, pdf.get_y())
    pdf.ln(9)

    # ── KPI CARDS (4 cards, gap 3mm) ────────────────────────────
    CARD_W = (UW - 9) / 4    # ~42.75mm each
    CARD_H = 26
    y_kpi  = pdf.get_y()

    kpis = [
        ("TOTAL CITAS",  str(total),                 DARK,  str(pendientes) + " pendientes"),
        ("COMPLETADAS",  str(completadas),            GREEN, ""),
        ("CANCELADAS",   str(canceladas),             RED,   ""),
        ("INGRESOS",     f"CRC {ingresos:,.0f}",      GOLD,  "ultimos 30 dias"),
    ]
    for i, (label, value, color, sub) in enumerate(kpis):
        x = LM + i * (CARD_W + 3)
        # card bg + border
        pdf.set_fill_color(*LIGHT)
        pdf.set_draw_color(*BORDER)
        pdf.set_line_width(0.2)
        pdf.rect(x, y_kpi, CARD_W, CARD_H, 'FD')
        # gold top accent bar
        pdf.set_fill_color(*GOLD)
        pdf.rect(x, y_kpi, CARD_W, 1.8, 'F')
        # label
        pdf.set_xy(x, y_kpi + 4)
        pdf.set_font("Helvetica", "B", 6)
        pdf.set_text_color(*MUTED)
        pdf.cell(CARD_W, 4, label, align='C')
        # value
        font_sz = 15 if len(value) <= 6 else 11 if len(value) <= 12 else 9
        pdf.set_xy(x, y_kpi + 9)
        pdf.set_font("Helvetica", "B", font_sz)
        pdf.set_text_color(*color)
        pdf.cell(CARD_W, 9, safe(value), align='C')
        # sub-label
        if sub:
            pdf.set_xy(x, y_kpi + 19)
            pdf.set_font("Helvetica", "", 6)
            pdf.set_text_color(*MUTED)
            pdf.cell(CARD_W, 4, safe(sub), align='C')

    pdf.set_y(y_kpi + CARD_H + 10)

    # ── TABLE ────────────────────────────────────────────────────
    # Columns sum exactly = UW (182mm)
    COLS = [
        ("Fecha",    22),
        ("Hora",     13),
        ("Barbero",  28),
        ("Cliente",  31),
        ("Servicio", 38),
        ("Precio",   26),
        ("Estado",   24),
    ]   # 22+13+28+31+38+26+24 = 182 ✓

    HDR_H = 8
    ROW_H = 7

    if not citas:
        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(*MUTED)
        pdf.cell(0, 12, "No hay citas en este periodo.", align='C', new_x="LMARGIN", new_y="NEXT")
    else:
        # Table section label
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*DARK2)
        pdf.cell(0, 6, "Detalle de citas", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)

        # Header row
        pdf.set_fill_color(*DARK)
        pdf.set_text_color(*WHITE)
        pdf.set_font("Helvetica", "B", 7.5)
        for col_label, w in COLS:
            pdf.cell(w, HDR_H, col_label, border=0, fill=True, align='C')
        pdf.ln()

        # Data rows
        for idx, c in enumerate(citas):
            barbero_obj  = db.query(Barbero).filter(Barbero.id == c.barbero_id).first()
            cliente_obj  = db.query(Cliente).filter(Cliente.id == c.cliente_id).first()
            servicio_obj = db.query(Servicio).filter(Servicio.id == c.servicio_id).first()

            bg = LIGHT if idx % 2 == 0 else WHITE
            pdf.set_fill_color(*bg)

            if c.estado == "completada":
                ec, etxt = GREEN,  "Completada"
            elif c.estado == "cancelada":
                ec, etxt = RED,    "Cancelada"
            else:
                ec, etxt = ORANGE, "Pendiente"

            vals = [
                c.fecha_hora.strftime("%d/%m/%y"),
                c.fecha_hora.strftime("%H:%M"),
                trunc(safe(barbero_obj.nombre  if barbero_obj  else "-"), 15),
                trunc(safe(cliente_obj.nombre  if cliente_obj  else "-"), 17),
                trunc(safe(servicio_obj.nombre if servicio_obj else "-"), 20),
                f"CRC {float(servicio_obj.precio):,.0f}" if servicio_obj else "-",
                etxt,
            ]

            pdf.set_font("Helvetica", "", 7.5)
            for i, ((_, w), val) in enumerate(zip(COLS, vals)):
                if i == 6:
                    pdf.set_text_color(*ec)
                    pdf.set_font("Helvetica", "B", 7.5)
                else:
                    pdf.set_text_color(*DARK)
                    pdf.set_font("Helvetica", "", 7.5)
                pdf.cell(w, ROW_H, val, border=0, fill=True, align='C')
            pdf.ln()

        # Bottom table line
        pdf.set_draw_color(*BORDER)
        pdf.set_line_width(0.3)
        pdf.line(LM, pdf.get_y(), PW - LM, pdf.get_y())
        pdf.ln(5)

        # Totals row
        label_w = sum(w for _, w in COLS[:6])
        val_w   = COLS[6][1]
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*DARK2)
        pdf.cell(label_w, 8, f"Total ingresos  ({completadas} citas completadas):", align='R')
        pdf.set_text_color(*GOLD)
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(val_w, 8, safe(f"CRC {ingresos:,.0f}"), align='C', new_x="LMARGIN", new_y="NEXT")

    # ── FOOTER ───────────────────────────────────────────────────
    pdf.set_y(-16)
    pdf.set_draw_color(*GOLD)
    pdf.set_line_width(0.4)
    pdf.line(LM, pdf.get_y(), PW - LM, pdf.get_y())
    pdf.ln(2)
    pdf.set_font("Helvetica", "", 7.5)
    pdf.set_text_color(*MUTED)
    pdf.cell(UW // 2, 6, "BarberSaaS - barbersas.com", align='L')
    pdf.cell(UW - UW // 2, 6, f"Pagina {pdf.page_no()}", align='R')

    try:
        output = pdf.output()
        buf = io.BytesIO(bytes(output) if not isinstance(output, bytes) else output)
    except Exception as e:
        import traceback
        print(f"[PDF] Error generando PDF: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error generando PDF: {e}")

    filename = f"reporte_{barberia.nombre.lower().replace(' ', '_')}_{ahora.strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
