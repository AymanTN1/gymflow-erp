import { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';

export default function ReceptionClients() {
  const [clients, setClients] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [activeTab, setActiveTab] = useState('list'); // list, new_client, new_membership
  
  // Forms state
  const [newClient, setNewClient] = useState({ nomComplet: '', email: '', telephone: '', cin: '' });
  const [newMembership, setNewMembership] = useState({ clientId: '', typeAbonnement: '1 MOIS', prixPaye: '' });

  const fetchClients = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/reception/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error("Erreur de récupération des clients", err);
    }
  };

  const fetchMemberships = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/reception/memberships');
      if (res.ok) {
        const data = await res.json();
        setMemberships(data);
      }
    } catch (err) {
      console.error("Erreur de récupération des abonnements", err);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchMemberships();
  }, []);

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8080/api/reception/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      if (res.ok) {
        fetchClients();
        setNewClient({ nomComplet: '', email: '', telephone: '', cin: '' });
        setActiveTab('list');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMembership = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8080/api/reception/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMembership)
      });
      if (res.ok) {
        fetchMemberships();
        setNewMembership({ clientId: '', typeAbonnement: '1 MOIS', prixPaye: '' });
        setActiveTab('list');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ErpLayout role="RECEPTION">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Gestion des Clients & Abonnements</h2>
        <div>
          <button 
            className={`btn me-2 ${activeTab === 'list' ? 'btn-gold' : 'btn-outline-light'}`}
            onClick={() => setActiveTab('list')}
          >
            Liste des Clients
          </button>
          <button 
            className={`btn me-2 ${activeTab === 'new_client' ? 'btn-gold' : 'btn-outline-light'}`}
            onClick={() => setActiveTab('new_client')}
          >
            + Nouveau Client
          </button>
          <button 
            className={`btn ${activeTab === 'new_membership' ? 'btn-gold' : 'btn-outline-light'}`}
            onClick={() => setActiveTab('new_membership')}
          >
            + Nouvel Abonnement
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="row">
          <div className="col-md-8">
            <div className="card-premium p-4 h-100">
              <h5 className="text-gold mb-4">Base de Données Clients</h5>
              <div className="table-responsive">
                <table className="table table-dark table-hover mb-0">
                  <thead>
                    <tr>
                      <th className="bg-transparent text-muted">ID</th>
                      <th className="bg-transparent text-muted">Nom Complet</th>
                      <th className="bg-transparent text-muted">Téléphone</th>
                      <th className="bg-transparent text-muted">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.length === 0 ? (
                      <tr><td colSpan="4" className="text-center text-muted">Aucun client trouvé.</td></tr>
                    ) : (
                      clients.map(c => (
                        <tr key={c.id}>
                          <td>#{c.id}</td>
                          <td className="fw-bold">{c.nomComplet}</td>
                          <td>{c.telephone}</td>
                          <td>
                            <span className={`badge ${c.statut === 'ACTIF' ? 'bg-success' : 'bg-danger'}`}>
                              {c.statut}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card-premium p-4 h-100">
              <h5 className="text-gold mb-4">Abonnements Récents</h5>
              <div className="d-flex flex-column gap-3">
                {memberships.length === 0 ? (
                  <p className="text-muted">Aucun abonnement.</p>
                ) : (
                  memberships.slice().reverse().slice(0, 5).map(m => (
                    <div key={m.id} className="p-3 border border-warning border-opacity-25 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="d-flex justify-content-between">
                        <span className="fw-bold">Client #{m.clientId}</span>
                        <span className="badge bg-gold text-dark">{m.typeAbonnement}</span>
                      </div>
                      <div className="text-muted small mt-2">
                        Payé: {m.prixPaye} DH | Fin: {new Date(m.dateFin).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'new_client' && (
        <div className="card-premium p-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h4 className="text-gold mb-4">Inscription d'un Nouveau Client</h4>
          <form onSubmit={handleCreateClient}>
            <div className="mb-3">
              <label className="form-label text-muted">Nom Complet</label>
              <input type="text" className="form-control form-control-dark" required
                value={newClient.nomComplet} onChange={(e) => setNewClient({...newClient, nomComplet: e.target.value})} />
            </div>
            <div className="mb-3">
              <label className="form-label text-muted">Email</label>
              <input type="email" className="form-control form-control-dark" 
                value={newClient.email} onChange={(e) => setNewClient({...newClient, email: e.target.value})} />
            </div>
            <div className="mb-3">
              <label className="form-label text-muted">Téléphone</label>
              <input type="text" className="form-control form-control-dark" required
                value={newClient.telephone} onChange={(e) => setNewClient({...newClient, telephone: e.target.value})} />
            </div>
            <div className="mb-4">
              <label className="form-label text-muted">CIN</label>
              <input type="text" className="form-control form-control-dark" 
                value={newClient.cin} onChange={(e) => setNewClient({...newClient, cin: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-gold w-100 py-2">Enregistrer le Client</button>
          </form>
        </div>
      )}

      {activeTab === 'new_membership' && (
        <div className="card-premium p-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h4 className="text-gold mb-4">Créer un Abonnement (Paiement)</h4>
          <form onSubmit={handleCreateMembership}>
            <div className="mb-3">
              <label className="form-label text-muted">Sélectionner le Client</label>
              <select className="form-select form-control-dark" required
                value={newMembership.clientId} onChange={(e) => setNewMembership({...newMembership, clientId: e.target.value})}>
                <option value="">Choisir un client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nomComplet} - {c.telephone}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label text-muted">Type d'Abonnement</label>
              <select className="form-select form-control-dark" required
                value={newMembership.typeAbonnement} onChange={(e) => setNewMembership({...newMembership, typeAbonnement: e.target.value})}>
                <option value="1 MOIS">1 Mois</option>
                <option value="3 MOIS">3 Mois</option>
                <option value="1 AN">1 An</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="form-label text-muted">Montant Payé (DH)</label>
              <input type="number" className="form-control form-control-dark" required
                value={newMembership.prixPaye} onChange={(e) => setNewMembership({...newMembership, prixPaye: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-gold w-100 py-2">Valider le Paiement</button>
          </form>
        </div>
      )}
    </ErpLayout>
  );
}
