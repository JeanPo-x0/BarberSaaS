import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
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
import './App.css';

function App() {
  // Despertar el servidor al cargar la app — cubre todas las páginas
  useEffect(() => { wakeUpServer(); }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Onboarding />} />
          <Route path="/planes" element={<Planes />} />
          <Route path="/barberias" element={<Barberias />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/agendar" element={<AgendarCita />} />
          <Route path="/agendar/:barberia_id" element={<AgendarCita />} />
          <Route path="/b/:slug" element={<AgendarCita />} />
          <Route path="/panel" element={<PanelDueno />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/ingresos" element={<DashboardIngresos />} />
          <Route path="/admin" element={<SuperAdmin />} />
          <Route path="/suscripcion/exito" element={<SuscripcionExito />} />
          <Route path="/recuperar-password" element={<RecuperarPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/privacidad" element={<Privacidad />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
