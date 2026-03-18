import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  getBarberos, getServicios, getClientes, getBarberia,
  crearCliente, crearCita, getDisponibilidad
} from '../services/api';

function AgendarCita() {
  const { barberia_id } = useParams();
  const [barberia, setBarberia] = useState(null);
  const [barberos, setBarberos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [slots, setSlots] = useState([]);

  const [barberoId, setBarberoId] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [paso, setPaso] = useState(1);
  const [error, setError] = useState('');
  const [confirmado, setConfirmado] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (barberia_id) {
      getBarberia(barberia_id).then(r => setBarberia(r.data));
      getBarberos().then(r => setBarberos(r.data.filter(b => b.activo && b.barberia_id === parseInt(barberia_id))));
      getServicios().then(r => setServicios(r.data.filter(s => s.barberia_id === parseInt(barberia_id))));
    } else {
      getBarberos().then(r => setBarberos(r.data.filter(b => b.activo)));
      getServicios().then(r => setServicios(r.data));
    }
  }, [barberia_id]);

  useEffect(() => {
    if (barberoId && fecha) {
      getDisponibilidad(barberoId, fecha).then(r => setSlots(r.data.slots));
    }
  }, [barberoId, fecha]);

  const handleConfirmar = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let clienteId;
      const clientes = await getClientes();
      const existente = clientes.data.find(c => c.telefono === telefono);
      if (existente) {
        clienteId = existente.id;
      } else {
        const nuevo = await crearCliente({ nombre, telefono });
        clienteId = nuevo.data.id;
      }
      const fechaHora = `${fecha}T${horaSeleccionada}:00`;
      await crearCita({
        fecha_hora: fechaHora,
        barbero_id: parseInt(barberoId),
        servicio_id: parseInt(servicioId),
        cliente_id: clienteId
      });
      setConfirmado(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al agendar la cita');
    }
  };

  if (confirmado) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h2 className="text-2xl font-bold text-yellow-400">Cita confirmada</h2>
          <p className="text-gray-400">Te llegara un mensaje de WhatsApp con los detalles.</p>
          <button
            onClick={() => { setConfirmado(false); setPaso(1); setBarberoId(''); setServicioId(''); setFecha(''); setHoraSeleccionada(''); setNombre(''); setTelefono(''); }}
            className="w-full bg-yellow-400 text-gray-900 font-bold py-2 rounded-lg hover:bg-yellow-300 transition"
          >
            Agendar otra cita
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-yellow-400 font-bold text-lg">BarberSaaS</Link>
          {barberia && <span className="text-gray-500">— {barberia.nombre}</span>}
        </div>
        <h1 className="text-2xl font-bold mb-6">Agendar cita</h1>

        {paso === 1 && (
          <div className="bg-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Selecciona barbero y servicio</h2>
            <div>
              <label className="block text-gray-400 mb-1">Barbero</label>
              <select value={barberoId} onChange={e => setBarberoId(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2">
                <option value="">-- Selecciona --</option>
                {barberos.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Servicio</label>
              <select value={servicioId} onChange={e => setServicioId(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2">
                <option value="">-- Selecciona --</option>
                {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre} — ${s.precio}</option>)}
              </select>
            </div>
            <button onClick={() => { if (barberoId && servicioId) setPaso(2); }}
              disabled={!barberoId || !servicioId}
              className="w-full bg-yellow-400 text-gray-900 font-bold py-2 rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition">
              Siguiente
            </button>
          </div>
        )}

        {paso === 2 && (
          <div className="bg-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Selecciona fecha y hora</h2>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2" />
            {slots.length > 0 && (
              <div>
                <label className="block text-gray-400 mb-2">Horarios disponibles</label>
                <div className="grid grid-cols-4 gap-2">
                  {slots.map(slot => (
                    <button key={slot.hora} onClick={() => slot.disponible && setHoraSeleccionada(slot.hora)}
                      disabled={!slot.disponible}
                      className={`py-2 rounded-lg text-sm font-medium transition ${
                        horaSeleccionada === slot.hora ? 'bg-yellow-400 text-gray-900'
                        : slot.disponible ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-700 opacity-30 cursor-not-allowed line-through'
                      }`}>
                      {slot.hora}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setPaso(1)} className="flex-1 bg-gray-700 py-2 rounded-lg hover:bg-gray-600">Atras</button>
              <button onClick={() => { if (fecha && horaSeleccionada) setPaso(3); }}
                disabled={!fecha || !horaSeleccionada}
                className="flex-1 bg-yellow-400 text-gray-900 font-bold py-2 rounded-lg hover:bg-yellow-300 disabled:opacity-50">
                Siguiente
              </button>
            </div>
          </div>
        )}

        {paso === 3 && (
          <div className="bg-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Tus datos</h2>
            <form onSubmit={handleConfirmar} className="space-y-4">
              <input value={nombre} onChange={e => setNombre(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                placeholder="Tu nombre" required />
              <input value={telefono} onChange={e => setTelefono(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                placeholder="WhatsApp con codigo de pais: +5731234567" required />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="bg-gray-700 rounded-xl p-4 text-sm text-gray-300 space-y-1">
                <p>Fecha: {fecha} a las {horaSeleccionada}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPaso(2)} className="flex-1 bg-gray-700 py-2 rounded-lg hover:bg-gray-600">Atras</button>
                <button type="submit" className="flex-1 bg-yellow-400 text-gray-900 font-bold py-2 rounded-lg hover:bg-yellow-300">
                  Confirmar cita
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default AgendarCita;
