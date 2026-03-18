import { useEffect, useState } from 'react';
import { getCitas, cancelarCita } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function Agenda() {
  const [citas, setCitas] = useState([]);
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    getCitas().then(res => setCitas(res.data));
  }, [navigate]);

  const handleCancelar = async (id) => {
    await cancelarCita(id);
    getCitas().then(res => setCitas(res.data));
  };

  const citasPendientes = citas.filter(c => c.estado !== 'cancelada');
  const citasCanceladas = citas.filter(c => c.estado === 'cancelada');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-yellow-400">BarberSaaS</h1>
        <div className="flex gap-4">
          <Link to="/agendar" className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition">
            + Nueva cita
          </Link>
          <Link to="/panel" className="text-gray-300 hover:text-white px-4 py-2">
            Panel
          </Link>
          <button onClick={cerrarSesion} className="text-gray-400 hover:text-red-400 px-4 py-2">
            Salir
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Agenda del dia</h2>

        {citasPendientes.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-8 text-center text-gray-400">
            <p className="text-lg">No hay citas pendientes</p>
            <Link to="/agendar" className="mt-4 inline-block bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition">
              Agendar primera cita
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {citasPendientes.map(cita => (
              <div key={cita.id} className="bg-gray-800 rounded-2xl p-5 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-lg">Cita #{cita.id}</p>
                  <p className="text-gray-400 text-sm">
                    {new Date(cita.fecha_hora).toLocaleString('es-CO')}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                    cita.estado === 'pendiente' ? 'bg-yellow-400 text-gray-900' :
                    cita.estado === 'confirmada' ? 'bg-green-500 text-white' : 'bg-gray-600'
                  }`}>
                    {cita.estado}
                  </span>
                </div>
                <button
                  onClick={() => handleCancelar(cita.id)}
                  className="text-red-400 hover:text-red-300 border border-red-400 px-4 py-2 rounded-lg hover:bg-red-400 hover:text-white transition"
                >
                  Cancelar
                </button>
              </div>
            ))}
          </div>
        )}

        {citasCanceladas.length > 0 && (
          <div className="mt-8">
            <h3 className="text-gray-500 mb-3">Canceladas ({citasCanceladas.length})</h3>
            <div className="space-y-2">
              {citasCanceladas.map(cita => (
                <div key={cita.id} className="bg-gray-800 opacity-50 rounded-xl p-4 flex justify-between">
                  <span>Cita #{cita.id}</span>
                  <span className="text-red-400">cancelada</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Agenda;
