import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Barberias from './pages/Barberias';
import Agenda from './pages/Agenda';
import AgendarCita from './pages/AgendarCita';
import PanelDueno from './pages/PanelDueno';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/barberias" element={<Barberias />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/agendar" element={<AgendarCita />} />
          <Route path="/panel" element={<PanelDueno />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
