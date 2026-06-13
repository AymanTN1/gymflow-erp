import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import './index.css';

function AdminSpace() { return <div className="text-white p-5"><h2>Espace Super-Admin</h2><p>Grand Livre, RH, Dashboard Financier, CRM.</p></div>; }
function ReceptionSpace() { return <div className="text-white p-5"><h2>Espace Réceptionniste</h2><p>Pointage, Caisse, Factures, Dettes.</p></div>; }
function CoachSpace() { return <div className="text-white p-5"><h2>Espace Coach</h2><p>Planning & Suivi Membres.</p></div>; }
function ClientSpace() { return <div className="text-white p-5"><h2>Espace Membre</h2><p>Renouvellement, Réservations.</p></div>; }

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminSpace />} />
        <Route path="/reception" element={<ReceptionSpace />} />
        <Route path="/coach" element={<CoachSpace />} />
        <Route path="/client" element={<ClientSpace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
