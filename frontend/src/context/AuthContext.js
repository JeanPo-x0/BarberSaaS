import { createContext, useContext, useState, useEffect } from 'react';
import { logout as apiLogout, getMe } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(
    JSON.parse(localStorage.getItem('usuario') || 'null')
  );

  // Verify token on mount and keep in sync across tabs
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (token && storedUsuario?.rol !== 'barbero') {
      getMe()
        .then(r => {
          const datos = r.data;
          localStorage.setItem('usuario', JSON.stringify(datos));
          setUsuario(datos);
        })
        .catch(() => {
          // No cerrar sesión si falla la red — mantener sesión existente
        });
    }

    const handleStorage = (e) => {
      if (e.key === 'usuario') {
        setUsuario(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const iniciarSesion = (datosUsuario) => {
    localStorage.setItem('usuario', JSON.stringify(datosUsuario));
    setUsuario(datosUsuario);
  };

  const cerrarSesion = async () => {
    try { await apiLogout(); } catch {}
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
