import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRh from './pages/admin/AdminRh';
import AdminFinances from './pages/admin/AdminFinances';
import AdminCrm from './pages/admin/AdminCrm';
import AdminPlanning from './pages/admin/AdminPlanning';
import ReceptionDashboard from './pages/reception/ReceptionDashboard';
import ReceptionClients from './pages/reception/ReceptionClients';
import ReceptionPointageCours from './pages/reception/ReceptionPointageCours';
import ReceptionPos from './pages/reception/ReceptionPos';
import CoachDashboard from './pages/coach/CoachDashboard';
import ClientDashboard from './pages/client/ClientDashboard';
import ClientBooking from './pages/client/ClientBooking';
import ClientInvoices from './pages/client/ClientInvoices';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/rh" element={<AdminRh />} />
        <Route path="/admin/finances" element={<AdminFinances />} />
        <Route path="/admin/crm" element={<AdminCrm />} />
        <Route path="/admin/planning" element={<AdminPlanning />} />
        <Route path="/reception" element={<ReceptionDashboard />} />
        <Route path="/reception/clients" element={<ReceptionClients />} />
        <Route path="/reception/pointage-cours" element={<ReceptionPointageCours />} />
        <Route path="/reception/pos" element={<ReceptionPos />} />
        <Route path="/coach/*" element={<CoachDashboard />} />
        <Route path="/client" element={<ClientDashboard />} />
        <Route path="/client/booking" element={<ClientBooking />} />
        <Route path="/client/invoices" element={<ClientInvoices />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
