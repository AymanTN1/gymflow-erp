import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import ReceptionDashboard from './pages/reception/ReceptionDashboard';
import CoachDashboard from './pages/coach/CoachDashboard';
import ClientDashboard from './pages/client/ClientDashboard';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/reception/*" element={<ReceptionDashboard />} />
        <Route path="/coach/*" element={<CoachDashboard />} />
        <Route path="/client/*" element={<ClientDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
