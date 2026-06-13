import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function ErpLayout({ children, role }) {
  const location = useLocation();
  const navigate = useNavigate();

  const getLinks = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { path: '/admin', label: 'Dashboard MRR', icon: '📊' },
          { path: '/admin/finances', label: 'Grand Livre', icon: '💰' },
          { path: '/admin/rh', label: 'Ressources Humaines', icon: '👥' },
          { path: '/admin/crm', label: 'Win-Back CRM', icon: '🎯' },
        ];
      case 'RECEPTION':
        return [
          { path: '/reception', label: 'Pointage QR', icon: '📷' },
          { path: '/reception/pos', label: 'Point de Vente', icon: '💳' },
          { path: '/reception/invoices', label: 'Facturation', icon: '📄' },
          { path: '/reception/debts', label: 'Gestion Dettes', icon: '⚠️' },
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
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <>
      <div className="tech-grid-bg"></div>
      <div className="d-flex min-vh-100">
        {/* Sidebar */}
        <div className="card-premium border-0 border-end border-warning border-opacity-25 p-3 d-flex flex-column" style={{ width: '280px', borderRadius: '0' }}>
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
          
          <button onClick={handleLogout} className="btn btn-outline-light w-100 text-start d-flex align-items-center gap-2">
            <span>🚪</span> Déconnexion
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 d-flex flex-column">
          <header className="p-3 border-bottom border-warning border-opacity-25 d-flex justify-content-end align-items-center" style={{ backgroundColor: 'rgba(13, 13, 13, 0.8)', backdropFilter: 'blur(10px)' }}>
            <div className="d-flex align-items-center gap-3">
              <span className="text-muted small">Status: <span className="text-success">Connecté</span></span>
              <div className="bg-gold rounded-circle d-flex justify-content-center align-items-center fw-bold text-dark" style={{ width: '40px', height: '40px', backgroundColor: 'var(--accent-gold)' }}>
                {role.substring(0, 1)}
              </div>
            </div>
          </header>
          
          <main className="p-4 flex-grow-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
