import { useNavigate } from 'react-router-dom';

export default function SuscripcionExito() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <h1 className="text-3xl font-black text-yellow-400 mb-2">Pago exitoso</h1>
        <p className="text-gray-400 mb-8">Tu suscripción quedó activada. Ya puedes usar todas las funciones de tu plan.</p>
        <button
          onClick={() => navigate('/panel')}
          className="bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl hover:bg-yellow-300 transition"
        >
          Ir al Panel →
        </button>
      </div>
    </div>
  );
}
