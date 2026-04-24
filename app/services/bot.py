from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.conversacion_bot import ConversacionBot
from app.models.barberia import Barberia
from app.models.barbero import Barbero
from app.models.servicio import Servicio
from app.models.cliente import Cliente
from app.models.cita import Cita
from app.services.whatsapp import confirmar_cita, notificar_barbero_nueva_cita
import re

HORARIO_INICIO = 5   # 5:00 am
HORARIO_FIN = 12     # 12:00 pm

DIAS_ES = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]

def _proximos_dias(n=7):
    hoy = datetime.utcnow().date()
    return [hoy + timedelta(days=i) for i in range(1, n + 1)]

def _fmt_dia(fecha):
    """Vie 20/03/26"""
    return f"{DIAS_ES[fecha.weekday()]} {fecha.day:02d}/{fecha.month:02d}/{str(fecha.year)[2:]}"

def _fmt_fecha_hora(dt):
    """20/03/26 a las 09:00"""
    return dt.strftime("%d/%m/%y a las %H:%M")


# ---------- helpers ----------

def _obtener_o_crear_conv(db: Session, telefono: str) -> ConversacionBot:
    conv = db.query(ConversacionBot).filter(ConversacionBot.telefono == telefono).first()
    if not conv:
        conv = ConversacionBot(telefono=telefono)
        db.add(conv)
        db.commit()
        db.refresh(conv)
    return conv


def _normalizar_tel(telefono: str) -> str:
    """Deja solo dígitos y agrega +506 si es número local CR."""
    solo = re.sub(r"[^\d]", "", telefono)
    if solo.startswith("506"):
        return f"+{solo}"
    return f"+506{solo}"


def _buscar_cliente(db: Session, telefono: str):
    """Busca el cliente probando varios formatos del teléfono."""
    formatos = {telefono, _normalizar_tel(telefono)}
    for fmt in formatos:
        c = db.query(Cliente).filter(Cliente.telefono == fmt).first()
        if c:
            return c
    return None


def _resetear(db: Session, conv: ConversacionBot):
    conv.paso = "inicio"
    conv.barberia_id = None
    conv.servicio_id = None
    conv.barbero_id = None
    conv.fecha = None
    conv.nombre_temp = None
    db.commit()


def _slots_disponibles(db: Session, barbero_id: int, fecha_str: str, duracion_min: int) -> list:
    try:
        fecha = datetime.strptime(fecha_str, "%d/%m/%Y")
    except ValueError:
        return []

    inicio_dia = fecha.replace(hour=HORARIO_INICIO, minute=0, second=0, microsecond=0)
    fin_dia = fecha.replace(hour=HORARIO_FIN, minute=0, second=0, microsecond=0)

    citas_del_dia = db.query(Cita).filter(
        and_(
            Cita.barbero_id == barbero_id,
            Cita.fecha_hora >= inicio_dia,
            Cita.fecha_hora < fin_dia,
            Cita.estado == "pendiente"
        )
    ).all()

    # Marcar bloques ocupados segun duracion de cada cita existente
    ocupados = set()
    for cita in citas_del_dia:
        servicio = db.query(Servicio).filter(Servicio.id == cita.servicio_id).first()
        dur = servicio.duracion_minutos if servicio else 30
        for i in range(0, dur, 30):
            ocupados.add((cita.fecha_hora + timedelta(minutes=i)).strftime("%H:%M"))

    # Devuelve lista de tuplas (hora_str, disponible)
    slots = []
    t = inicio_dia
    while t + timedelta(minutes=duracion_min) <= fin_dia:
        hora_str = t.strftime("%H:%M")
        disponible = all(
            (t + timedelta(minutes=i)).strftime("%H:%M") not in ocupados
            for i in range(0, duracion_min, 30)
        )
        slots.append((hora_str, disponible))
        t += timedelta(minutes=30)

    return slots


# ---------- pasos del flujo ----------

def _paso_inicio(db: Session, conv: ConversacionBot, barberia: Barberia) -> str:
    servicios = db.query(Servicio).filter(
        and_(Servicio.barberia_id == barberia.id, Servicio.disponible == True)
    ).all()

    if not servicios:
        return (
            f"Hola, soy el asistente de *{barberia.nombre}*. "
            f"En este momento no tenemos servicios disponibles para agendar. "
            f"Intentá más tarde o contactá directamente a la barbería."
        )

    conv.barberia_id = barberia.id
    conv.paso = "esperando_servicio"
    db.commit()

    lista = "\n".join(
        [f"{i+1}. {s.nombre} — ₡{s.precio:.0f} ({s.duracion_minutos} min)" for i, s in enumerate(servicios)]
    )
    return (
        f"¡Hola! Soy el asistente de *{barberia.nombre}*. "
        f"Podés agendar tu cita directamente desde aquí en unos pasos.\n\n"
        f"¿Qué servicio querés reservar?\n\n{lista}\n\n"
        f"Respondé con el número de tu elección."
    )


def _paso_servicio(db: Session, conv: ConversacionBot, mensaje: str) -> str:
    servicios = db.query(Servicio).filter(
        and_(Servicio.barberia_id == conv.barberia_id, Servicio.disponible == True)
    ).all()

    try:
        idx = int(mensaje) - 1
        if idx < 0 or idx >= len(servicios):
            raise ValueError
    except ValueError:
        lista = "\n".join([f"{i+1}. {s.nombre}" for i, s in enumerate(servicios)])
        return f"Opcion no valida. Elige un numero:\n\n{lista}"

    servicio = servicios[idx]
    conv.servicio_id = servicio.id

    barberos = db.query(Barbero).filter(
        and_(Barbero.barberia_id == conv.barberia_id, Barbero.activo == True)
    ).all()

    conv.paso = "esperando_barbero"
    db.commit()

    lista = "\n".join([f"{i+1}. {b.nombre}" for i, b in enumerate(barberos)])
    return (
        f"Seleccionaste: *{servicio.nombre}* (₡{servicio.precio:.0f})\n\n"
        f"¿Con qué barbero preferís atenderte?\n\n{lista}\n0. Cualquiera disponible\n\n"
        f"Respondé con el número."
    )


def _paso_barbero(db: Session, conv: ConversacionBot, mensaje: str) -> str:
    barberos = db.query(Barbero).filter(
        and_(Barbero.barberia_id == conv.barberia_id, Barbero.activo == True)
    ).all()

    try:
        idx = int(mensaje)
        if idx == 0:
            conv.barbero_id = None
        elif 1 <= idx <= len(barberos):
            conv.barbero_id = barberos[idx - 1].id
        else:
            raise ValueError
    except ValueError:
        lista = "\n".join([f"{i+1}. {b.nombre}" for i, b in enumerate(barberos)])
        return f"Opcion no valida. Elige:\n\n{lista}\n0. Cualquiera disponible"

    conv.paso = "esperando_fecha"
    db.commit()

    dias = _proximos_dias()
    lista = "\n".join([f"{i+1}. {_fmt_dia(d)}" for i, d in enumerate(dias)])
    return f"¿Qué día preferís?\n\n{lista}\n\nRespondé con el número."


def _paso_fecha(db: Session, conv: ConversacionBot, mensaje: str) -> str:
    dias = _proximos_dias()

    try:
        idx = int(mensaje.strip()) - 1
        if idx < 0 or idx >= len(dias):
            raise ValueError
    except ValueError:
        lista = "\n".join([f"{i+1}. {_fmt_dia(d)}" for i, d in enumerate(dias)])
        return f"Opcion no valida. Elige:\n\n{lista}\n\nResponde con el numero."

    fecha = dias[idx]
    fecha_str = fecha.strftime("%d/%m/%Y")  # formato interno

    servicio = db.query(Servicio).filter(Servicio.id == conv.servicio_id).first()

    if conv.barbero_id:
        candidatos = [conv.barbero_id]
    else:
        candidatos = [
            b.id for b in db.query(Barbero).filter(
                and_(Barbero.barberia_id == conv.barberia_id, Barbero.activo == True)
            ).all()
        ]

    slots = []
    barbero_asignado = None
    for bid in candidatos:
        s = _slots_disponibles(db, bid, fecha_str, servicio.duracion_minutos)
        if any(disp for _, disp in s):  # al menos un slot disponible
            slots = s
            barbero_asignado = bid
            break

    if not slots:
        lista = "\n".join([f"{i+1}. {_fmt_dia(d)}" for i, d in enumerate(dias)])
        return f"No hay horarios disponibles ese dia. Elige otro:\n\n{lista}"

    conv.fecha = fecha_str
    if not conv.barbero_id:
        conv.barbero_id = barbero_asignado
    conv.paso = "esperando_hora"
    db.commit()

    lista = "\n".join([
        f"{i+1}. ~{h}~" if not disp else f"{i+1}. {h}"
        for i, (h, disp) in enumerate(slots)
    ])
    return f"Horarios el {_fmt_dia(fecha)}:\n\n{lista}\n\nElige un numero disponible."


def _paso_hora(db: Session, conv: ConversacionBot, mensaje: str) -> str:
    servicio = db.query(Servicio).filter(Servicio.id == conv.servicio_id).first()
    slots = _slots_disponibles(db, conv.barbero_id, conv.fecha, servicio.duracion_minutos)

    try:
        idx = int(mensaje) - 1
        if idx < 0 or idx >= len(slots):
            raise ValueError
        hora_str, disponible = slots[idx]
        if not disponible:
            lista = "\n".join([
                f"{i+1}. ~{h}~" if not d else f"{i+1}. {h}"
                for i, (h, d) in enumerate(slots)
            ])
            return f"Ese horario no esta disponible. Elige otro:\n\n{lista}"
    except ValueError:
        lista = "\n".join([
            f"{i+1}. ~{h}~" if not d else f"{i+1}. {h}"
            for i, (h, d) in enumerate(slots)
        ])
        return f"Opcion no valida. Elige:\n\n{lista}"

    conv.fecha = f"{conv.fecha} {hora_str}"
    conv.paso = "esperando_nombre"
    db.commit()
    return "Cual es tu nombre completo?"


def _paso_nombre(db: Session, conv: ConversacionBot, mensaje: str) -> str:
    if len(mensaje.strip()) < 2:
        return "Por favor escribe tu nombre completo."

    conv.nombre_temp = mensaje.strip()

    servicio = db.query(Servicio).filter(Servicio.id == conv.servicio_id).first()
    barbero = db.query(Barbero).filter(Barbero.id == conv.barbero_id).first()

    conv.paso = "confirmando"
    db.commit()

    return (
        f"Perfecto, {conv.nombre_temp}. Revisá los detalles de tu cita:\n\n"
        f"✂️ *Servicio:* {servicio.nombre}\n"
        f"💈 *Barbero:* {barbero.nombre}\n"
        f"📅 *Fecha y hora:* {conv.fecha}\n"
        f"💰 *Precio:* ₡{servicio.precio:.0f}\n\n"
        f"¿Confirmás la reserva? Respondé *SI* para confirmar o *NO* para cancelar."
    )


def _paso_confirmacion(db: Session, conv: ConversacionBot, telefono: str, mensaje: str) -> str:
    if mensaje.upper() not in ("SI", "SÍ", "NO"):
        return "Responde SI para confirmar o NO para cancelar."

    if mensaje.upper() == "NO":
        _resetear(db, conv)
        return "Entendido. Tu reserva no fue confirmada. Cuando quieras intentarlo de nuevo, escribí *Hola*."

    # Crear o encontrar el cliente por telefono
    cliente = db.query(Cliente).filter(Cliente.telefono == telefono).first()
    if not cliente:
        cliente = Cliente(nombre=conv.nombre_temp, telefono=telefono)
        db.add(cliente)
        db.commit()
        db.refresh(cliente)

    try:
        fecha_hora = datetime.strptime(conv.fecha, "%d/%m/%Y %H:%M")
    except ValueError:
        _resetear(db, conv)
        return "Hubo un problema al procesar la fecha. Escribí *Hola* para intentarlo de nuevo."

    nueva_cita = Cita(
        fecha_hora=fecha_hora,
        estado="pendiente",
        barbero_id=conv.barbero_id,
        servicio_id=conv.servicio_id,
        cliente_id=cliente.id
    )
    db.add(nueva_cita)
    db.commit()
    db.refresh(nueva_cita)

    servicio = db.query(Servicio).filter(Servicio.id == conv.servicio_id).first()
    barbero = db.query(Barbero).filter(Barbero.id == conv.barbero_id).first()

    try:
        confirmar_cita(
            telefono=telefono,
            nombre=cliente.nombre,
            fecha_hora=conv.fecha,
            servicio=servicio.nombre,
            barbero=barbero.nombre
        )
        if barbero and barbero.telefono:
            notificar_barbero_nueva_cita(
                telefono=barbero.telefono,
                nombre_barbero=barbero.nombre,
                cliente=cliente.nombre,
                servicio=servicio.nombre,
                fecha_hora=conv.fecha
            )
    except Exception:
        pass  # la cita se crea aunque fallen los mensajes

    _resetear(db, conv)
    return f"✅ ¡Tu cita quedó confirmada, {cliente.nombre}! Te enviamos los detalles por aquí. ¡Hasta pronto!"


# ---------- entrada principal ----------

def procesar_mensaje(db: Session, telefono: str, twilio_to: str, mensaje: str) -> str:
    mensaje = mensaje.strip()

    # Keyword global: CANCELAR en cualquier momento
    if mensaje.upper().startswith("CANCELAR"):
        conv = db.query(ConversacionBot).filter(ConversacionBot.telefono == telefono).first()
        if conv:
            _resetear(db, conv)

        print(f"[CANCELAR] Buscando cliente con telefono: {telefono!r}")
        cliente = _buscar_cliente(db, telefono)
        if cliente:
            # Busca la próxima cita pendiente. Las citas se guardan en hora CR (UTC-6),
            # así que comparamos con hora CR, no UTC.
            ahora_cr = datetime.utcnow() - timedelta(hours=6)
            margen = ahora_cr - timedelta(minutes=30)
            cita = db.query(Cita).filter(
                and_(
                    Cita.cliente_id == cliente.id,
                    Cita.estado == "pendiente",
                    Cita.fecha_hora >= margen,
                )
            ).order_by(Cita.fecha_hora).first()

            if cita:
                cita.estado = "cancelada"
                db.commit()
                db.refresh(cita)

                barbero = db.query(Barbero).filter(Barbero.id == cita.barbero_id).first()
                fecha_str = cita.fecha_hora.strftime("%d/%m/%y a las %H:%M")

                # Construir link de agendamiento
                from app.core.config import settings
                link_ag = ""
                if barbero:
                    barberia_obj = db.query(Barberia).filter(Barberia.id == barbero.barberia_id).first()
                    if barberia_obj:
                        link_ag = (
                            f"{settings.FRONTEND_URL}/b/{barberia_obj.slug}"
                            if barberia_obj.slug
                            else f"{settings.FRONTEND_URL}/agendar/{barberia_obj.id}"
                        )

                msg_cancelacion = (
                    f"✅ Tu cita del *{fecha_str}* ha sido cancelada exitosamente.\n\n"
                    f"Cuando quieras volver a agendar, podés hacerlo directamente desde el link de tu barbería"
                    + (f":\n{link_ag}" if link_ag else ".")
                )

                def notificar_barbero():
                    try:
                        from app.services.whatsapp import notificar_barbero_cancelacion
                        if barbero and barbero.telefono:
                            notificar_barbero_cancelacion(barbero.telefono, barbero.nombre, cliente.nombre, fecha_str)
                    except Exception:
                        pass

                return msg_cancelacion, notificar_barbero

            return "No encontramos ninguna cita pendiente asociada a tu número. Si creés que es un error, contactá directamente a tu barbería.", None

    print(f"[CANCELAR] No se encontro cliente con telefono: {telefono!r}")
    return "No encontramos tu número en el sistema. Asegurate de usar el mismo WhatsApp con el que agendaste tu cita.", None

    # Identificar la barberia por el numero Twilio al que escribio el cliente
    barberia = db.query(Barberia).filter(
        and_(Barberia.twilio_numero == twilio_to, Barberia.activa == True)
    ).first()

    if not barberia:
        return "Este número no está configurado con ninguna barbería activa. Contactá directamente al establecimiento.", None

    conv = _obtener_o_crear_conv(db, telefono)

    # Enrutar segun el paso actual
    if conv.paso == "inicio":
        return _paso_inicio(db, conv, barberia), None
    elif conv.paso == "esperando_servicio":
        return _paso_servicio(db, conv, mensaje), None
    elif conv.paso == "esperando_barbero":
        return _paso_barbero(db, conv, mensaje), None
    elif conv.paso == "esperando_fecha":
        return _paso_fecha(db, conv, mensaje), None
    elif conv.paso == "esperando_hora":
        return _paso_hora(db, conv, mensaje), None
    elif conv.paso == "esperando_nombre":
        return _paso_nombre(db, conv, mensaje), None
    elif conv.paso == "confirmando":
        return _paso_confirmacion(db, conv, telefono, mensaje), None
    else:
        _resetear(db, conv)
        return _paso_inicio(db, conv, barberia), None
