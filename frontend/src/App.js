import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { wakeUpServer } from './services/api';
import GeoBlock from './components/GeoBlock';
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
import NotFound from './pages/NotFound';
import VerificarEmail from './pages/VerificarEmail';
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

function AppRoutes() {
  const [bloqueado, setBloqueado] = useState(false);

  const checkGeo = () => {
    const base = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    fetch(`${base}/`, { signal: AbortSignal.timeout(5000) })
      .then(r => { if (r.status === 403) setBloqueado(true); })
      .catch(() => {});
  };

  useEffect(() => {
    wakeUpServer();
    checkGeo();
    const handleVisibility = () => { if (document.visibilityState === 'visible') checkGeo(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        <Route path="/verificar-email" element={<VerificarEmail />} />
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
        <Route path="/suscripcion/exito" element={<SuscripcionExito />} />
        <Route path="/admin" element={<ProtectedRoute><SuperAdmin /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Grilla global de fondo — aparece en todas las páginas */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          <div style={{
            position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
            width: 700, height: 400,
            background: 'radial-gradient(ellipse, rgba(201,168,76,0.09) 0%, transparent 70%)',
          }} />
        </div>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
