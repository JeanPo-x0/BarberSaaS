import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 70000, // 70s — cubre el cold start de Render free tier (~60s)
});

// Despierta el servidor haciendo polling hasta que responda (cold start Render).
// Retorna una promesa que resuelve cuando el servidor esta listo o tras 2 min.
export const wakeUpServer = () => {
  const deadline = Date.now() + 120000; // 2 min max
  const poll = () => {
    if (Date.now() > deadline) return Promise.resolve();
    return axios
      .get(`${BASE_URL}/health`, { timeout: 8000 })
      .catch(() => new Promise(r => setTimeout(r, 4000)).then(poll));
  };
  return poll();
};

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    // Skip redirect for login/auth endpoints — 401 there means wrong credentials, not expired session
    const esEndpointPublico = url.includes('/auth/login') || url.includes('/auth/registro') || url.includes('/auth/onboarding');
    if (error.response?.status === 401 && !esEndpointPublico) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Barberias
export const getBarberias = () => API.get('/barberias/');
export const getMiBarberia = () => API.get('/barberias/mia');
export const crearBarberia = (data) => API.post('/barberias/', data);
export const crearBarberiaAdicional = (data) => API.post('/barberias/nueva', data);
export const toggleBarberia = (id) => API.patch(`/barberias/${id}/toggle`);
export const getBarberia = (id) => API.get(`/barberias/${id}`);
export const actualizarSubdominio = (id, subdominio) => API.patch(`/barberias/${id}/subdominio`, { subdominio });
export const eliminarSubdominio = (id) => API.delete(`/barberias/${id}/subdominio`);
export const getBarberiaBySlug = (slug) => API.get(`/barberias/slug/${slug}`);

// Auth
export const getMe = () => API.get('/auth/me');
export const login = (data) => API.post('/auth/login', data);
export const registro = (data) => API.post('/auth/registro', data);
export const onboarding = (data) => API.post('/auth/onboarding', data);
export const recuperarPassword = (data) => API.post('/auth/recuperar-password', data);
export const resetPassword = (data) => API.post('/auth/reset-password', data);

// Barberos
export const getBarberos = () => API.get('/barberos/');
export const getMisBarberos = () => API.get('/barberos/mios');
export const getBarberosPorBarberia = (id) => API.get(`/barberos/barberia/${id}`);
export const crearBarbero = (data) => API.post('/barberos/', data);
export const toggleBarbero = (id) => API.patch(`/barberos/${id}/toggle`);
export const eliminarBarbero = (id) => API.delete(`/barberos/${id}`);

// Servicios
export const getServicios = () => API.get('/servicios/');
export const getMisServicios = () => API.get('/servicios/mios');
export const getServiciosPorBarberia = (id) => API.get(`/servicios/barberia/${id}`);
export const crearServicio = (data) => API.post('/servicios/', data);
export const toggleServicio = (id) => API.patch(`/servicios/${id}/toggle`);
export const eliminarServicio = (id) => API.delete(`/servicios/${id}`);

// Clientes
export const getClientes = () => API.get('/clientes/');
export const buscarOCrearCliente = (data) => API.post('/clientes/buscar-o-crear', data);

// Citas
export const getCitas = () => API.get('/citas/');
export const getMisCitas = () => API.get('/citas/mias');
export const crearCita = (data) => API.post('/citas/', data);
export const cancelarCita = (id) => API.patch(`/citas/${id}/cancelar`);
export const completarCita = (id) => API.patch(`/citas/${id}/completar`);
export const getDisponibilidad = (barbero_id, fecha) =>
  API.get(`/citas/disponibilidad/${barbero_id}?fecha=${fecha}`);

// Suscripcion
export const getEstadoSuscripcion = () => API.get('/suscripcion/estado');
export const crearCheckout = (data) => API.post('/suscripcion/checkout', data);
export const getPortalBilling = () => API.get('/suscripcion/portal');
export const getCouponActivo = () => API.get('/suscripcion/coupon-earlyaccess');

// Stats
export const getIngresos = () => API.get('/stats/ingresos');
export const getRetencion = () => API.get('/stats/retencion');
export const getAvanzadas = () => API.get('/stats/avanzadas');
export const postReenganche = (cliente_id) => API.post('/stats/reenganche', { cliente_id });

// Admin
export const getAdminStats = () => API.get('/admin/stats');
export const getAdminBarberias = () => API.get('/admin/barberias');
export const suspenderBarberia = (id) => API.patch(`/admin/barberias/${id}/suspender`);
export const reactivarBarberia = (id) => API.patch(`/admin/barberias/${id}/reactivar`);
