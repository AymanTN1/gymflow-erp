import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/layout/PrivateRoute';
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
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          {/* Routes Admin */}
          <Route path="/admin" element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/rh" element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><AdminRh /></PrivateRoute>} />
          <Route path="/admin/finances" element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><AdminFinances /></PrivateRoute>} />
          <Route path="/admin/crm" element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><AdminCrm /></PrivateRoute>} />
          <Route path="/admin/planning" element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><AdminPlanning /></PrivateRoute>} />
          
          {/* Routes Réception */}
          <Route path="/reception" element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPTION']}><ReceptionDashboard /></PrivateRoute>} />
          <Route path="/reception/clients" element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPTION']}><ReceptionClients /></PrivateRoute>} />
          <Route path="/reception/pointage-cours" element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPTION']}><ReceptionPointageCours /></PrivateRoute>} />
          <Route path="/reception/pos" element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPTION']}><ReceptionPos /></PrivateRoute>} />
          
          {/* Routes Coach */}
          <Route path="/coach/*" element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'COACH']}><CoachDashboard /></PrivateRoute>} />
          
          {/* Routes Client */}
          <Route path="/client" element={<PrivateRoute allowedRoles={['CLIENT']}><ClientDashboard /></PrivateRoute>} />
          <Route path="/client/booking" element={<PrivateRoute allowedRoles={['CLIENT']}><ClientBooking /></PrivateRoute>} />
          <Route path="/client/invoices" element={<PrivateRoute allowedRoles={['CLIENT']}><ClientInvoices /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
