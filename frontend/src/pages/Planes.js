import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCouponActivo } from '../services/api';

const PLANES = [
  {
    id: 'basico',
    nombre: 'Basico',
    precio_mensual: 0,
    precio_anual: 0,
    badge: '14 dias gratis',
    badgeClass: 'bg-gray-700 text-gray-300',
    borderClass: 'border-gray-700',
    features: [
      '1 barbero',
      'Agenda basica',
      'Link de agendamiento',
      'Recordatorios WhatsApp',
    ],
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precio_mensual: 29,
    precio_anual: 278,
    badge: 'Mas popular',
    badgeClass: 'bg-yellow-400 text-black',
    borderClass: 'border-yellow-400',
    features: [
      'Hasta 3 barberos',
      'Dashboard de ingresos',
      'Recordatorios WhatsApp',
      'Historial de clientes',
      'Perfil del cliente con historial de cortes',
      'Lista de espera inteligente',
    ],
  },
  {
    id: 'premium',
    nombre: 'Premium',
    precio_mensual: 59,
    precio_anual: 566,
    badge: 'Todo incluido',
    badgeClass: 'bg-purple-600 text-white',
    borderClass: 'border-purple-500',
    features: [
      'Barberos ilimitados',
      'Todo lo del plan Pro',
      'Metricas de retencion',
      'WhatsApp automatico de reenganche',
      'Exportar reportes PDF',
      'Subdominio propio (.barbersaas.com)',
      'Estadisticas avanzadas',
      'Soporte prioritario',
    ],
  },
];

export default function Planes() {
  const [anual, setAnual] = useState(false);
  const [couponActivo, setCouponActivo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getCouponActivo()
      .then((res) => setCouponActivo(res.data.activo))
      .catch(() => setCouponActivo(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white py-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-yellow-400 mb-3">Planes y Precios</h1>
          <p className="text-gray-400 text-lg">Empieza gratis. Crece cuando quieras.</p>

          {/* Toggle mensual / anual */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-semibold transition-colors ${!anual ? 'text-white' : 'text-gray-500'}`}>
              Mensual
            </span>

            <div
              onClick={() => setAnual(!anual)}
              className={`relative cursor-pointer w-14 h-7 rounded-full transition-colors duration-300 ${
                anual ? 'bg-yellow-400' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  anual ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </div>

            <span className={`text-sm font-semibold transition-colors ${anual ? 'text-white' : 'text-gray-500'}`}>
              Anual
            </span>
            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-medium">
              20% off
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANES.map((plan) => {
            const precio = anual ? plan.precio_anual : plan.precio_mensual;
            const periodo = anual ? 'ano' : 'mes';
            const esGratis = plan.precio_mensual === 0;

            return (
              <div
                key={plan.id}
                className={`relative bg-gray-900 border-2 ${plan.borderClass} rounded-2xl p-6 flex flex-col`}
              >
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full ${plan.badgeClass}`}
                >
                  {plan.badge}
                </span>

                <h2 className="text-2xl font-bold mt-2">{plan.nombre}</h2>

                <div className="my-4">
                  {esGratis ? (
                    <div>
                      <span className="text-4xl font-black text-yellow-400">Gratis</span>
                      <p className="text-gray-400 text-sm mt-1">14 dias de prueba, sin tarjeta</p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl font-black text-yellow-400">${precio}</span>
                      <span className="text-gray-400 text-sm">/{periodo}</span>
                      {anual && (
                        <p className="text-green-400 text-xs mt-1">
                          Ahorras ${plan.precio_mensual * 12 - plan.precio_anual}/ano
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-yellow-400 font-bold mt-0.5">-</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/registro', { state: { plan: plan.id } })}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition ${
                    plan.id === 'pro'
                      ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                      : 'border border-gray-600 text-white hover:border-yellow-400 hover:text-yellow-400'
                  }`}
                >
                  {esGratis ? 'Empezar gratis' : `Elegir ${plan.nombre}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Banner Early Access — solo si el coupon sigue activo */}
        {couponActivo && (
          <div className="mt-10 bg-gray-900 border border-yellow-400/40 rounded-2xl p-6 text-center">
            <p className="text-yellow-400 font-bold text-lg mb-1">Oferta Early Access</p>
            <p className="text-gray-300">
              Los primeros 20 clientes obtienen el plan Pro por{' '}
              <span className="text-yellow-400 font-bold">$15/mes para siempre</span>
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Usa el codigo{' '}
              <span className="font-mono bg-gray-800 px-2 py-0.5 rounded text-white">EARLYACCESS</span>{' '}
              al registrarte
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
