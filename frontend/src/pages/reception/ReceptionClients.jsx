import { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';

export default function ReceptionClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    motDePasse: '123456', // Default simple pass for clients
    role: 'CLIENT'
  });
  const [message, setMessage] = useState('');

  // Fetch clients from Spring Boot Backend
  const fetchClients = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/users?role=CLIENT');
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
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
        setMessage('Client inscrit avec succès !');
        setFormData({ nom: '', email: '', motDePasse: '123456', role: 'CLIENT' });
        fetchClients(); // Refresh the list
      } else {
        setMessage('Erreur lors de l\'inscription.');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('Erreur de connexion au serveur.');
    }
  };

  return (
    <ErpLayout role="RECEPTION">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Gestion des Clients</h2>
      </div>

      <div className="row g-4 mb-4">
        {/* Formulaire d'inscription */}
        <div className="col-12 col-lg-4">
          <div className="card card-premium p-4 h-100">
            <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Nouvelle Inscription</h4>
            
            {message && <div className="alert alert-info py-2">{message}</div>}

            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label text-muted small mb-1">Nom Complet du Client</label>
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
              
              <button type="submit" className="btn btn-gold mt-3 w-100 fw-bold">Inscrire et Générer QR Code</button>
            </form>
          </div>
        </div>

        {/* Liste des clients */}
        <div className="col-12 col-lg-8">
          <div className="card card-premium p-4 h-100">
            <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Base de Données Clients</h4>
            
            {loading ? (
              <div className="text-center p-5 text-muted">Chargement...</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                  <thead>
                    <tr className="border-bottom border-warning border-opacity-50">
                      <th className="bg-transparent text-muted">Nom</th>
                      <th className="bg-transparent text-muted">Email</th>
                      <th className="bg-transparent text-muted">Statut</th>
                      <th className="bg-transparent text-muted text-end">Date Inscription</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.length === 0 ? (
                      <tr><td colSpan="4" className="bg-transparent text-center text-muted py-4">Aucun client trouvé.</td></tr>
                    ) : (
                      clients.map(client => (
                        <tr key={client.id}>
                          <td className="bg-transparent fw-bold">{client.nom}</td>
                          <td className="bg-transparent">{client.email}</td>
                          <td className="bg-transparent">
                            <span className="badge bg-success bg-opacity-25 text-success border border-success">Actif</span>
                          </td>
                          <td className="bg-transparent text-end text-muted small">
                            {new Date(client.dateCreation).toLocaleDateString()}
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
