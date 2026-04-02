import { useState } from 'react';
import { Link } from 'react-router-dom';
import { recuperarPassword } from '../services/api';

function RecuperarPassword() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      await recuperarPassword({ email });
    } catch {
      // Siempre mostrar exito para no revelar si el email existe
    } finally {
      setCargando(false);
      setEnviado(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-yellow-400 text-center mb-2">BarberSaaS</h1>
        <p className="text-gray-400 text-center mb-8">Recuperar contrasena</p>

        {enviado ? (
          <div className="text-center space-y-4">
            <p className="text-white font-semibold">Revisa tu correo</p>
            <p className="text-gray-400 text-sm">
              Si el email <span className="text-yellow-400">{email}</span> esta registrado,
              recibiras un link para restablecer tu contrasena. El link expira en 15 minutos.
            </p>
            <Link
              to="/login"
              className="inline-block mt-4 text-yellow-400 hover:underline text-sm"
            >
              ← Volver al login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-1">Tu email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="tu@email.com"
                required
              />
            </div>
            <p className="text-gray-500 text-sm">
              Te enviaremos un link para crear una nueva contrasena.
            </p>
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-yellow-400 text-gray-900 font-bold py-2 rounded-lg hover:bg-yellow-300 transition disabled:opacity-50"
            >
              {cargando ? 'Enviando...' : 'Enviar link de recuperacion'}
            </button>
            <p className="text-center text-gray-500 text-sm mt-2">
              <Link to="/login" className="text-yellow-400 hover:underline">
                ← Volver al login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default RecuperarPassword;
