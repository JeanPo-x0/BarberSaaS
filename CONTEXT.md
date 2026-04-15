# BarberSaaS — Contexto Completo del Proyecto

> Leé este archivo al inicio de cada sesión para retomar sin explicar nada de nuevo.

---

## ¿Qué es este proyecto?

SaaS de agendamiento automatizado para barberías costarricenses.  
Los dueños de barbería se registran, pagan una suscripción, y sus clientes pueden agendar citas por WhatsApp o por un link web.  
Todo funciona en producción real.

---

## URLs en producción

| Servicio | URL |
|---|---|
| Frontend | https://barber-saa-s-phi.vercel.app |
| Backend API | https://barbersaas-backend-tgqs.onrender.com |
| Repositorio | https://github.com/JeanPo-x0/BarberSaaS |

---

## Stack técnico

### Backend
- **Framework:** FastAPI (Python)
- **Base de datos:** PostgreSQL (Render free tier — se duerme si no hay tráfico)
- **ORM / Migraciones:** SQLAlchemy + Alembic
- **Autenticación:** JWT (python-jose)
- **Pagos:** Stripe (Checkout + Webhooks)
- **WhatsApp:** Twilio (bot entrante + notificaciones salientes)
- **Deploy:** Render (free tier, puede tardar ~30s en arrancar en frío)

### Frontend
- **Framework:** React (Create React App)
- **Estilos:** Tailwind CSS + inline styles (la mayoría de páginas usan inline styles directamente)
- **Tipografías:** Bebas Neue (títulos) + DM Sans (cuerpo) — via Google Fonts
- **Gráficos:** Recharts (AreaChart en DashboardIngresos)
- **Deploy:** Vercel (auto-deploy al hacer push a main)

### Carpeta local
```
C:/Users/jpps8/Documents/BarberSaaS/
```

---

## Estructura del proyecto

```
BarberSaaS/
├── app/                        # Backend FastAPI
│   ├── main.py                 # Entry point, CORS, startup
│   ├── database.py             # Conexión PostgreSQL
│   ├── models/                 # Tablas SQLAlchemy
│   │   ├── usuario.py
│   │   ├── barberia.py
│   │   ├── barbero.py
│   │   ├── cita.py
│   │   ├── cliente.py
│   │   ├── servicio.py
│   │   ├── suscripcion.py
│   │   ├── conversacion_bot.py
│   │   └── lista_espera.py
│   ├── routers/                # Endpoints por dominio
│   │   ├── auth.py             # Login, registro, reset password
│   │   ├── barberias.py        # CRUD barberias, toggle, subdominios
│   │   ├── barberos.py         # CRUD barberos
│   │   ├── servicios.py        # CRUD servicios
│   │   ├── citas.py            # Agendar, completar, cancelar citas
│   │   ├── clientes.py         # Gestión de clientes
│   │   ├── stats.py            # Ingresos, retención, avanzadas
│   │   ├── suscripcion.py      # Stripe, planes, webhooks
│   │   ├── admin.py            # Super-admin
│   │   ├── webhook.py          # Twilio WhatsApp bot entrante
│   │   └── lista_espera.py
│   └── services/               # Lógica de negocio (WhatsApp, Stripe, etc.)
├── alembic/                    # Migraciones de base de datos
├── frontend/
│   ├── public/
│   │   └── index.html          # Meta viewport, fonts, title
│   └── src/
│       ├── pages/              # Una página por ruta
│       │   ├── Home.js         # Landing page
│       │   ├── Login.js
│       │   ├── Registro.js
│       │   ├── Onboarding.js   # Setup inicial al registrarse
│       │   ├── Agenda.js       # Vista principal del dueño (citas del día)
│       │   ├── Historial.js    # Citas completadas/canceladas (30 días)
│       │   ├── PanelDueno.js   # Gestión barberos, servicios, barberias
│       │   ├── DashboardIngresos.js  # Stats, gráfico, retención
│       │   ├── AgendarCita.js  # Página pública para clientes
│       │   ├── Planes.js       # Precios y Stripe checkout
│       │   ├── SuperAdmin.js   # Panel super-admin
│       │   └── ...
│       ├── components/
│       │   ├── Navbar.js
│       │   └── LogoLink.js
│       ├── services/
│       │   └── api.js          # Todas las llamadas al backend (axios)
│       ├── context/
│       │   └── AuthContext.js  # Token JWT global
│       ├── utils/
│       │   └── phone.js        # Formato +506 para teléfonos CR
│       ├── index.css           # Tokens CSS, clases globales, media queries
│       └── App.js              # Rutas (React Router)
├── requirements.txt
├── render.yaml                 # Config deploy Render
└── CONTEXT.md                  # Este archivo
```

---

## Planes y modelo de negocio

| Plan | Precio | Límites |
|---|---|---|
| Básico | $X/mes | 1 barbería |
| Pro | $X/mes | Hasta 3 barberías, métricas de retención |
| Premium | $X/mes | Barberías ilimitadas, estadísticas avanzadas, WhatsApp re-enganche |

Stripe maneja el cobro. El webhook de Stripe actualiza el campo `plan` en la tabla `suscripcion`.

---

## Funcionalidades implementadas (100% completas)

- [x] Registro y login de dueños (JWT)
- [x] Recuperación de contraseña por email
- [x] CRUD de barberías, barberos y servicios
- [x] Link público por ID (`/agendar/:id`) y por slug personalizado (`/b/:slug`)
- [x] Agenda del dueño con citas del día, acción "Completar"
- [x] Historial de citas (últimos 30 días)
- [x] Bot de WhatsApp entrante (Twilio) — el cliente agenda por mensaje
- [x] Notificaciones WhatsApp al barbero cuando llega cita nueva
- [x] Recordatorios automáticos de citas
- [x] Dashboard de ingresos (hoy / semana / quincena / mes)
- [x] Gráfico de ingresos del mes (Recharts AreaChart)
- [x] Métricas de retención — clientes inactivos +30 días
- [x] WhatsApp de re-enganche a clientes inactivos
- [x] Estadísticas avanzadas (total clientes, tasa retención, servicio popular)
- [x] Exportar reporte PDF (jsPDF)
- [x] Stripe Checkout + webhooks + 3 planes
- [x] Panel Super-Admin
- [x] Onboarding para nuevos usuarios
- [x] Responsive mobile (Improvement 3)

---

## Improvements aplicados post-lanzamiento

| # | Commit | Descripción |
|---|---|---|
| 1 | `8fd8c6d` | Fix login cold start + formato WhatsApp + auto-prefijo +506 |
| 2 | `d881cd1` | Agenda rediseñada — datos anidados, acción Completar |
| 3 | `f203484` | Responsive mobile completo — viewport, Historial, Panel, Ingresos |

---

## Bugs conocidos / resueltos

- **Cold start Render:** El backend tarda ~30s en arrancar si estuvo inactivo. `App.js` hace un health check polling al inicio para avisar al usuario en lugar de mostrar error. El login tiene retry automático.
- **CORS:** Configurado como wildcard (`*`) — intentar restringirlo a la URL de Vercel causó fallos en preflight. No cambiar sin probar primero.
- **Migraciones automáticas:** `main.py` corre `alembic upgrade head` al arrancar para que Render aplique migraciones sin paso manual.
- **Import useEffect:** Login.js tenía un import no usado que rompía el build de Vercel — ya corregido.

---

## Design tokens (colores y fuentes)

```css
--bg-primary:   #0A0A0A   /* fondo página */
--bg-secondary: #111111   /* fondo inputs */
--bg-card:      #1A1A1A   /* fondo cards */
--gold:         #C9A84C   /* color principal / accent */
--gold-light:   #D4B76A
--accent-red:   #E63946
--text-primary: #F5F5F5
--text-muted:   #8A8A8A
--border:       rgba(255,255,255,0.06)
```

Títulos grandes → `Bebas Neue` (font-family: `'Bebas Neue'`)  
Texto general → `DM Sans` (font-family: `'DM Sans', sans-serif`)

---

## Clases CSS globales importantes (`index.css`)

| Clase | Uso |
|---|---|
| `.input-dark` | Todos los inputs del panel |
| `.btn-gold` | Botón principal dorado |
| `.btn-outline` | Botón secundario con borde |
| `.card` / `.card-hover` | Cards con hover animado |
| `.mobile-px` | Reduce padding horizontal en mobile (≤600px) |
| `.mobile-header-row` | Fila header → columna en mobile |
| `.mobile-item-row` | Fila lista → columna en mobile |
| `.mobile-grid-1` | Grid 2-col → 1-col en mobile |
| `.stats-grid-mobile` | Grid stats → 1-col en mobile |
| `.anim-fadeup`, `.anim-item` | Animaciones de entrada |
| `.skeleton` | Loading shimmer |

---

## Comandos para retomar desarrollo local

```bash
# Ir al proyecto
cd ~/Documents/BarberSaaS

# Activar entorno virtual Python
source venv/Scripts/activate

# Correr backend
uvicorn app.main:app --reload

# Correr frontend (en otra terminal)
cd frontend
npm start

# Deploy (Vercel auto-deploya al hacer push)
git add .
git commit -m "descripcion"
git push origin main
```

---

## Contexto del usuario

- Nombre: Jean (usuario jpps8 en Windows)
- Nivel: principiante aprendiendo — pedir explicaciones de cada cosa
- Sistema: Windows, Git Bash, VS Code
- Idioma: siempre español
- Sin presupuesto extra — todo gratis o con lo ya contratado (Render free, Vercel free, Twilio trial, Stripe test)
- Quiere aprender mientras construye, no solo copiar código

---

## Reglas de trabajo

1. Siempre explicar qué hace cada cambio y por qué, en español simple
2. No romper lo que ya funciona — desktop debe quedar igual cuando se toca mobile
3. Antes de editar un archivo, leerlo primero
4. Commitear con mensajes descriptivos en inglés (convención del proyecto)
5. No agregar dependencias nuevas sin necesidad real
6. El usuario ejecuta los comandos él mismo — sugerirlos, no asumir que se corrieron
