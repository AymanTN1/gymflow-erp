import { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';

export default function AdminRh() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    motDePasse: '',
    role: 'COACH' // Default role
  });
  const [message, setMessage] = useState('');

  // Fetch users from Spring Boot Backend
  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/users');
      if (response.ok) {
        const data = await response.json();
        // Filter out CLIENTS for the HR view (only staff)
        setUsers(data.filter(u => u.role !== 'CLIENT'));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await fetch('http://localhost:8080/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage('Collaborateur ajouté avec succès !');
        setFormData({ nom: '', email: '', motDePasse: '', role: 'COACH' });
        fetchUsers(); // Refresh the list
      } else {
        setMessage('Erreur lors de l\'ajout.');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('Erreur de connexion au serveur.');
    }
  };

  return (
    <ErpLayout role="ADMIN">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Ressources Humaines (Staff)</h2>
      </div>

      <div className="row g-4 mb-4">
        {/* Formulaire de création */}
        <div className="col-12 col-lg-4">
          <div className="card card-premium p-4 h-100">
            <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Nouveau Collaborateur</h4>
            
            {message && <div className="alert alert-info py-2">{message}</div>}

            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label text-muted small mb-1">Nom Complet</label>
                <input 
                  type="text" 
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className="form-control form-control-dark" 
                  required 
                />
              </div>
              <div>
                <label className="form-label text-muted small mb-1">Email / Identifiant</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control form-control-dark" 
                  required 
                />
              </div>
              <div>
                <label className="form-label text-muted small mb-1">Mot de Passe Provisoire</label>
                <input 
                  type="password" 
                  name="motDePasse"
                  value={formData.motDePasse}
                  onChange={handleChange}
                  className="form-control form-control-dark" 
                  required 
                />
              </div>
              <div>
                <label className="form-label text-muted small mb-1">Rôle</label>
                <select 
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-select form-control-dark"
                >
                  <option value="COACH">Coach Sportif</option>
                  <option value="RECEPTION">Réceptionniste</option>
                  <option value="SUPER_ADMIN">Administrateur</option>
                </select>
              </div>
              
              <button type="submit" className="btn btn-gold mt-3 w-100 fw-bold">Créer le Compte</button>
            </form>
          </div>
        </div>

        {/* Liste du staff */}
        <div className="col-12 col-lg-8">
          <div className="card card-premium p-4 h-100">
            <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Équipe Actuelle</h4>
            
            {loading ? (
              <div className="text-center p-5 text-muted">Chargement...</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                  <thead>
                    <tr className="border-bottom border-warning border-opacity-50">
                      <th className="bg-transparent text-muted">Nom</th>
                      <th className="bg-transparent text-muted">Email</th>
                      <th className="bg-transparent text-muted">Rôle</th>
                      <th className="bg-transparent text-muted text-end">Date Création</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan="4" className="bg-transparent text-center text-muted py-4">Aucun collaborateur trouvé.</td></tr>
                    ) : (
                      users.map(user => (
                        <tr key={user.id}>
                          <td className="bg-transparent fw-bold">{user.nom}</td>
                          <td className="bg-transparent">{user.email}</td>
                          <td className="bg-transparent">
                            <span className={`badge ${user.role === 'SUPER_ADMIN' ? 'bg-danger' : user.role === 'COACH' ? 'bg-primary' : 'bg-warning text-dark'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="bg-transparent text-end text-muted small">
                            {new Date(user.dateCreation).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErpLayout>
  );
}
