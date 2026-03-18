import { useEffect, useState } from 'react';
import { getBarberias, crearBarberia } from '../services/api';

function Barberias() {
  const [barberias, setBarberias] = useState([]);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');

  useEffect(() => {
    getBarberias().then(res => setBarberias(res.data));
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    await crearBarberia({ nombre, telefono });
    getBarberias().then(res => setBarberias(res.data));
    setNombre('');
    setTelefono('');
  };

  return (
    <div>
      <h2>Barberias</h2>
      <form onSubmit={handleCrear}>
        <input
          placeholder="Nombre"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
        />
        <input
          placeholder="Telefono"
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
        />
        <button type="submit">Crear barberia</button>
      </form>

      <ul>
        {barberias.map(b => (
          <li key={b.id}>{b.nombre} — {b.telefono}</li>
        ))}
      </ul>
    </div>
  );
}

export default Barberias;