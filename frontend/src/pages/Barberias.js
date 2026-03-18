import { useEffect, useState } from 'react';
import { getBarberias, crearBarberia } from '../services/api';
import { Link } from 'react-router-dom';

function Barberias() {
  const [barberias, setBarberias] = useState([]);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  useEffect(() => {
    getBarberias().then(res => setBarberias(res.data));
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    await crearBarberia({ nombre, telefono, direccion });
    getBarberias().then(res => setBarberias(res.data));
    setNombre(''); setTelefono(''); setDireccion('');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-yellow-400">BarberSaaS</h1>
        <div className="flex gap-4">
          <Link to="/agenda" className="text-gray-300 hover:text-white">Agenda</Link>
          <Link to="/panel" className="text-gray-300 hover:text-white">Panel</Link>
          <Link to="/login" className="text-gray-400 hover:text-red-400">Salir</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Barberias</h2>

        <div className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Registrar nueva barberia</h3>
          <form onSubmit={handleCrear} className="grid grid-cols-1 gap-4">
            <input
              placeholder="Nombre de la barberia"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              className="bg-gray-700 text-white rounded-lg px-4 py-2"
            />
            <input
              placeholder="Telefono"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-4 py-2"
            />
            <input
              placeholder="Direccion"
              value={direccion}
              onChange={e => setDireccion(e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-4 py-2"
            />
            <button type="submit" className="bg-yellow-400 text-gray-900 font-bold py-2 rounded-lg hover:bg-yellow-300 transition">
              Registrar barberia
            </button>
          </form>
        </div>

        <div className="space-y-3">
          {barberias.map(b => (
            <div key={b.id} className="bg-gray-800 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold">{b.nombre}</p>
                <p className="text-gray-400 text-sm">{b.direccion} — {b.telefono}</p>
              </div>
              <div className="text-right">
                <span className="text-xs bg-blue-500 px-2 py-1 rounded-full">{b.plan}</span>
                <p className="text-xs text-gray-500 mt-1">{b.activa ? 'Activa' : 'Inactiva'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Barberias;
