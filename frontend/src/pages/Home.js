import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-yellow-400">BarberSaaS</h1>
        <Link to="/login" className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition">
          Iniciar sesion
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-5xl font-bold mb-6">
          Tu barberia en <span className="text-yellow-400">piloto automatico</span>
        </h2>
        <p className="text-gray-400 text-xl mb-10 max-w-2xl mx-auto">
          Tus clientes agendan citas directo por WhatsApp. Sin llamadas, sin grupos, sin estar pendiente del telefono.
        </p>
        <Link to="/login" className="bg-yellow-400 text-gray-900 font-bold px-8 py-4 rounded-xl text-lg hover:bg-yellow-300 transition">
          Empezar gratis
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-2xl p-6">
          <div className="text-3xl mb-3">📱</div>
          <h3 className="font-bold text-lg mb-2">Agenda por WhatsApp</h3>
          <p className="text-gray-400 text-sm">El cliente escribe, el bot responde y agenda la cita solo. Sin apps adicionales.</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6">
          <div className="text-3xl mb-3">🔔</div>
          <h3 className="font-bold text-lg mb-2">Recordatorios automaticos</h3>
          <p className="text-gray-400 text-sm">El sistema avisa al cliente 24h y 1h antes. Menos olvidos, menos citas perdidas.</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="font-bold text-lg mb-2">Panel de control</h3>
          <p className="text-gray-400 text-sm">Ve tu agenda, gestiona barberos y servicios desde cualquier dispositivo.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-24">
        <h3 className="text-3xl font-bold text-center mb-10">Planes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-2xl p-6 text-center">
            <h4 className="font-bold text-lg mb-1">Basico</h4>
            <p className="text-yellow-400 text-3xl font-bold my-3">$0</p>
            <p className="text-gray-400 text-sm mb-4">14 dias gratis</p>
            <p className="text-gray-300 text-sm">1 barbero</p>
          </div>
          <div className="bg-yellow-400 text-gray-900 rounded-2xl p-6 text-center scale-105">
            <h4 className="font-bold text-lg mb-1">Pro</h4>
            <p className="text-3xl font-bold my-3">$29/mes</p>
            <p className="text-gray-700 text-sm mb-4">Mas popular</p>
            <p className="text-sm">Hasta 5 barberos</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 text-center">
            <h4 className="font-bold text-lg mb-1">Premium</h4>
            <p className="text-yellow-400 text-3xl font-bold my-3">$59/mes</p>
            <p className="text-gray-400 text-sm mb-4">Sin limites</p>
            <p className="text-gray-300 text-sm">Barberos ilimitados</p>
          </div>
        </div>
      </div>

      <footer className="bg-gray-800 px-6 py-6 text-center text-gray-500 text-sm">
        BarberSaaS 2026 — Hecho con fuego
      </footer>
    </div>
  );
}

export default Home;
