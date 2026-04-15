"""
Utilidad centralizada para manejo de numeros de telefono.
Pais por defecto: Costa Rica (+506)

Regla de negocio:
  - El usuario escribe: 8888 8888  (sin codigo de pais)
  - Se guarda en BD y se envia a Twilio como: +50688888888
  - Se muestra al usuario como: 8888-8888

Reutilizable para BeautySaaS y NailSaaS cambiando COUNTRY_CODE.
"""

import re

COUNTRY_CODE = "506"  # Costa Rica


def formatear_telefono(telefono: str, country_code: str = COUNTRY_CODE) -> str:
    """
    Normaliza cualquier formato de entrada a E.164 internacional.

    Ejemplos:
      "88888888"        -> "+50688888888"
      "8888 8888"       -> "+50688888888"
      "8888-8888"       -> "+50888888888"  (corregido)
      "+50688888888"    -> "+50688888888"  (ya correcto, sin cambios)
      "50688888888"     -> "+50688888888"
    """
    if not telefono:
        return ""

    # Eliminar todo excepto digitos y el + inicial
    solo_digitos = re.sub(r"[^\d]", "", telefono)

    # Ya tiene codigo de pais completo
    if solo_digitos.startswith(country_code):
        return f"+{solo_digitos}"

    # Solo digitos locales (8 digitos para CR)
    return f"+{country_code}{solo_digitos}"


def mostrar_telefono(telefono: str) -> str:
    """
    Formatea el numero para mostrar al usuario sin codigo de pais.

    "+50688888888" -> "8888-8888"
    "88888888"     -> "8888-8888"
    """
    solo_digitos = re.sub(r"[^\d]", "", telefono)

    # Remover codigo de pais si esta presente
    if solo_digitos.startswith(COUNTRY_CODE):
        local = solo_digitos[len(COUNTRY_CODE):]
    else:
        local = solo_digitos

    # Formato: XXXX-XXXX (8 digitos CR)
    if len(local) == 8:
        return f"{local[:4]}-{local[4:]}"

    return local
