import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        // Redirection basée sur le rôle fictif du scaffolding
        navigate(data.redirect);
      } else {
        setError(data.message || 'Erreur de connexion');
      }
    } catch (err) {
      setError('Impossible de joindre le serveur.');
    }
  };

  return (
    <>
      <div className="tech-grid-bg"></div>
      <div className="container min-vh-100 d-flex align-items-center justify-content-center">
        <div className="row w-100 justify-content-center">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card card-premium p-4">
              <div className="card-header text-center border-0 mb-3">
                <h2 className="fw-bold mb-1"><span className="text-gold">GymFlow</span> ERP</h2>
                <p className="text-muted small mb-0">Happy Fitness Club - Portail Sécurisé</p>
              </div>
              <div className="card-body">
                {error && <div className="alert alert-danger py-2">{error}</div>}
                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label className="form-label small text-muted text-uppercase fw-bold">Adresse Email</label>
                    <input 
                      type="email" 
                      className="form-control form-control-dark" 
                      placeholder="Identifiant"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label small text-muted text-uppercase fw-bold">Mot de passe</label>
                    <input 
                      type="password" 
                      className="form-control form-control-dark" 
                      placeholder="***"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                  <button type="submit" className="btn btn-gold w-100 py-2 text-uppercase letter-spacing-1">
                    Accéder au Portail
                  </button>
                </form>
              </div>
              <div className="card-footer text-center border-0 mt-3">
                <p className="small text-muted mb-0">Besoin d'aide ? Contactez le Super-Admin.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
