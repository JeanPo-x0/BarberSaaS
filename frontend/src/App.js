import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { wakeUpServer } from './services/api';
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
import BannerTC from './components/BannerTC';
import './App.css';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  useEffect(() => { wakeUpServer(); }, []);

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

        {/* Privadas — requieren login */}
        <Route path="/barberias" element={<ProtectedRoute><Barberias /></ProtectedRoute>} />
        <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
        <Route path="/panel" element={<ProtectedRoute><PanelDueno /></ProtectedRoute>} />
        <Route path="/historial" element={<ProtectedRoute><Historial /></ProtectedRoute>} />
        <Route path="/ingresos" element={<ProtectedRoute><DashboardIngresos /></ProtectedRoute>} />
        <Route path="/soporte" element={<ProtectedRoute><Soporte /></ProtectedRoute>} />
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
