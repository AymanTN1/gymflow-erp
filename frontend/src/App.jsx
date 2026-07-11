import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/layout/PrivateRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRh from './pages/admin/AdminRh';
import AdminFinances from './pages/admin/AdminFinances';
import AdminCrm from './pages/admin/AdminCrm';
import AdminPlanning from './pages/admin/AdminPlanning';
import AdminStats from './pages/admin/AdminStats';
import ReceptionDashboard from './pages/reception/ReceptionDashboard';
import ReceptionClients from './pages/reception/ReceptionClients';
import ReceptionPointageCours from './pages/reception/ReceptionPointageCours';
import ReceptionPos from './pages/reception/ReceptionPos';
import CoachDashboard from './pages/coach/CoachDashboard';
import CoachChat from './pages/coach/CoachChat';
import CoachPrograms from './pages/coach/CoachPrograms';
import ClientDashboard from './pages/client/ClientDashboard';
import ClientChat from './pages/client/ClientChat';
import ClientPrograms from './pages/client/ClientPrograms';
import ClientBooking from './pages/client/ClientBooking';
import ClientInvoices from './pages/client/ClientInvoices';
import ClientPayment from './pages/client/ClientPayment';
import PaymentSuccess from './pages/client/PaymentSuccess';
import PaymentCancel from './pages/client/PaymentCancel';
import './index.css';

function App() {
  return (
    <ThemeProvider>
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
          <Route path="/admin/stats-affluence" element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><AdminStats /></PrivateRoute>} />
          
          {/* Routes Réception */}
          <Route path="/reception" element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPTION']}><ReceptionDashboard /></PrivateRoute>} />
          <Route path="/reception/clients" element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPTION']}><ReceptionClients /></PrivateRoute>} />
          <Route path="/reception/pointage-cours" element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPTION']}><ReceptionPointageCours /></PrivateRoute>} />
          <Route path="/reception/pos" element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPTION']}><ReceptionPos /></PrivateRoute>} />
          
          {/* Routes Coach */}
          <Route path="/coach" element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'COACH']}><CoachDashboard /></PrivateRoute>} />
          <Route path="/coach/chat" element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'COACH']}><CoachChat /></PrivateRoute>} />
          <Route path="/coach/programs" element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'COACH']}><CoachPrograms /></PrivateRoute>} />
          
          {/* Routes Client */}
          <Route path="/client" element={<PrivateRoute allowedRoles={['CLIENT']}><ClientDashboard /></PrivateRoute>} />
          <Route path="/client/chat" element={<PrivateRoute allowedRoles={['CLIENT']}><ClientChat /></PrivateRoute>} />
          <Route path="/client/programs" element={<PrivateRoute allowedRoles={['CLIENT']}><ClientPrograms /></PrivateRoute>} />
          <Route path="/client/booking" element={<PrivateRoute allowedRoles={['CLIENT']}><ClientBooking /></PrivateRoute>} />
          <Route path="/client/invoices" element={<PrivateRoute allowedRoles={['CLIENT']}><ClientInvoices /></PrivateRoute>} />
          <Route path="/client/payment" element={<PrivateRoute allowedRoles={['CLIENT']}><ClientPayment /></PrivateRoute>} />
          <Route path="/client/payment-success" element={<PrivateRoute allowedRoles={['CLIENT']}><PaymentSuccess /></PrivateRoute>} />
          <Route path="/client/payment-cancel" element={<PrivateRoute allowedRoles={['CLIENT']}><PaymentCancel /></PrivateRoute>} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
