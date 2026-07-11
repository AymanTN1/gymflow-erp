import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const result = await login(email, password);
    if (!result.success) {
      setError(result.message);
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
                    <div className="d-flex justify-content-between">
                      <label className="form-label small text-muted text-uppercase fw-bold">Mot de passe</label>
                    </div>
                    <div className="input-group">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className="form-control form-control-dark border-end-0" 
                        placeholder="***"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                      />
                      <button 
                        type="button" 
                        className="input-group-text bg-transparent border-start-0 text-muted form-control-dark"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ cursor: 'pointer' }}
                      >
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-gold w-100 py-2 text-uppercase letter-spacing-1">
                    Accéder au Portail
                  </button>
                </form>
              </div>
              <div className="card-footer text-center border-0 mt-3 pt-3 border-top border-secondary border-opacity-25">
                <p className="small text-muted mb-3 fw-bold text-uppercase">Accès Démo (Portfolio)</p>
                <div className="d-flex flex-wrap justify-content-center gap-2 mb-2">
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => { setEmail('admin@happyfitness.ma'); setPassword('admin123'); }}>Admin</button>
                  <button type="button" className="btn btn-sm btn-outline-info" onClick={() => { setEmail('sara@happyfitness.ma'); setPassword('rec123'); }}>Réception</button>
                  <button type="button" className="btn btn-sm btn-outline-warning" onClick={() => { setEmail('youssef@happyfitness.ma'); setPassword('coach123'); }}>Coach</button>
                </div>
                <p className="text-muted" style={{ fontSize: '11px' }}>
                  Cliquez sur un rôle puis sur "Accéder au Portail".
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
