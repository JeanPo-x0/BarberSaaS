import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Barberias from './pages/Barberias';
import Agenda from './pages/Agenda';
import AgendarCita from './pages/AgendarCita';
import PanelDueno from './pages/PanelDueno';
import Historial from './pages/Historial';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/barberias" element={<Barberias />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/agendar" element={<AgendarCita />} />
          <Route path="/agendar/:barberia_id" element={<AgendarCita />} />
          <Route path="/panel" element={<PanelDueno />} />
          <Route path="/historial" element={<Historial />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
