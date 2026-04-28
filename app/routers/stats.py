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
        from fpdf import FPDF
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
    LM = 20        # left/right margin mm (≈ 30px equivalent)
    PW = 210       # A4 width mm
    UW = PW - LM * 2   # 170mm usable

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=22)
    pdf.add_page()
    pdf.set_margins(LM, 10, LM)

    # Palette — matches spec exactly
    DARK         = (26,  26,  26)    # #1a1a1a
    DARK_TXT     = (17,  17,  17)    # #111
    MUTED        = (170, 170, 170)   # #aaa
    WHITE        = (255, 255, 255)
    GOLD_DK      = (180, 83,  9)     # #b45309
    BORDER       = (229, 229, 229)   # #e5e5e5
    ROW_LINE     = (240, 240, 240)   # #f0f0f0
    FAFAFA       = (250, 250, 250)
    KPI_TOT      = (17,  17,  17)
    KPI_COMP     = (22,  163, 74)    # #16a34a
    KPI_CANC     = (220, 38,  38)    # #dc2626
    KPI_ING      = (180, 83,  9)     # #b45309
    BADGE_GRN_BG = (220, 252, 231)   # #dcfce7
    BADGE_GRN_TX = (21,  128, 61)    # #15803d
    BADGE_RED_BG = (254, 226, 226)   # #fee2e2
    BADGE_RED_TX = (185, 28,  28)    # #b91c1c
    BADGE_ORG_BG = (254, 243, 199)
    BADGE_ORG_TX = (146, 64,  14)

    def safe(text: str) -> str:
        reps = {'á':'a','é':'e','í':'i','ó':'o','ú':'u','ü':'u',
                'Á':'A','É':'E','Í':'I','Ó':'O','Ú':'U','Ü':'U',
                'ñ':'n','Ñ':'N','¿':'','¡':'','—':'-','–':'-','·':'-'}
        for k, v in reps.items():
            text = text.replace(k, v)
        return text

    def trunc(text: str, n: int) -> str:
        return text if len(text) <= n else text[:n - 1] + '.'

    # ── HEADER — full-width dark band, 20mm vertical padding ─────
    HDR_H = 40
    pdf.set_fill_color(*DARK)
    pdf.rect(0, 0, PW, HDR_H, 'F')

    pdf.set_xy(LM, 12)
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(212, 175, 55)   # #D4AF37
    pdf.cell(90, 9, "BarberSaaS", align='L')

    pdf.set_xy(LM, 23)
    pdf.set_font("Helvetica", "", 7.5)
    pdf.set_text_color(*MUTED)
    pdf.cell(90, 5, "Sistema de Gestion de Barberias", align='L')

    pdf.set_xy(LM + 90, 16)
    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(150, 150, 150)
    pdf.cell(UW - 90, 7, f"Generado: {ahora.strftime('%d/%m/%Y  %H:%M')} UTC", align='R')

    # Gold separator line full-width, 0.7mm ≈ 2px
    pdf.set_draw_color(212, 175, 55)
    pdf.set_line_width(0.7)
    pdf.line(0, HDR_H, PW, HDR_H)

    pdf.set_y(HDR_H + 11)

    # ── BARBERÍA NAME + PERIODO ──────────────────────────────────
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(*DARK_TXT)
    pdf.cell(0, 8, safe(barberia.nombre), new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 5,
             safe(f"Periodo: {hace_30.strftime('%d/%m/%Y')} - {ahora.strftime('%d/%m/%Y')}"),
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    # ── KPI CARDS — 4 cols, border 0.5px #e5e5e5 ────────────────
    GAP    = 3
    CARD_W = (UW - GAP * 3) / 4   # ~40.75mm
    CARD_H = 28
    y_kpi  = pdf.get_y()

    kpis = [
        ("TOTAL CITAS", str(total),             KPI_TOT),
        ("COMPLETADAS", str(completadas),        KPI_COMP),
        ("CANCELADAS",  str(canceladas),         KPI_CANC),
        ("INGRESOS",    f"CRC {ingresos:,.0f}", KPI_ING),
    ]
    for i, (label, value, vcolor) in enumerate(kpis):
        cx = LM + i * (CARD_W + GAP)
        pdf.set_fill_color(*WHITE)
        pdf.set_draw_color(*BORDER)
        pdf.set_line_width(0.4)
        pdf.rect(cx, y_kpi, CARD_W, CARD_H, 'FD')

        # label 10px caps ≈ 7pt
        pdf.set_xy(cx, y_kpi + 5)
        pdf.set_font("Helvetica", "B", 6.5)
        pdf.set_text_color(*MUTED)
        pdf.cell(CARD_W, 4, label, align='C')

        # value 22px ≈ 15.5pt
        fsz = 15 if len(value) <= 7 else 11 if len(value) <= 13 else 9
        pdf.set_xy(cx, y_kpi + 11)
        pdf.set_font("Helvetica", "B", fsz)
        pdf.set_text_color(*vcolor)
        pdf.cell(CARD_W, 11, safe(value), align='C')

    pdf.set_y(y_kpi + CARD_H + 10)

    # ── TABLE — columns sum = 170mm = UW ─────────────────────────
    COLS = [
        ("Fecha",    20),
        ("Hora",     12),
        ("Barbero",  26),
        ("Cliente",  28),
        ("Servicio", 34),
        ("Precio",   24),
        ("Estado",   26),
    ]   # 20+12+26+28+34+24+26 = 170 ✓

    TH = 8   # table header height mm
    RH = 8   # row height mm

    if not citas:
        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(*MUTED)
        pdf.cell(0, 14, "No hay citas en este periodo.", align='C', new_x="LMARGIN", new_y="NEXT")
    else:
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*DARK_TXT)
        pdf.cell(0, 6, "Detalle de citas", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)

        # Header — dark bg, grayish text
        pdf.set_fill_color(*DARK)
        pdf.set_text_color(200, 200, 200)
        pdf.set_font("Helvetica", "B", 7.5)
        for col_lbl, cw in COLS:
            pdf.cell(cw, TH, col_lbl, border=0, fill=True, align='C')
        pdf.ln()

        # Data rows
        for idx, c in enumerate(citas):
            barbero_obj  = db.query(Barbero).filter(Barbero.id == c.barbero_id).first()
            cliente_obj  = db.query(Cliente).filter(Cliente.id == c.cliente_id).first()
            servicio_obj = db.query(Servicio).filter(Servicio.id == c.servicio_id).first()

            row_y = pdf.get_y()

            # Row bg: #fafafa even, white odd
            pdf.set_fill_color(*(FAFAFA if idx % 2 == 0 else WHITE))
            pdf.rect(LM, row_y, UW, RH, 'F')

            # Estado badge colors
            if c.estado == "completada":
                bbg, btx, etxt = BADGE_GRN_BG, BADGE_GRN_TX, "Completada"
            elif c.estado == "cancelada":
                bbg, btx, etxt = BADGE_RED_BG, BADGE_RED_TX, "Cancelada"
            else:
                bbg, btx, etxt = BADGE_ORG_BG, BADGE_ORG_TX, "Pendiente"

            vals = [
                c.fecha_hora.strftime("%d/%m/%y"),
                c.fecha_hora.strftime("%H:%M"),
                trunc(safe(barbero_obj.nombre  if barbero_obj  else "-"), 14),
                trunc(safe(cliente_obj.nombre  if cliente_obj  else "-"), 16),
                trunc(safe(servicio_obj.nombre if servicio_obj else "-"), 20),
                f"CRC {float(servicio_obj.precio):,.0f}" if servicio_obj else "-",
                None,
            ]

            cur_x = LM
            for i, ((_, cw), val) in enumerate(zip(COLS, vals)):
                if i == 6:
                    PAD_X, PAD_Y = 3, 1.5
                    bw = cw - PAD_X * 2
                    bh = RH  - PAD_Y * 2
                    pdf.set_fill_color(*bbg)
                    pdf.rect(cur_x + PAD_X, row_y + PAD_Y, bw, bh, 'F')
                    pdf.set_xy(cur_x + PAD_X, row_y + PAD_Y)
                    pdf.set_font("Helvetica", "B", 7)
                    pdf.set_text_color(*btx)
                    pdf.cell(bw, bh, etxt, align='C')
                else:
                    pdf.set_xy(cur_x, row_y)
                    pdf.set_font("Helvetica", "", 7.5)
                    pdf.set_text_color(*DARK_TXT)
                    pdf.cell(cw, RH, val, border=0, fill=False, align='C')
                cur_x += cw

            # Row bottom border 0.5px #f0f0f0
            pdf.set_draw_color(*ROW_LINE)
            pdf.set_line_width(0.2)
            pdf.line(LM, row_y + RH, LM + UW, row_y + RH)
            pdf.set_y(row_y + RH)

        pdf.ln(6)

        # Totals footer — separated by 0.5px #e5e5e5
        pdf.set_draw_color(*BORDER)
        pdf.set_line_width(0.4)
        pdf.line(LM, pdf.get_y(), LM + UW, pdf.get_y())
        pdf.ln(5)

        label_w = sum(cw for _, cw in COLS[:6])
        val_w   = COLS[6][1]
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(*MUTED)
        pdf.cell(label_w, 8, f"Total ingresos  ({completadas} citas completadas):", align='R')
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(*GOLD_DK)
        pdf.cell(val_w, 8, safe(f"CRC {ingresos:,.0f}"), align='C', new_x="LMARGIN", new_y="NEXT")

    # ── PAGE FOOTER ──────────────────────────────────────────────
    pdf.set_y(-15)
    pdf.set_draw_color(*BORDER)
    pdf.set_line_width(0.4)
    pdf.line(LM, pdf.get_y(), LM + UW, pdf.get_y())
    pdf.ln(2)
    pdf.set_font("Helvetica", "", 7.5)
    pdf.set_text_color(*MUTED)
    half = int(UW // 2)
    pdf.cell(half, 6, "BarberSaaS - barbersas.com", align='L')
    pdf.cell(UW - half, 6, f"Pagina {pdf.page_no()}", align='R')

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
