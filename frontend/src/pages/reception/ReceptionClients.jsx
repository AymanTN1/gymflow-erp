import { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';

export default function ReceptionClients() {
  const [clients, setClients] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [activeTab, setActiveTab] = useState('list'); // list, new_client, new_membership
  
  // Forms state
  const [newClient, setNewClient] = useState({ nomComplet: '', email: '', telephone: '', cin: '' });
  const [newMembership, setNewMembership] = useState({ clientId: '', typeAbonnement: '1 MOIS', prixPaye: '' });
  const [invoiceData, setInvoiceData] = useState(null);

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
        const data = await res.json();
        fetchMemberships();
        
        // Trouver les infos du client pour la facture
        const clientInfo = clients.find(c => c.id.toString() === newMembership.clientId.toString());
        
        setInvoiceData({
          membership: data,
          client: clientInfo,
          date: new Date().toLocaleDateString('fr-FR'),
          time: new Date().toLocaleTimeString('fr-FR')
        });
        
        setNewMembership({ clientId: '', typeAbonnement: '1 MOIS', prixPaye: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewSale = () => {
    setInvoiceData(null);
    setActiveTab('list');
  };

  return (
    <ErpLayout role="RECEPTION">
      <div className="d-flex justify-content-between align-items-center mb-4 hide-on-print">
        <h2 className="fw-bold mb-0">Gestion des Clients & Abonnements</h2>
        <div>
          <button 
            className={`btn me-2 ${activeTab === 'list' && !invoiceData ? 'btn-gold' : 'btn-outline-light'}`}
            onClick={() => { setActiveTab('list'); setInvoiceData(null); }}
          >
            Liste des Clients
          </button>
          <button 
            className={`btn me-2 ${activeTab === 'new_client' ? 'btn-gold' : 'btn-outline-light'}`}
            onClick={() => { setActiveTab('new_client'); setInvoiceData(null); }}
          >
            + Nouveau Client
          </button>
          <button 
            className={`btn ${(activeTab === 'new_membership' || invoiceData) ? 'btn-gold' : 'btn-outline-light'}`}
            onClick={() => setActiveTab('new_membership')}
          >
            + Nouvel Abonnement
          </button>
        </div>
      </div>

      {!invoiceData && activeTab === 'list' && (
        <div className="row hide-on-print">
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
                  memberships.slice().reverse().slice(0, 5).map(m => {
                    const clientName = clients.find(c => c.id === m.clientId)?.nomComplet || `Client #${m.clientId}`;
                    return (
                      <div key={m.id} className="p-3 border border-warning border-opacity-25 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                        <div className="d-flex justify-content-between">
                          <span className="fw-bold text-truncate" style={{ maxWidth: '150px' }}>{clientName}</span>
                          <span className="badge bg-gold text-dark">{m.typeAbonnement}</span>
                        </div>
                        <div className="text-muted small mt-2">
                          Payé: {m.prixPaye} DH | Fin: {new Date(m.dateFin).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!invoiceData && activeTab === 'new_client' && (
        <div className="card-premium p-4 hide-on-print" style={{ maxWidth: '600px', margin: '0 auto' }}>
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

      {!invoiceData && activeTab === 'new_membership' && (
        <div className="card-premium p-4 hide-on-print" style={{ maxWidth: '600px', margin: '0 auto' }}>
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

      {/* SUCCESS & INVOICE SCREEN */}
      {invoiceData && (
        <>
          {/* UI view for receptionist (Hidden during print) */}
          <div className="card-premium p-5 text-center hide-on-print" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="mb-4">
              <div className="bg-success rounded-circle d-inline-flex justify-content-center align-items-center mb-3" style={{ width: '80px', height: '80px' }}>
                <span className="fs-1 text-white">✓</span>
              </div>
              <h3 className="text-success fw-bold">Paiement Validé !</h3>
              <p className="text-muted">L'abonnement de {invoiceData.client?.nomComplet} est activé jusqu'au {new Date(invoiceData.membership.dateFin).toLocaleDateString()}.</p>
            </div>
            
            <div className="d-flex flex-column gap-3">
              <button onClick={handlePrint} className="btn btn-gold w-100 py-3 fw-bold fs-5 d-flex justify-content-center align-items-center gap-2">
                <span>🖨️</span> Télécharger / Imprimer la Facture
              </button>
              <button onClick={handleNewSale} className="btn btn-outline-light w-100 py-2">
                Retour à la liste
              </button>
            </div>
          </div>

          {/* Printable Invoice (Hidden on screen, visible only on print) */}
          <div className="print-only" style={{ background: 'white', color: 'black', padding: '40px', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '30px' }}>
              <div>
                <h1 style={{ margin: 0, fontWeight: 'bold' }}>GymFlow</h1>
                <p style={{ margin: '5px 0 0 0', color: '#666' }}>123 Avenue du Sport, Casablanca</p>
                <p style={{ margin: '0', color: '#666' }}>Tél : 05 22 00 00 00</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0, color: '#333' }}>FACTURE</h2>
                <p style={{ margin: '5px 0 0 0' }}><strong>N° :</strong> FAC-{invoiceData.membership.id}-{new Date().getFullYear()}</p>
                <p style={{ margin: '0' }}><strong>Date :</strong> {invoiceData.date} à {invoiceData.time}</p>
              </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>Facturé à :</h4>
              <p style={{ margin: '5px 0', fontSize: '18px', fontWeight: 'bold' }}>{invoiceData.client?.nomComplet}</p>
              <p style={{ margin: '0' }}>Téléphone : {invoiceData.client?.telephone}</p>
              {invoiceData.client?.cin && <p style={{ margin: '0' }}>CIN : {invoiceData.client.cin}</p>}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #000' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Date d'Expiration</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Montant Total (TTC)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px 12px' }}>Abonnement Fitness - {invoiceData.membership.typeAbonnement}</td>
                  <td style={{ padding: '15px 12px', textAlign: 'center' }}>{new Date(invoiceData.membership.dateFin).toLocaleDateString()}</td>
                  <td style={{ padding: '15px 12px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>{invoiceData.membership.prixPaye} DH</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '50px' }}>
              <div style={{ width: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                  <span>Sous-total</span>
                  <span>{invoiceData.membership.prixPaye} DH</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '2px solid #000', fontWeight: 'bold', fontSize: '18px' }}>
                  <span>TOTAL PAYÉ</span>
                  <span>{invoiceData.membership.prixPaye} DH</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', color: '#666', borderTop: '1px solid #ccc', paddingTop: '20px', fontSize: '12px' }}>
              <p style={{ margin: '0' }}>Merci de votre confiance !</p>
              <p style={{ margin: '5px 0' }}>Ce document tient lieu de justificatif de paiement.</p>
            </div>
          </div>
        </>
      )}
    </ErpLayout>
  );
}
