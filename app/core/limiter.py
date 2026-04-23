from slowapi import Limiter
from app.core.geo import get_real_ip

limiter = Limiter(key_func=get_real_ip)
