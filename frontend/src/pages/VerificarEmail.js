import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verificarEmail } from '../services/api';

export default function VerificarEmail() {
  const [params] = useSearchParams();
  const [estado, setEstado] = useState('verificando'); // verificando | ok | error

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setEstado('error'); return; }
    verificarEmail(token)
      .then(() => setEstado('ok'))
      .catch(() => setEstado('error'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0A', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        maxWidth: 420, width: '100%', background: '#111',
        border: '1px solid rgba(201,168,76,0.15)', borderRadius: 18,
        overflow: 'hidden', textAlign: 'center',
      }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #C9A84C 40%, #e8c96a 60%, transparent)' }} />
        <div style={{ padding: '40px 32px' }}>
          {estado === 'verificando' && (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
              <h2 style={{ color: '#F5F5F5', fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: '0.06em', margin: '0 0 8px' }}>
                Verificando...
              </h2>
              <p style={{ color: '#555', fontSize: 14, margin: 0 }}>Un momento por favor.</p>
            </>
          )}

          {estado === 'ok' && (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <h2 style={{ color: '#4ade80', fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: '0.06em', margin: '0 0 8px' }}>
                Email verificado
              </h2>
              <p style={{ color: '#aaa', fontSize: 14, margin: '0 0 24px' }}>
                Tu cuenta está activa. Ya podés ingresar a BarberSaaS.
              </p>
              <Link
                to="/login"
                style={{
                  display: 'inline-block', background: '#C9A84C', color: '#0A0A0A',
                  padding: '12px 28px', borderRadius: 10, textDecoration: 'none',
                  fontWeight: 700, fontSize: 14,
                }}
              >
                Ir al login
              </Link>
            </>
          )}

          {estado === 'error' && (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
              <h2 style={{ color: '#E63946', fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: '0.06em', margin: '0 0 8px' }}>
                Link inválido
              </h2>
              <p style={{ color: '#aaa', fontSize: 14, margin: '0 0 24px' }}>
                Este link expiró o ya fue usado. Intentá ingresar para recibir un nuevo email de verificación.
              </p>
              <Link
                to="/login"
                style={{
                  display: 'inline-block', background: 'rgba(201,168,76,0.1)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  color: '#C9A84C', padding: '12px 28px', borderRadius: 10,
                  textDecoration: 'none', fontWeight: 700, fontSize: 14,
                }}
              >
                Volver al login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
