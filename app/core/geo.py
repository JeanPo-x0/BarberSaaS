"""
Geoblocking — solo permite IPs de Costa Rica.
Detecta VPNs conocidas por nombre de organización.
Usa ip-api.com (gratuito, 45 req/min) con cache en memoria de 1 hora.
"""
import time
import ipaddress
import httpx

# ── Cache en memoria ──────────────────────────────────────────
# { "1.2.3.4": {"country": "CR", "org": "...", "ts": 1234567890} }
_geo_cache: dict = {}
CACHE_TTL = 3600  # 1 hora

# ── Palabras clave que indican VPN conocida ───────────────────
VPN_KEYWORDS = [
    "nordvpn", "expressvpn", "surfshark", "mullvad", "protonvpn",
    "ipvanish", "cyberghost", "hidemyass", "tunnelbear", "windscribe",
    "private internet access", " pia ", "astrill", "hotspot shield",
    "tor project", "tor exit", "tor relay", "torguard",
    "hide.me", "ivpn", "perfect privacy", "anonine",
]


def _es_ip_publica(ip: str) -> bool:
    """True si la IP es una dirección pública enrutable (no privada/loopback/reservada)."""
    try:
        addr = ipaddress.ip_address(ip)
        return not (addr.is_private or addr.is_loopback or addr.is_reserved
                    or addr.is_link_local or addr.is_multicast or addr.is_unspecified)
    except ValueError:
        return False


async def obtener_geo(ip: str) -> dict:
    """Consulta ip-api.com y devuelve {'country': 'CR', 'org': '...'}. Cachea 1h."""
    ahora = time.time()
    cached = _geo_cache.get(ip)
    if cached and (ahora - cached["ts"]) < CACHE_TTL:
        return cached

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(
                f"http://ip-api.com/json/{ip}",
                params={"fields": "status,countryCode,org,isp"},
            )
            data = r.json() if r.status_code == 200 else None
    except Exception:
        data = None

    if data is None or data.get("status") == "fail":
        # API falló, rate-limited, o IP no reconocida: usar caché vieja si existe
        if cached:
            return cached
        # fail-open solo si no hay caché — en producción esto es raro
        return {"country": "CR", "org": "", "ts": ahora}

    resultado = {
        "country": data.get("countryCode", "CR"),
        "org": (data.get("org", "") + " " + data.get("isp", "")).lower(),
        "ts": ahora,
    }
    _geo_cache[ip] = resultado
    return resultado


def es_vpn(org: str) -> bool:
    """True si el nombre del proveedor contiene una VPN conocida."""
    return any(kw in org for kw in VPN_KEYWORDS)


def get_real_ip(request) -> str:
    """IP pública real del cliente desde X-Forwarded-For.

    Recorre la cadena de derecha a izquierda (Render agrega la IP del cliente
    al final) y devuelve la primera IP pública encontrada, saltando IPs privadas
    del load balancer interno de Render (ej: 10.x.x.x).
    """
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        ips = [ip.strip() for ip in forwarded.split(",") if ip.strip()]
        # De derecha a izquierda: saltar IPs privadas del proxy de Render
        for ip in reversed(ips):
            if _es_ip_publica(ip):
                return ip
    host = getattr(request.client, "host", "127.0.0.1") or "127.0.0.1"
    return host
