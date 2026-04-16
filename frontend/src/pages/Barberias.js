import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Barberias() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/panel', { replace: true }); }, [navigate]);
  return null;
}

export default Barberias;
