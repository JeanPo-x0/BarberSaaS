import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  getBarberos, crearBarbero,
  getServicios, crearServicio,
  getBarberias, crearBarberia
} from '../services/api';
import { useAuth } from '../context/AuthContext';

function PanelDueno() {
  const [barberos, setBarberos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [barberias, setBarberias] = useState([]);
  const [tab, setTab] = useState('barberos');
  const { cerrarSesion } = useAuth();
  const navigate = useNavigate();

  // Formularios
  const [nomBarbero, setNomBarbero] = useState('');
  const [telBarbero, setTelBarbero] = useState('');
  const [espBarbero, setEspBarbero] = useState('');
  const [barberiaBarbero, setBarberiaBarbero] = useState('');

  const [nomServicio, setNomServicio] = useState('');
  const [durServicio, setDurServicio] = useState('');
  const [precioServicio, setPrecioServicio] = useState('');
  const [barberias_servicio, setBarberiasServicio] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    getBarberos().then(r => setBarberos(r.data));
    getServicios().then(r => setServicios(r.data));
    getBarberias().then(r => setBarberias(r.data));
  }, [navigate]);

  const handleCrearBarbero = async (e) => {
    e.preventDefault();
    await crearBarbero({ nombre: nomBarbero, telefono: telBarbero, especialidad: espBarbero, barberia_id: parseInt(barberiaBarbero) });
    getBarberos().then(r => setBarberos(r.data));
    setNomBarbero(''); setTelBarbero(''); setEspBarbero(''); setBarberiaBarbero('');
  };

  const handleCrearServicio = async (e) => {
    e.preventDefault();
    await crearServicio({ nombre: nomServicio, duracion_minutos: parseInt(durServicio), precio: parseFloat(precioServicio), barberia_id: parseInt(barberias_servicio) });
    getServicios().then(r => setServicios(r.data));
    setNomServicio(''); setDurServicio(''); setPrecioServicio(''); setBarberiasServicio('');
  };

  const tabClass = (t) => `px-4 py-2 rounded-lg font-medium transition ${tab === t ? 'bg-yellow-400 text-gray-900' : 'text-gray-400 hover:text-white'}`;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-yellow-400">BarberSaaS — Panel</Link>
        <div className="flex gap-4">
          <Link to="/agenda" className="text-gray-300 hover:text-white">Agenda</Link>
          <button onClick={cerrarSesion} className="text-gray-400 hover:text-red-400">Salir</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex gap-2 mb-6">
          <button className={tabClass('barberos')} onClick={() => setTab('barberos')}>Barberos</button>
          <button className={tabClass('servicios')} onClick={() => setTab('servicios')}>Servicios</button>
          <button className={tabClass('barberias')} onClick={() => setTab('barberias')}>Barberias</button>
        </div>

        {/* Tab Barberos */}
        {tab === 'barberos' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Agregar barbero</h2>
              <form onSubmit={handleCrearBarbero} className="grid grid-cols-2 gap-4">
                <input value={nomBarbero} onChange={e => setNomBarbero(e.target.value)} placeholder="Nombre" required
                  className="bg-gray-700 rounded-lg px-4 py-2 col-span-2" />
                <input value={telBarbero} onChange={e => setTelBarbero(e.target.value)} placeholder="Telefono"
                  className="bg-gray-700 rounded-lg px-4 py-2" />
                <input value={espBarbero} onChange={e => setEspBarbero(e.target.value)} placeholder="Especialidad"
                  className="bg-gray-700 rounded-lg px-4 py-2" />
                <select value={barberiaBarbero} onChange={e => setBarberiaBarbero(e.target.value)} required
                  className="bg-gray-700 rounded-lg px-4 py-2 col-span-2">
                  <option value="">Selecciona barberia</option>
                  {barberias.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
                <button type="submit" className="col-span-2 bg-yellow-400 text-gray-900 font-bold py-2 rounded-lg hover:bg-yellow-300">
                  Agregar
                </button>
              </form>
            </div>
            <div className="space-y-3">
              {barberos.map(b => (
                <div key={b.id} className="bg-gray-800 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{b.nombre}</p>
                    <p className="text-gray-400 text-sm">{b.especialidad} — {b.telefono}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${b.activo ? 'bg-green-500' : 'bg-red-500'}`}>
                    {b.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Servicios */}
        {tab === 'servicios' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Agregar servicio</h2>
              <form onSubmit={handleCrearServicio} className="grid grid-cols-2 gap-4">
                <input value={nomServicio} onChange={e => setNomServicio(e.target.value)} placeholder="Nombre del servicio" required
                  className="bg-gray-700 rounded-lg px-4 py-2 col-span-2" />
                <input value={durServicio} onChange={e => setDurServicio(e.target.value)} placeholder="Duracion (min)" type="number" required
                  className="bg-gray-700 rounded-lg px-4 py-2" />
                <input value={precioServicio} onChange={e => setPrecioServicio(e.target.value)} placeholder="Precio" type="number" required
                  className="bg-gray-700 rounded-lg px-4 py-2" />
                <select value={barberias_servicio} onChange={e => setBarberiasServicio(e.target.value)} required
                  className="bg-gray-700 rounded-lg px-4 py-2 col-span-2">
                  <option value="">Selecciona barberia</option>
                  {barberias.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
                <button type="submit" className="col-span-2 bg-yellow-400 text-gray-900 font-bold py-2 rounded-lg hover:bg-yellow-300">
                  Agregar
                </button>
              </form>
            </div>
            <div className="space-y-3">
              {servicios.map(s => (
                <div key={s.id} className="bg-gray-800 rounded-xl p-4 flex justify-between items-center">
                  <p className="font-semibold">{s.nombre}</p>
                  <div className="text-right">
                    <p className="text-yellow-400 font-bold">${s.precio}</p>
                    <p className="text-gray-400 text-sm">{s.duracion_minutos} min</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Barberias */}
        {tab === 'barberias' && (
          <div className="space-y-3">
            {barberias.map(b => (
              <div key={b.id} className="bg-gray-800 rounded-xl p-4 space-y-2">
                <p className="font-semibold">{b.nombre}</p>
                <p className="text-gray-400 text-sm">{b.direccion} — Plan: {b.plan}</p>
                <div className="bg-gray-700 rounded-lg px-3 py-2 flex justify-between items-center">
                  <span className="text-yellow-400 text-sm truncate">
                    {window.location.origin}/agendar/{b.id}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/agendar/${b.id}`)}
                    className="text-xs bg-yellow-400 text-gray-900 px-3 py-1 rounded-lg ml-2 font-semibold hover:bg-yellow-300 transition whitespace-nowrap"
                  >
                    Copiar link
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PanelDueno;
