import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Barberias from './pages/Barberias';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <nav>
          <Link to="/barberias">Barberias</Link>
        </nav>
        <Routes>
          <Route path="/barberias" element={<Barberias />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
