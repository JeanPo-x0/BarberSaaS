import { useNavigate } from 'react-router-dom';

export default function SuscripcionExito() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0A', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        maxWidth: 420, width: '100%', background: '#111',
        border: '1px solid rgba(201,168,76,0.2)', borderRadius: 18,
        overflow: 'hidden', textAlign: 'center',
      }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #C9A84C 40%, #e8c96a 60%, transparent)' }} />
        <div style={{ padding: '40px 32px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 style={{
            fontFamily: "'Bebas Neue'", fontSize: 32, letterSpacing: '0.06em',
            color: '#C9A84C', margin: '0 0 12px',
          }}>
            Pago exitoso
          </h1>
          <p style={{ color: '#aaa', fontSize: 15, margin: '0 0 28px', lineHeight: 1.6 }}>
            Tu suscripción quedó activada. Ya podés usar todas las funciones de tu plan.
          </p>
          <button
            onClick={() => navigate('/panel')}
            className="btn-gold"
            style={{ padding: '13px 32px', fontSize: 15 }}
          >
            Ir al Panel →
          </button>
        </div>
      </div>
    </div>
  );
}
