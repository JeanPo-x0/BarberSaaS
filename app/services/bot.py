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

HORARIO_INICIO = 9   # 9:00 am
HORARIO_FIN = 19     # 7:00 pm

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

    slots = []
    t = inicio_dia
    while t + timedelta(minutes=duracion_min) <= fin_dia:
        hora_str = t.strftime("%H:%M")
        # Verificar que todos los bloques necesarios esten libres
        bloques_ok = all(
            (t + timedelta(minutes=i)).strftime("%H:%M") not in ocupados
            for i in range(0, duracion_min, 30)
        )
        if bloques_ok:
            slots.append(hora_str)
        t += timedelta(minutes=30)

    return slots


# ---------- pasos del flujo ----------

def _paso_inicio(db: Session, conv: ConversacionBot, barberia: Barberia) -> str:
    servicios = db.query(Servicio).filter(
        and_(Servicio.barberia_id == barberia.id, Servicio.disponible == True)
    ).all()

    if not servicios:
        return f"Hola! Soy el asistente de {barberia.nombre}. Por el momento no hay servicios disponibles. Intenta mas tarde."

    conv.barberia_id = barberia.id
    conv.paso = "esperando_servicio"
    db.commit()

    lista = "\n".join(
        [f"{i+1}. {s.nombre} — ${s.precio:.0f} ({s.duracion_minutos} min)" for i, s in enumerate(servicios)]
    )
    return f"Hola! Soy el asistente de {barberia.nombre}.\n\nQue servicio deseas?\n\n{lista}\n\nResponde con el numero."


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
        f"Elegiste: {servicio.nombre}\n\n"
        f"Con que barbero?\n\n{lista}\n0. Cualquiera disponible\n\n"
        f"Responde con el numero."
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
    return f"Que dia prefieres?\n\n{lista}\n\nResponde con el numero."


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
        if s:
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

    lista = "\n".join([f"{i+1}. {h}" for i, h in enumerate(slots[:10])])
    return f"Horarios disponibles el {_fmt_dia(fecha)}:\n\n{lista}\n\nResponde con el numero."


def _paso_hora(db: Session, conv: ConversacionBot, mensaje: str) -> str:
    servicio = db.query(Servicio).filter(Servicio.id == conv.servicio_id).first()
    slots = _slots_disponibles(db, conv.barbero_id, conv.fecha, servicio.duracion_minutos)

    try:
        idx = int(mensaje) - 1
        if idx < 0 or idx >= len(slots[:10]):
            raise ValueError
    except ValueError:
        lista = "\n".join([f"{i+1}. {h}" for i, h in enumerate(slots[:10])])
        return f"Opcion no valida. Elige:\n\n{lista}"

    conv.fecha = f"{conv.fecha} {slots[idx]}"
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
        f"Confirmas tu cita?\n\n"
        f"Nombre: {conv.nombre_temp}\n"
        f"Servicio: {servicio.nombre}\n"
        f"Barbero: {barbero.nombre}\n"
        f"Fecha y hora: {conv.fecha}\n"
        f"Precio: ${servicio.precio:.0f}\n\n"
        f"Responde SI para confirmar o NO para cancelar."
    )


def _paso_confirmacion(db: Session, conv: ConversacionBot, telefono: str, mensaje: str) -> str:
    if mensaje.upper() not in ("SI", "SÍ", "NO"):
        return "Responde SI para confirmar o NO para cancelar."

    if mensaje.upper() == "NO":
        _resetear(db, conv)
        return "Cita cancelada. Escribe 'Hola' cuando quieras intentarlo de nuevo."

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
        return "Hubo un error con la fecha. Escribe 'Hola' para intentarlo de nuevo."

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
    return f"Tu cita esta confirmada! Te hemos enviado los detalles. Hasta pronto, {cliente.nombre}!"


# ---------- entrada principal ----------

def procesar_mensaje(db: Session, telefono: str, twilio_to: str, mensaje: str) -> str:
    mensaje = mensaje.strip()

    # Keyword global: CANCELAR en cualquier momento
    if mensaje.upper() == "CANCELAR":
        conv = db.query(ConversacionBot).filter(ConversacionBot.telefono == telefono).first()
        if conv:
            _resetear(db, conv)

        # Buscar cita pendiente proxima del cliente y cancelarla en la BD
        cliente = db.query(Cliente).filter(Cliente.telefono == telefono).first()
        if cliente:
            cita = db.query(Cita).filter(
                and_(
                    Cita.cliente_id == cliente.id,
                    Cita.estado == "pendiente",
                    Cita.fecha_hora >= datetime.utcnow()
                )
            ).order_by(Cita.fecha_hora).first()

            if cita:
                cita.estado = "cancelada"
                db.commit()
                db.refresh(cita)

                barbero = db.query(Barbero).filter(Barbero.id == cita.barbero_id).first()
                fecha_str = cita.fecha_hora.strftime("%d/%m/%y a las %H:%M")

                # Notificar al barbero en background para no retrasar la respuesta al cliente
                def notificar_barbero():
                    try:
                        from app.services.whatsapp import notificar_barbero_cancelacion
                        if barbero and barbero.telefono:
                            notificar_barbero_cancelacion(barbero.telefono, barbero.nombre, cliente.nombre, fecha_str)
                    except Exception:
                        pass

                return f"Tu cita del {fecha_str} ha sido cancelada. Escribe 'Hola' cuando quieras agendar una nueva.", notificar_barbero

        return "Tu proceso ha sido cancelado. Escribe 'Hola' cuando quieras agendar una nueva cita.", None

    # Identificar la barberia por el numero Twilio al que escribio el cliente
    barberia = db.query(Barberia).filter(
        and_(Barberia.twilio_numero == twilio_to, Barberia.activa == True)
    ).first()

    if not barberia:
        return "Este numero no esta configurado. Contacta a la barberia directamente.", None

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
