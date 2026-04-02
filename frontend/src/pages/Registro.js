import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registro, crearBarberia } from '../services/api';

function Registro() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreBarberia, setNombreBarberia] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const resBarberia = await crearBarberia({ nombre: nombreBarberia, telefono });
      await registro({ email, password, rol: 'dueno', barberia_id: resBarberia.data.id });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrarse');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <Link to="/" className="text-yellow-400 font-bold text-xl block text-center mb-2">BarberSaaS</Link>
        <p className="text-gray-400 text-center mb-8">Registra tu barberia</p>
        <form onSubmit={handleRegistro} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Nombre de tu barberia</label>
            <input value={nombreBarberia} onChange={e => setNombreBarberia(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Barberia Don Juan" required />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Telefono de la barberia</label>
            <input value={telefono} onChange={e => setTelefono(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="+50688887777" />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Tu email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="tu@email.com" required />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Contrasena</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="••••••••" required />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={cargando}
            className="w-full bg-yellow-400 text-gray-900 font-bold py-2 rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition">
            {cargando ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>
        <p className="text-center text-gray-500 text-sm mt-6">
          Ya tienes cuenta?{' '}
          <Link to="/login" className="text-yellow-400 hover:underline">Iniciar sesion</Link>
        </p>
      </div>
    </div>
  );
}

export default Registro;
