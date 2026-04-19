import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function BannerTC() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('tc_aceptado')) setVisible(true);
  }, []);

  const aceptar = () => {
    localStorage.setItem('tc_aceptado', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'rgba(17,17,17,0.97)',
      backdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(201,168,76,0.2)',
      padding: '14px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, flexWrap: 'wrap',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, flex: 1, minWidth: 220 }}>
        Al usar esta plataforma aceptás nuestros{' '}
        <Link to="/terminos" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}>
          Términos y Condiciones
        </Link>{' '}y la{' '}
        <Link to="/privacidad" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}>
          Política de Privacidad
        </Link>.
      </p>
      <button onClick={aceptar} className="btn-gold" style={{ padding: '8px 20px', fontSize: 13, flexShrink: 0 }}>
        Entendido
      </button>
    </div>
  );
}
