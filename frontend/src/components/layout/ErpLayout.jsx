import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from './NotificationBell';

export default function ErpLayout({ children, role }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getLinks = () => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return [
          { path: '/admin', label: 'Dashboard', icon: '📊' },
          { path: '/admin/stats-affluence', label: 'Affluence / Pics', icon: '📈' },
          { path: '/admin/planning', label: 'Planning', icon: '📅' },
          { path: '/admin/finances', label: 'Finances', icon: '💰' },
          { path: '/admin/boutique', label: 'Boutique & Stock', icon: '🛒' },
          { path: '/admin/crm', label: 'CRM / Membres', icon: '👥' },
          { path: '/admin/rh', label: 'RH', icon: '👔' },
          { path: '/admin/churn', label: 'Analyse Churn', icon: '🔴' },
          { path: '/admin/segments', label: 'Segments Clients', icon: '👥' },
          { path: '/admin/previsions', label: 'Prévisions Affluence', icon: '📈' },
          { path: '/admin/optimisation', label: 'Optimisation Planning', icon: '🧮' },
        ];
      case 'RECEPTION':
        return [
          { path: '/reception', label: 'Accueil & Pointage', icon: '🏠' },
          { path: '/reception/clients', label: 'Clients & Abos', icon: '👥' },
          { path: '/reception/pointage-cours', label: 'Cours', icon: '📅' },
          { path: '/reception/pos', label: 'Boutique', icon: '🛒' },
        ];
      case 'COACH':
        return [
          { path: '/coach', label: 'Planning', icon: '📅' },
          { path: '/coach/members', label: 'Suivi Membres', icon: '🏃' },
        ];
      case 'CLIENT':
        return [
          { path: '/client', label: 'Mon Compte', icon: '👤' },
          { path: '/client/booking', label: 'Réservations', icon: '🗓️' },
          { path: '/client/invoices', label: 'Mes Factures', icon: '📄' },
          { path: '/client/payment', label: 'Paiement', icon: '💳' },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <div className="tech-grid-bg"></div>
      <div className="d-flex min-vh-100 flex-column flex-md-row">
        {/* Sidebar (Desktop Only) */}
        <div className="card-premium border-0 border-end border-warning border-opacity-25 p-3 d-none d-md-flex flex-column" style={{ width: '280px', borderRadius: '0' }}>
          <div className="mb-4 text-center">
            <h3 className="fw-bold mb-0 text-white"><span className="text-gold">GymFlow</span> ERP</h3>
            <span className="badge bg-warning text-dark mt-2 text-uppercase">{role}</span>
          </div>
          
          <ul className="nav nav-pills flex-column mb-auto gap-2">
            {links.map((link) => (
              <li className="nav-item" key={link.path}>
                <Link 
                  to={link.path} 
                  className={`nav-link text-white d-flex align-items-center gap-2 ${location.pathname === link.path ? 'active bg-gold text-dark fw-bold' : ''}`}
                  style={location.pathname === link.path ? { backgroundColor: 'var(--accent-gold)' } : {}}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          
          <hr className="border-warning opacity-25" />
          
          <button onClick={toggleTheme} className="btn btn-outline-warning w-100 text-start d-flex align-items-center gap-2 mb-2">
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span> Mode {theme === 'dark' ? 'Clair' : 'Sombre'}
          </button>
          
          <button onClick={handleLogout} className="btn btn-outline-danger w-100 text-start d-flex align-items-center gap-2">
            <span>🚪</span> Déconnexion
          </button>
        </div>

        {/* Mobile Header (Mobile Only) */}
        <div className="d-md-none p-3 border-bottom border-warning border-opacity-25 d-flex justify-content-between align-items-center bg-theme-mobile" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
          <h5 className="fw-bold mb-0 tech-text"><span className="text-gold">GymFlow</span></h5>
          <div className="d-flex align-items-center gap-3">
            <button onClick={toggleTheme} className="btn btn-sm btn-outline-warning rounded-circle p-0" style={{ width: '30px', height: '30px' }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <NotificationBell role={role} />
            <div className="bg-gold rounded-circle d-flex justify-content-center align-items-center fw-bold text-dark" style={{ width: '30px', height: '30px', fontSize: '12px', backgroundColor: 'var(--accent-gold)' }}>
              {role.substring(0, 1)}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 d-flex flex-column w-100" style={{ paddingBottom: role === 'CLIENT' ? '70px' : '0' }}>
          <header className="p-3 border-bottom border-warning border-opacity-25 d-none d-md-flex justify-content-end align-items-center bg-theme-header" style={{ backdropFilter: 'blur(10px)' }}>
            <div className="d-flex align-items-center gap-4">
              <span className="text-muted small">Status: <span className="text-success">Connecté</span></span>
              <button onClick={toggleTheme} className="btn btn-outline-warning rounded-circle p-0 d-flex justify-content-center align-items-center" style={{ width: '40px', height: '40px' }}>
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <NotificationBell role={role} />
              <div className="bg-gold rounded-circle d-flex justify-content-center align-items-center fw-bold text-dark" style={{ width: '40px', height: '40px', backgroundColor: 'var(--accent-gold)' }}>
                {role.substring(0, 1)}
              </div>
            </div>
          </header>
          
          <main className="p-3 p-md-4 flex-grow-1 overflow-auto">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation (Client Only) */}
        {role === 'CLIENT' && (
          <div className="d-md-none fixed-bottom d-flex justify-content-around align-items-center py-2 px-3 border-top border-warning border-opacity-25 shadow-lg" style={{ backgroundColor: 'rgba(18, 18, 18, 0.95)', backdropFilter: 'blur(10px)' }}>
            {links.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                className={`text-decoration-none d-flex flex-column align-items-center ${location.pathname === link.path ? 'text-gold' : 'text-muted'}`}
              >
                <span className="fs-4 mb-1">{link.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: location.pathname === link.path ? 'bold' : 'normal' }}>{link.label}</span>
              </Link>
            ))}
            <div onClick={handleLogout} className="text-muted text-decoration-none d-flex flex-column align-items-center" style={{ cursor: 'pointer' }}>
               <span className="fs-4 mb-1">🚪</span>
               <span style={{ fontSize: '10px' }}>Quitter</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
