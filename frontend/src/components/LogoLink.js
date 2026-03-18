import { Link } from 'react-router-dom';

function LogoLink({ children, className }) {
  const autenticado = !!localStorage.getItem('token');
  return (
    <Link to={autenticado ? '/agenda' : '/'} className={className}>
      {children}
    </Link>
  );
}

export default LogoLink;
