import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import ReceptionDashboard from './pages/reception/ReceptionDashboard';
import './index.css';

function CoachSpace() { return <div className="text-white p-5"><h2>Espace Coach</h2><p>Planning & Suivi Membres.</p></div>; }
function ClientSpace() { return <div className="text-white p-5"><h2>Espace Membre</h2><p>Renouvellement, Réservations.</p></div>; }

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/reception/*" element={<ReceptionDashboard />} />
        <Route path="/coach" element={<CoachSpace />} />
        <Route path="/client" element={<ClientSpace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
