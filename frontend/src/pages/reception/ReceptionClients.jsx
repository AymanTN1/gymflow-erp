import { apiFetch } from '../../utils/api';
import { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';

export default function ReceptionClients() {
  const [clients, setClients] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [activeTab, setActiveTab] = useState('list'); // list, new_client, new_membership, verify_email
  
  // Forms state
  const [newClient, setNewClient] = useState({ nomComplet: '', email: '', telephone: '', cin: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [cinFile, setCinFile] = useState(null);
  const [newMembership, setNewMembership] = useState({ clientId: '', typeAbonnement: '1 MOIS', prixPaye: '' });
  const [invoiceData, setInvoiceData] = useState(null);
  
  // Email verification state
  const [pendingClient, setPendingClient] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyMessage, setVerifyMessage] = useState(null);
  const [verifyError, setVerifyError] = useState(null);

  // Debt state
  const [debtClient, setDebtClient] = useState(null);
  const [debtAmount, setDebtAmount] = useState('');

  const fetchClients = async () => {
    try {
      const res = await apiFetch('http://localhost:8080/api/reception/clients');
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
      const res = await apiFetch('http://localhost:8080/api/reception/memberships');
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
      const res = await apiFetch('http://localhost:8080/api/reception/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      if (res.ok) {
        const savedClient = await res.json();
        
        // --- UPLOAD FILES si présents ---
        if (photoFile || cinFile) {
          const formData = new FormData();
          if (photoFile) formData.append('photo', photoFile);
          if (cinFile) formData.append('cin', cinFile);
          
          const userToken = JSON.parse(localStorage.getItem('gymflow_user'))?.token;
          await fetch(`http://localhost:8080/api/upload/client/${savedClient.id}`, {
            method: 'POST',
            headers: userToken ? { 'Authorization': `Bearer ${userToken}` } : {},
            body: formData
            // Pas de Content-Type manuel pour FormData, fetch met le bon boundary
          });
        }
        
        fetchClients();
        
        // Si le client a un email, passer à l'écran de vérification
        if (newClient.email && newClient.email.trim() !== '') {
          setPendingClient(savedClient);
          setVerificationCode('');
          setVerifyMessage(null);
          setVerifyError(null);
          setActiveTab('verify_email');
        } else {
          setActiveTab('list');
        }
        
        setNewClient({ nomComplet: '', email: '', telephone: '', cin: '' });
        setPhotoFile(null);
        setCinFile(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setVerifyMessage(null);
    setVerifyError(null);
    
    try {
      const res = await apiFetch(`http://localhost:8080/api/reception/clients/${pendingClient.id}/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode })
      });
      const data = await res.json();
      
      if (data.success) {
        setVerifyMessage('✅ ' + data.message);
        fetchClients();
        setTimeout(() => {
          setPendingClient(null);
          setActiveTab('list');
        }, 2000);
      } else {
        setVerifyError('❌ ' + data.message);
      }
    } catch (err) {
      setVerifyError('❌ Erreur de connexion au serveur.');
    }
  };

  const handleResendCode = async () => {
    setVerifyMessage(null);
    setVerifyError(null);
    try {
      const res = await apiFetch(`http://localhost:8080/api/reception/clients/${pendingClient.id}/resend-code`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setVerifyMessage('📧 Nouveau code envoyé !');
      } else {
        setVerifyError('Erreur lors du renvoi du code.');
      }
    } catch (err) {
      setVerifyError('Erreur de connexion.');
    }
  };

  const handleCreateMembership = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('http://localhost:8080/api/reception/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMembership)
      });
      if (res.ok) {
        const data = await res.json();
        fetchMemberships();
        
        const clientInfo = clients.find(c => c.id.toString() === newMembership.clientId.toString());
        
        setInvoiceData({
          membership: data,
          client: clientInfo,
          date: new Date().toLocaleDateString('fr-FR'),
          time: new Date().toLocaleTimeString('fr-FR'),
          emailSent: clientInfo?.email ? true : false
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

  const handlePayDebt = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`http://localhost:8080/api/reception/clients/${debtClient.id}/pay-debt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(debtAmount) })
      });
      if (res.ok) {
        setDebtClient(null);
        setDebtAmount('');
        fetchClients();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatutBadge = (client) => {
    if (client.statut === 'ACTIF') return 'bg-success';
    if (client.statut === 'EN_ATTENTE') return 'bg-warning text-dark';
    return 'bg-danger';
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
            onClick={() => { setActiveTab('new_membership'); setInvoiceData(null); }}
          >
            + Nouvel Abonnement
          </button>
        </div>
      </div>

      {/* ====== CLIENT LIST ====== */}
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
                      <th className="bg-transparent text-muted">Email</th>
                      <th className="bg-transparent text-muted">Dette</th>
                      <th className="bg-transparent text-muted">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.length === 0 ? (
                      <tr><td colSpan="5" className="text-center text-muted">Aucun client trouvé.</td></tr>
                    ) : (
                      clients.map(c => (
                        <tr key={c.id}>
                          <td>#{c.id}</td>
                          <td className="fw-bold d-flex align-items-center gap-2">
                            {c.photoUrl ? (
                              <img src={`http://localhost:8080${c.photoUrl}`} alt="Profile" className="rounded-circle border border-warning" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
                            ) : (
                              <div className="bg-secondary rounded-circle d-flex justify-content-center align-items-center text-white border border-secondary" style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                                {c.nomComplet.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {c.nomComplet}
                          </td>
                          <td>{c.telephone}</td>
                          <td>
                            {c.email ? (
                              <span className="d-flex align-items-center gap-1">
                                <span className="text-truncate" style={{ maxWidth: '150px' }}>{c.email}</span>
                                {c.emailVerified ? (
                                  <span className="badge bg-info" title="Email vérifié">✓</span>
                                ) : (
                                  <span 
                                    className="badge bg-warning text-dark" 
                                    style={{ cursor: 'pointer' }}
                                    title="Cliquer pour vérifier"
                                    onClick={() => {
                                      setPendingClient(c);
                                      setVerificationCode('');
                                      setVerifyMessage(null);
                                      setVerifyError(null);
                                      setActiveTab('verify_email');
                                    }}
                                  >⏳</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>
                            {c.soldeImpaye > 0 ? (
                              <button 
                                className="btn btn-sm btn-danger fw-bold"
                                onClick={() => { setDebtClient(c); setDebtAmount(c.soldeImpaye); }}
                                title="Enregistrer un paiement"
                              >
                                {c.soldeImpaye} DH
                              </button>
                            ) : (
                              <span className="text-muted">0 DH</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${getStatutBadge(c)}`}>
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

      {/* ====== NEW CLIENT FORM ====== */}
      {!invoiceData && activeTab === 'new_client' && (
        <div className="card-premium p-4 hide-on-print" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h4 className="text-gold mb-4">Inscription d'un Nouveau Client</h4>
          <form onSubmit={handleCreateClient}>
            <div className="mb-3">
              <label className="form-label text-muted">Nom Complet *</label>
              <input type="text" className="form-control form-control-dark" required
                value={newClient.nomComplet} onChange={(e) => setNewClient({...newClient, nomComplet: e.target.value})} />
            </div>
            <div className="mb-3">
              <label className="form-label text-muted">Email</label>
              <input type="email" className="form-control form-control-dark" 
                placeholder="Un code de vérification sera envoyé..."
                value={newClient.email} onChange={(e) => setNewClient({...newClient, email: e.target.value})} />
              <small className="text-muted">📧 Si renseigné, un code de vérification à 6 chiffres sera envoyé à cette adresse.</small>
            </div>
            <div className="mb-3">
              <label className="form-label text-muted">Téléphone *</label>
              <input type="text" className="form-control form-control-dark" required
                value={newClient.telephone} onChange={(e) => setNewClient({...newClient, telephone: e.target.value})} />
            </div>
            <div className="mb-4">
              <label className="form-label text-muted">CIN</label>
              <input type="text" className="form-control form-control-dark" 
                value={newClient.cin} onChange={(e) => setNewClient({...newClient, cin: e.target.value})} />
            </div>
            <div className="row mb-4">
              <div className="col-md-6 mb-3 mb-md-0">
                <label className="form-label text-muted">Photo de Profil (JPG/PNG)</label>
                <input type="file" className="form-control form-control-dark" accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files[0])} />
                <small className="text-muted">L'avatar officiel du membre.</small>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted">Scan CIN (JPG/PDF)</label>
                <input type="file" className="form-control form-control-dark" accept="image/*,.pdf"
                  onChange={(e) => setCinFile(e.target.files[0])} />
                <small className="text-muted">Document confidentiel.</small>
              </div>
            </div>
            <button type="submit" className="btn btn-gold w-100 py-2">Enregistrer le Client</button>
          </form>
        </div>
      )}

      {/* ====== EMAIL VERIFICATION SCREEN ====== */}
      {!invoiceData && activeTab === 'verify_email' && pendingClient && (
        <div className="card-premium p-5 hide-on-print" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div className="text-center mb-4">
            <div className="bg-warning rounded-circle d-inline-flex justify-content-center align-items-center mb-3" style={{ width: '70px', height: '70px' }}>
              <span className="fs-2">📧</span>
            </div>
            <h3 className="text-gold fw-bold">Vérification de l'Email</h3>
            <p className="text-muted">
              Un code à <strong>6 chiffres</strong> a été envoyé à<br/>
              <strong className="text-light">{pendingClient.email}</strong>
            </p>
            <p className="text-muted small">Demandez au client de vérifier sa boîte mail et de vous donner le code.</p>
          </div>

          <form onSubmit={handleVerifyCode}>
            <div className="mb-4">
              <input
                type="text"
                className="form-control form-control-dark text-center"
                style={{ fontSize: '28px', letterSpacing: '12px', fontWeight: 'bold', padding: '15px' }}
                maxLength="6"
                placeholder="● ● ● ● ● ●"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoFocus
              />
            </div>

            {verifyMessage && (
              <div className="alert alert-success text-center py-2 mb-3">{verifyMessage}</div>
            )}
            {verifyError && (
              <div className="alert alert-danger text-center py-2 mb-3">{verifyError}</div>
            )}

            <button type="submit" className="btn btn-gold w-100 py-2 mb-2 fw-bold" disabled={verificationCode.length !== 6}>
              Vérifier le Code
            </button>
          </form>

          <div className="d-flex justify-content-between mt-3">
            <button className="btn btn-outline-warning btn-sm" onClick={handleResendCode}>
              🔄 Renvoyer le code
            </button>
            <button className="btn btn-outline-light btn-sm" onClick={() => { setPendingClient(null); setActiveTab('list'); }}>
              Passer cette étape →
            </button>
          </div>
        </div>
      )}

      {/* ====== NEW MEMBERSHIP FORM ====== */}
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

      {/* ====== SUCCESS & INVOICE SCREEN ====== */}
      {invoiceData && (
        <>
          <div className="card-premium p-5 text-center hide-on-print" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="mb-4">
              <div className="bg-success rounded-circle d-inline-flex justify-content-center align-items-center mb-3" style={{ width: '80px', height: '80px' }}>
                <span className="fs-1 text-white">✓</span>
              </div>
              <h3 className="text-success fw-bold">Paiement Validé !</h3>
              <p className="text-muted">L'abonnement de {invoiceData.client?.nomComplet} est activé jusqu'au {new Date(invoiceData.membership.dateFin).toLocaleDateString()}.</p>
              {invoiceData.emailSent && (
                <div className="alert alert-info py-2 mt-2">
                  📧 La facture a été envoyée automatiquement par email à <strong>{invoiceData.client?.email}</strong>
                </div>
              )}
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

      {/* ====== DEBT MODAL ====== */}
      {debtClient && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content card-premium border-danger">
              <div className="modal-header border-danger border-opacity-25">
                <h5 className="modal-title text-danger fw-bold">Règlement de Dette</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setDebtClient(null)}></button>
              </div>
              <form onSubmit={handlePayDebt}>
                <div className="modal-body">
                  <p className="text-white">Client : <strong>{debtClient.nomComplet}</strong></p>
                  <p className="text-danger fw-bold fs-5">Reste à payer : {debtClient.soldeImpaye} DH</p>
                  
                  <div className="mb-3 mt-4">
                    <label className="form-label text-muted">Montant à régler (DH)</label>
                    <input 
                      type="number" 
                      className="form-control form-control-dark" 
                      value={debtAmount}
                      onChange={(e) => setDebtAmount(e.target.value)}
                      max={debtClient.soldeImpaye}
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-danger border-opacity-25">
                  <button type="button" className="btn btn-outline-light" onClick={() => setDebtClient(null)}>Annuler</button>
                  <button type="submit" className="btn btn-danger">Valider le paiement</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </ErpLayout>
  );
}
