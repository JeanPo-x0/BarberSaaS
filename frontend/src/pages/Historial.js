import { useEffect, useState } from 'react';
import { getMisCitas } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import LogoLink from '../components/LogoLink';

function Historial() {
  const [citas, setCitas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    getMisCitas().then(res => {
      const hace30dias = new Date();
      hace30dias.setDate(hace30dias.getDate() - 30);
      const historial = res.data.filter(c =>
        (c.estado === 'cancelada' || c.estado === 'completada') &&
        new Date(c.fecha_hora) >= hace30dias
      );
      setCitas(historial);
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 px-6 py-4 flex justify-between items-center">
        <LogoLink className="text-xl font-bold text-yellow-400">BarberSaaS</LogoLink>
        <div className="flex gap-4">
          <Link to="/agenda" className="text-gray-300 hover:text-white px-4 py-2">Agenda</Link>
          <Link to="/panel" className="text-gray-300 hover:text-white px-4 py-2">Panel</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Link to="/agenda" className="text-gray-400 hover:text-white transition">← Volver</Link>
            <h2 className="text-2xl font-bold">Historial</h2>
          </div>
          <p className="text-gray-500 text-sm">Ultimos 30 dias</p>
        </div>

        {citas.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-8 text-center text-gray-400">
            <p>No hay citas en el historial</p>
          </div>
        ) : (
          <div className="space-y-3">
            {citas.map(cita => (
              <div key={cita.id} className="bg-gray-800 rounded-xl p-4 flex justify-between items-center opacity-70">
                <div>
                  <p className="font-semibold">Cita #{cita.id}</p>
                  <p className="text-gray-400 text-sm">{new Date(cita.fecha_hora).toLocaleString('es-CR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${
                  cita.estado === 'cancelada' ? 'bg-red-500' : 'bg-blue-500'
                }`}>
                  {cita.estado}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Historial;
