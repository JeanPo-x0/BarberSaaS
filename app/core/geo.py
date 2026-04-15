"""
Geoblocking — solo permite IPs de Costa Rica.
Detecta VPNs conocidas por nombre de organización.
Usa ip-api.com (gratuito, 45 req/min) con cache en memoria de 1 hora.
"""
import time
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
                params={"fields": "countryCode,org,isp"},
            )
            data = r.json() if r.status_code == 200 else {}
    except Exception:
        # Si la API falla, dejar pasar para no bloquear usuarios legítimos
        data = {}

    resultado = {
        "country": data.get("countryCode", "CR"),  # default CR si falla
        "org": (data.get("org", "") + " " + data.get("isp", "")).lower(),
        "ts": ahora,
    }
    _geo_cache[ip] = resultado
    return resultado


def es_vpn(org: str) -> bool:
    """True si el nombre del proveedor contiene una VPN conocida."""
    return any(kw in org for kw in VPN_KEYWORDS)


def get_real_ip(request) -> str:
    """IP real del cliente — considera el proxy de Render (X-Forwarded-For)."""
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return getattr(request.client, "host", "127.0.0.1") or "127.0.0.1"
