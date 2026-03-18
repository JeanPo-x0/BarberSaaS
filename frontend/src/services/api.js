import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000'
});

export const getBarberias = () => API.get('/barberias/');
export const crearBarberia = (data) => API.post('/barberias/', data);
export const getCitas = () => API.get('/citas/');
export const crearCita = (data) => API.post('/citas/', data);