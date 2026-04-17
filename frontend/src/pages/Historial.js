import { useEffect, useState } from 'react';
import { getMisCitas } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const ESTADO_COLOR = {
  cancelada: { bg: 'rgba(230,57,70,0.1)', color: '#E63946', border: 'rgba(230,57,70,0.3)' },
  completada: { bg: 'rgba(74,222,128,0.08)', color: '#4ade80', border: 'rgba(74,222,128,0.25)' },
};

function Historial() {
  const [citas, setCitas] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    getMisCitas().then(res => {
      const hace30dias = new Date();
      hace30dias.setDate(hace30dias.getDate() - 30);
      const historial = res.data.filter(c =>
        (c.estado === 'cancelada' || c.estado === 'completada') &&
        new Date(c.fecha_hora) >= hace30dias
      );
      setCitas(historial);
    });
  }, [navigate]);

  const citasFiltradas = filtro === 'todas' ? citas : citas.filter(c => c.estado === filtro);

  return (
    <div className="bg-panel" style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />

      <div className="mobile-px" style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div className="mobile-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 32, letterSpacing: '0.08em', margin: 0, color: 'var(--text-primary)' }}>
              Historial
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0 0' }}>
              Ultimos 30 dias
            </p>
          </div>
          <Link to="/agenda" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none',
            padding: '8px 14px', borderRadius: 8,
            border: '1px solid var(--border)',
            transition: 'color 0.2s, border-color 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F5F5F5'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver
          </Link>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['todas', 'completada', 'cancelada'].map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={{
                background: filtro === f ? '#C9A84C' : 'var(--bg-card)',
                color: filtro === f ? '#0A0A0A' : 'var(--text-muted)',
                border: `1px solid ${filtro === f ? '#C9A84C' : 'var(--border)'}`,
                borderRadius: 8, padding: '6px 14px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans'",
                transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}
            >
              {f === 'todas' ? 'Todas' : f}
            </button>
          ))}
        </div>

        {/* Lista */}
        {citasFiltradas.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '48px 24px', textAlign: 'center',
          }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No hay citas en el historial</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {citasFiltradas.map(cita => {
              const est = ESTADO_COLOR[cita.estado] || ESTADO_COLOR.completada;
              return (
                <div key={cita.id} className="mobile-item-row" style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '16px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  opacity: 0.85,
                }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 15, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                      Cita #{cita.id}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                      {new Date(cita.fecha_hora).toLocaleString('es-CR', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span style={{
                    background: est.bg, color: est.color,
                    border: `1px solid ${est.border}`,
                    borderRadius: 100, padding: '4px 12px',
                    fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                  }}>
                    {cita.estado}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Historial;
