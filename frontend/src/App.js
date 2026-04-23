import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { wakeUpServer } from './services/api';
import GeoBlock from './components/GeoBlock';
import axios from 'axios';
import Home from './pages/Home';
import Login from './pages/Login';
import Barberias from './pages/Barberias';
import Agenda from './pages/Agenda';
import AgendarCita from './pages/AgendarCita';
import PanelDueno from './pages/PanelDueno';
import Historial from './pages/Historial';
import RecuperarPassword from './pages/RecuperarPassword';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';
import DashboardIngresos from './pages/DashboardIngresos';
import SuperAdmin from './pages/SuperAdmin';
import SuscripcionExito from './pages/SuscripcionExito';
import Planes from './pages/Planes';
import Terminos from './pages/Terminos';
import Privacidad from './pages/Privacidad';
import Soporte from './pages/Soporte';
import Cuenta from './pages/Cuenta';
import ActivarBarbero from './pages/ActivarBarbero';
import LoginBarbero from './pages/LoginBarbero';
import DashboardBarbero from './pages/DashboardBarbero';
import BannerTC from './components/BannerTC';
import './App.css';

function ProtectedRoute({ children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  return children;
}

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function AppRoutes() {
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    wakeUpServer();
    // Verificar geo — timeout de 6s, si falla el backend deja pasar (fail open)
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    axios.get(`${BASE_URL}/`, { signal: controller.signal })
      .catch(err => {
        if (err.response?.status === 403) {
          const msg = err.response?.data?.detail || '';
          if (msg.includes('Costa Rica') || msg.includes('VPN')) setBloqueado(true);
        }
      })
      .finally(() => clearTimeout(timer));
  }, []);

  if (bloqueado) return <GeoBlock />;

  return (
    <>
      <BannerTC />
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Onboarding />} />
        <Route path="/planes" element={<Planes />} />
        <Route path="/agendar" element={<AgendarCita />} />
        <Route path="/agendar/:barberia_id" element={<AgendarCita />} />
        <Route path="/b/:slug" element={<AgendarCita />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/activar-barbero" element={<ActivarBarbero />} />
        <Route path="/barbero/login" element={<LoginBarbero />} />
        <Route path="/barbero/agenda" element={<DashboardBarbero />} />

        {/* Privadas — requieren login */}
        <Route path="/barberias" element={<ProtectedRoute><Barberias /></ProtectedRoute>} />
        <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
        <Route path="/panel" element={<ProtectedRoute><PanelDueno /></ProtectedRoute>} />
        <Route path="/historial" element={<ProtectedRoute><Historial /></ProtectedRoute>} />
        <Route path="/ingresos" element={<ProtectedRoute><DashboardIngresos /></ProtectedRoute>} />
        <Route path="/soporte" element={<ProtectedRoute><Soporte /></ProtectedRoute>} />
        <Route path="/cuenta" element={<ProtectedRoute><Cuenta /></ProtectedRoute>} />
        <Route path="/suscripcion/exito" element={<ProtectedRoute><SuscripcionExito /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><SuperAdmin /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
