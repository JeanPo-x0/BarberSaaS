import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Barberias
export const getBarberias = () => API.get('/barberias/');
export const getMiBarberia = () => API.get('/barberias/mia');
export const crearBarberia = (data) => API.post('/barberias/', data);
export const getBarberia = (id) => API.get(`/barberias/${id}`);

// Auth
export const getMe = () => API.get('/auth/me');

// Barberos
export const getBarberos = () => API.get('/barberos/');
export const crearBarbero = (data) => API.post('/barberos/', data);

// Servicios
export const getServicios = () => API.get('/servicios/');
export const crearServicio = (data) => API.post('/servicios/', data);

// Clientes
export const getClientes = () => API.get('/clientes/');
export const crearCliente = (data) => API.post('/clientes/', data);

// Citas
export const getCitas = () => API.get('/citas/');
export const crearCita = (data) => API.post('/citas/', data);
export const cancelarCita = (id) => API.patch(`/citas/${id}/cancelar`);
export const getDisponibilidad = (barbero_id, fecha) =>
  API.get(`/citas/disponibilidad/${barbero_id}?fecha=${fecha}`);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const registro = (data) => API.post('/auth/registro', data);
