import { apiFetch } from '../../utils/api';
import { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';

export default function ReceptionDashboard() {
  const [scanStatus, setScanStatus] = useState(null);
  const [activeCount, setActiveCount] = useState(0);
  const [staffChecked, setStaffChecked] = useState(null); // { type, timestamp }
  const [checkMessage, setCheckMessage] = useState(null);
  const STAFF_USER_ID = 2; // Simule l'ID du réceptionniste connecté

  // --- PASS JOURNÉE ---
  const [showDayPassModal, setShowDayPassModal] = useState(false);
  const [dayPassForm, setDayPassForm] = useState({ clientName: '', telephone: '', prix: '' });
  const [dayPassMessage, setDayPassMessage] = useState(null);
  const [dayPassLoading, setDayPassLoading] = useState(false);
  const [todayPasses, setTodayPasses] = useState([]);

  // --- PANIER POS ---
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [posMessage, setPosMessage] = useState(null);
  const [posLoading, setPosLoading] = useState(false);

  const fetchProducts = () => {
    apiFetch('http://localhost:8080/api/pos/products')
      .then(res => res.json())
      .then(data => setProducts(data || []))
      .catch(() => {});
  };

  const handleAddByName = (name) => {
    const product = products.find(p => p.nom.toLowerCase() === name.toLowerCase());
    if (!product) {
      alert(`Le produit "${name}" n'est pas encore enregistré ou configuré dans la boutique.`);
      return;
    }
    
    // Vérifier les stocks
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.quantite >= product.stockActuel) {
        alert(`Stock insuffisant pour ${product.nom} (${product.stockActuel} disponibles).`);
        return;
      }
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantite: item.quantite + 1 } : item));
    } else {
      if (product.stockActuel < 1) {
        alert(`Le produit ${product.nom} est en rupture de stock.`);
        return;
      }
      setCart([...cart, { product, quantite: 1 }]);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.prixVente * item.quantite, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setPosLoading(true);
    setPosMessage(null);
    let successCount = 0;

    for (const item of cart) {
      try {
        const res = await apiFetch('http://localhost:8080/api/pos/sell', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: item.product.id,
            quantite: item.quantite,
            vendeur: 'Réception'
          })
        });
        const data = await res.json();
        if (data.success) {
          successCount++;
        } else {
          setPosMessage({ type: 'danger', text: `Erreur pour ${item.product.nom}: ${data.message}` });
          setPosLoading(false);
          return;
        }
      } catch (err) {
        setPosMessage({ type: 'danger', text: 'Erreur de connexion lors de la vente.' });
        setPosLoading(false);
        return;
      }
    }

    if (successCount === cart.length) {
      setPosMessage({ type: 'success', text: `✅ Vente enregistrée avec succès (${cartTotal.toFixed(2)} DH) !` });
      setCart([]);
      fetchProducts(); // Rafraîchir les stocks
      setTimeout(() => {
        setShowCartModal(false);
        setPosMessage(null);
      }, 2000);
    }
    setPosLoading(false);
  };

  const fetchTodayPasses = () => {
    apiFetch('http://localhost:8080/api/pos/day-pass/today')
      .then(r => r.json())
      .then(data => setTodayPasses(data.passes || []))
      .catch(() => {});
  };

  useEffect(() => { 
    fetchTodayPasses(); 
    fetchProducts();
  }, []);

  const handleDayPassSubmit = async (e) => {
    e.preventDefault();
    if (!dayPassForm.clientName.trim() || !dayPassForm.prix) return;
    setDayPassLoading(true);
    try {
      const res = await apiFetch('http://localhost:8080/api/pos/day-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dayPassForm)
      });
      const data = await res.json();
      if (data.success) {
        setDayPassMessage({ type: 'success', text: data.message });
        setDayPassForm({ clientName: '', telephone: '', prix: '' });
        fetchTodayPasses();
        setTimeout(() => { setShowDayPassModal(false); setDayPassMessage(null); }, 2500);
      } else {
        setDayPassMessage({ type: 'danger', text: data.message });
      }
    } catch {
      setDayPassMessage({ type: 'danger', text: 'Erreur de connexion au serveur.' });
    } finally {
      setDayPassLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch for count
    apiFetch('http://localhost:8080/api/checkin/active-count')
      .then(res => res.json())
      .then(data => setActiveCount(data.count))
      .catch(err => console.error("Erreur fetch count:", err));

    // Connexion SSE au Backend
    const eventSource = new EventSource('http://localhost:8080/api/checkin/stream');
    
    eventSource.addEventListener('scanEvent', (event) => {
      const data = JSON.parse(event.data);
      setScanStatus({
        status: data.status,
        message: data.message,
        clientName: data.clientName
      });
      setTimeout(() => setScanStatus(null), 5000);
    });

    eventSource.addEventListener('countUpdate', (event) => {
      const data = JSON.parse(event.data);
      setActiveCount(data.count);
    });

    eventSource.onerror = (error) => {
      console.error("Erreur SSE :", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Vérifier le pointage du jour
  useEffect(() => {
    apiFetch(`http://localhost:8080/api/rh/attendance/user/${STAFF_USER_ID}`)
      .then(r => r.json())
      .then(data => {
        const today = new Date().toISOString().split('T')[0];
        const todayEntries = data.filter(a => a.date === today);
        if (todayEntries.length > 0) {
          const last = todayEntries[todayEntries.length - 1];
          setStaffChecked({ type: last.type, timestamp: last.timestamp });
        }
      }).catch(() => {});
  }, []);

  const handleStaffCheckin = async (type) => {
    try {
      const res = await apiFetch('http://localhost:8080/api/rh/attendance/checkin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: STAFF_USER_ID, type })
      });
      const data = await res.json();
      if (data.success) {
        setStaffChecked({ type, timestamp: data.timestamp });
        setCheckMessage({ type: 'success', text: data.message });
        setTimeout(() => setCheckMessage(null), 4000);
      }
    } catch (err) { setCheckMessage({ type: 'danger', text: 'Erreur de connexion.' }); }
  };

  return (
    <ErpLayout role="RECEPTION">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-4">
          <h2 className="fw-bold mb-0">Accueil & Pointage</h2>
          <div className="badge bg-success bg-opacity-25 text-success border border-success p-2 px-3 fs-6 rounded-pill">
            <span className="me-2">🟢</span> {activeCount} Personnes en salle
          </div>
        </div>
        <button className="btn btn-gold px-4 py-2">Nouvelle Inscription</button>
      </div>

      {/* WIDGET POINTAGE STAFF */}
      <div className="card-premium p-3 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
        <div className="d-flex align-items-center gap-3">
          <span className="fs-3">⏰</span>
          <div>
            <div className="fw-bold">Pointage du Staff</div>
            {staffChecked ? (
              <span className="text-muted small">
                Dernier pointage : <span className={staffChecked.type === 'IN' ? 'text-success' : 'text-danger'}>
                  {staffChecked.type === 'IN' ? '🟢 Arrivée' : '🔴 Départ'}
                </span> à {new Date(staffChecked.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : (
              <span className="text-warning small">Vous n'avez pas encore pointé aujourd'hui.</span>
            )}
          </div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-success px-4 d-flex align-items-center gap-2"
            onClick={() => handleStaffCheckin('IN')}>
            🟢 Arrivée
          </button>
          <button className="btn btn-outline-danger px-4 d-flex align-items-center gap-2"
            onClick={() => handleStaffCheckin('OUT')}>
            🔴 Départ
          </button>
        </div>
      </div>
      {checkMessage && <div className={`alert alert-${checkMessage.type} py-2 mb-3`}>{checkMessage.text}</div>}

      <div className="row g-4 mb-4">
        {/* Module Pointage Réel (SSE) */}
        <div className="col-12 col-lg-5">
          <div className="card card-premium p-4 h-100 text-center border-warning border-opacity-50" style={{ boxShadow: scanStatus ? `0 0 30px var(--bs-${scanStatus.status.toLowerCase()})` : 'none', transition: 'box-shadow 0.3s' }}>
            <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Scanner QR Code Fixe</h4>
            
            <div className="d-flex justify-content-center align-items-center mb-4">
              <div 
                className="bg-white rounded d-flex flex-column align-items-center justify-content-center p-2"
                style={{ width: '200px', height: '200px' }}
              >
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=GYMFLOW-DESK-01`} alt="QR Code Réception" className="w-100 h-100"/>
              </div>
            </div>
            
            <p className="text-muted small">QR Code fixe posé sur le comptoir.<br/>Le client le scanne avec son téléphone.</p>

            {scanStatus ? (
              <div className={`alert mt-4 mb-0 fw-bold bg-${scanStatus.status.toLowerCase()} bg-opacity-25 border-${scanStatus.status.toLowerCase()} text-${scanStatus.status.toLowerCase() === 'warning' ? 'warning' : scanStatus.status.toLowerCase() === 'danger' ? 'danger' : 'success'}`}>
                <h5 className="mb-1">{scanStatus.clientName}</h5>
                {scanStatus.status === 'SUCCESS' && `✅ ${scanStatus.message}`}
                {scanStatus.status === 'WARNING' && `⚠️ ${scanStatus.message}`}
                {scanStatus.status === 'DANGER' && `❌ ${scanStatus.message}`}
              </div>
            ) : (
              <div className="alert mt-4 mb-0 bg-dark border-secondary text-muted">
                En attente d'un scan client...
              </div>
            )}
          </div>
        </div>

        {/* Accès Rapides Caisse */}
        <div className="col-12 col-lg-7">
          <div className="card card-premium p-4 h-100">
            <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Point de Vente (POS)</h4>
            
            <div className="row g-3">
              <div className="col-6 col-md-4">
                <button className="btn btn-outline-light w-100 h-100 p-3 d-flex flex-column align-items-center justify-content-center gap-2"
                  onClick={() => setShowDayPassModal(true)}>
                  <span className="fs-3">🎫</span>
                  <span className="small">Pass Journée</span>
                </button>
              </div>
              <div className="col-6 col-md-4">
                <button className="btn btn-outline-light w-100 h-100 p-3 d-flex flex-column align-items-center justify-content-center gap-2"
                  onClick={() => handleAddByName('Eau Bouteille')}>
                  <span className="fs-3">💧</span>
                  <span className="small">Eau Bouteille</span>
                </button>
              </div>
              <div className="col-6 col-md-4">
                <button className="btn btn-outline-light w-100 h-100 p-3 d-flex flex-column align-items-center justify-content-center gap-2"
                  onClick={() => handleAddByName('Protéine')}>
                  <span className="fs-3">🥤</span>
                  <span className="small">Protéine</span>
                </button>
              </div>
              <div className="col-6 col-md-4">
                <button className="btn btn-outline-light w-100 h-100 p-3 d-flex flex-column align-items-center justify-content-center gap-2"
                  onClick={() => handleAddByName('Coach Privé')}>
                  <span className="fs-3">🏋️</span>
                  <span className="small">Coach Privé</span>
                </button>
              </div>
              <div className="col-6 col-md-4">
                <button className={`btn btn-gold w-100 h-100 p-3 d-flex flex-column align-items-center justify-content-center gap-2 position-relative ${cart.length > 0 ? 'pulse' : ''}`}
                  onClick={() => setShowCartModal(true)}>
                  <span className="fs-3">🛒</span>
                  <span className="small text-dark fw-bold">Panier ({cartTotal.toFixed(2)} DH)</span>
                  {cart.length > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light">
                      {cart.reduce((sum, item) => sum + item.quantite, 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card card-premium p-4">
        <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4 d-flex justify-content-between align-items-center">
          Derniers Passages
          <span className="badge bg-danger">3 Dettes à régulariser</span>
        </h4>
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
            <thead>
              <tr className="border-bottom border-warning border-opacity-50">
                <th className="bg-transparent text-muted">Heure</th>
                <th className="bg-transparent text-muted">Membre</th>
                <th className="bg-transparent text-muted">Statut</th>
                <th className="bg-transparent text-muted text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="bg-transparent">10:45</td>
                <td className="bg-transparent fw-bold">Youssef Amrani</td>
                <td className="bg-transparent"><span className="badge bg-success bg-opacity-25 text-success border border-success">Actif</span></td>
                <td className="bg-transparent text-end"><button className="btn btn-sm btn-outline-light">Profil</button></td>
              </tr>
              <tr>
                <td className="bg-transparent">10:42</td>
                <td className="bg-transparent fw-bold">Sara Benali</td>
                <td className="bg-transparent"><span className="badge bg-warning bg-opacity-25 text-warning border border-warning">Expire Bientôt</span></td>
                <td className="bg-transparent text-end"><button className="btn btn-sm btn-outline-light">Profil</button></td>
              </tr>
              <tr>
                <td className="bg-transparent">10:30</td>
                <td className="bg-transparent fw-bold">Karim Tazi</td>
                <td className="bg-transparent"><span className="badge bg-danger bg-opacity-25 text-danger border border-danger">Impayé (150 DH)</span></td>
                <td className="bg-transparent text-end"><button className="btn btn-sm btn-gold">Encaisser</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* === MODAL PASS JOURNÉE === */}
      {showDayPassModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0" style={{ backgroundColor: 'var(--dark-card)', color: '#fff' }}>
              <div className="modal-header border-bottom border-warning border-opacity-25">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <span className="fs-4">🎫</span> Pass Journée
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => { setShowDayPassModal(false); setDayPassMessage(null); }}></button>
              </div>
              <form onSubmit={handleDayPassSubmit}>
                <div className="modal-body">
                  {dayPassMessage && (
                    <div className={`alert alert-${dayPassMessage.type} py-2`}>{dayPassMessage.text}</div>
                  )}
                  <div className="mb-3">
                    <label className="form-label small text-muted">Nom du client <span className="text-danger">*</span></label>
                    <input type="text" className="form-control bg-dark text-white border-secondary"
                      placeholder="Ex: Mohamed Alami"
                      value={dayPassForm.clientName}
                      onChange={e => setDayPassForm({...dayPassForm, clientName: e.target.value})}
                      required autoFocus />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted">Téléphone <span className="text-muted">(optionnel)</span></label>
                    <input type="tel" className="form-control bg-dark text-white border-secondary"
                      placeholder="06 XX XX XX XX"
                      value={dayPassForm.telephone}
                      onChange={e => setDayPassForm({...dayPassForm, telephone: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted">Prix de la séance (DH) <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input type="number" min="1" step="0.5" className="form-control bg-dark text-white border-secondary fs-4 fw-bold text-center"
                        placeholder="50"
                        value={dayPassForm.prix}
                        onChange={e => setDayPassForm({...dayPassForm, prix: e.target.value})}
                        required
                        style={{ letterSpacing: '2px' }} />
                      <span className="input-group-text bg-warning text-dark fw-bold">DH</span>
                    </div>
                  </div>

                  {/* Liste des passes du jour */}
                  {todayPasses.length > 0 && (
                    <div className="mt-3 pt-3 border-top border-secondary border-opacity-50">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="small text-muted fw-bold">Passes aujourd'hui</span>
                        <span className="badge bg-warning text-dark">{todayPasses.length} pass{todayPasses.length > 1 ? 'es' : ''}</span>
                      </div>
                      <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                        {todayPasses.map((p, i) => (
                          <div key={i} className="d-flex justify-content-between align-items-center py-1 px-2 rounded mb-1" style={{ backgroundColor: 'rgba(255,204,0,0.08)' }}>
                            <span className="small">{p.productNom?.replace('Pass Journée - ', '')}</span>
                            <span className="small fw-bold text-warning">{p.total} DH</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer border-top border-warning border-opacity-25">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowDayPassModal(false); setDayPassMessage(null); }}>Annuler</button>
                  <button type="submit" className="btn btn-gold px-4 d-flex align-items-center gap-2" disabled={dayPassLoading}>
                    {dayPassLoading ? (
                      <><span className="spinner-border spinner-border-sm"></span> Enregistrement...</>
                    ) : (
                      <>🎫 Enregistrer le Pass</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* === MODAL DU PANIER POS === */}
      {showCartModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0" style={{ backgroundColor: 'var(--dark-card)', color: '#fff' }}>
              <div className="modal-header border-bottom border-warning border-opacity-25">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <span className="fs-4">🛒</span> Panier Caisse Rapide
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => { setShowCartModal(false); setPosMessage(null); }}></button>
              </div>
              <div className="modal-body">
                {posMessage && (
                  <div className={`alert alert-${posMessage.type} py-2`}>{posMessage.text}</div>
                )}

                {cart.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <span className="fs-1 d-block mb-2">🛒</span>
                    Le panier est vide. Cliquez sur les produits pour les ajouter.
                  </div>
                ) : (
                  <div>
                    <div className="list-group list-group-flush mb-3">
                      {cart.map((item, index) => (
                        <div key={index} className="list-group-item bg-transparent text-white border-secondary d-flex justify-content-between align-items-center px-0 py-2">
                          <div className="d-flex align-items-center gap-2">
                            <span className="fs-4">{item.product.image}</span>
                            <div>
                              <div className="fw-bold">{item.product.nom}</div>
                              <div className="small text-muted">{item.product.prixVente} DH / unité</div>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-3">
                            <div className="d-flex align-items-center gap-1 bg-dark rounded px-1" style={{ border: '1px solid #444' }}>
                              <button type="button" className="btn btn-sm btn-link text-warning p-0 px-2 text-decoration-none fw-bold"
                                onClick={() => {
                                  if (item.quantite > 1) {
                                    setCart(cart.map(i => i.product.id === item.product.id ? { ...i, quantite: i.quantite - 1 } : i));
                                  } else {
                                    setCart(cart.filter(i => i.product.id !== item.product.id));
                                  }
                                }}>-</button>
                              <span className="px-2 fw-bold">{item.quantite}</span>
                              <button type="button" className="btn btn-sm btn-link text-warning p-0 px-2 text-decoration-none fw-bold"
                                onClick={() => {
                                  if (item.quantite < item.product.stockActuel) {
                                    setCart(cart.map(i => i.product.id === item.product.id ? { ...i, quantite: i.quantite + 1 } : i));
                                  } else {
                                    alert('Stock maximum atteint');
                                  }
                                }}>+</button>
                            </div>
                            <div className="fw-bold text-warning" style={{ minWidth: '70px', textAlign: 'right' }}>
                              {(item.product.prixVente * item.quantite).toFixed(2)} DH
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="d-flex justify-content-between align-items-center p-3 rounded mb-3" style={{ backgroundColor: 'rgba(255,204,0,0.08)', border: '1px dashed var(--accent-gold)' }}>
                      <span className="fw-bold fs-5">Total à Payer :</span>
                      <span className="fw-bold fs-4 text-warning">{cartTotal.toFixed(2)} DH</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-top border-warning border-opacity-25 justify-content-between">
                <button type="button" className="btn btn-outline-danger" onClick={() => setCart([])} disabled={cart.length === 0 || posLoading}>Vider</button>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowCartModal(false); setPosMessage(null); }}>Fermer</button>
                  <button type="button" className="btn btn-gold px-4" onClick={handleCheckout} disabled={cart.length === 0 || posLoading}>
                    {posLoading ? (
                      <><span className="spinner-border spinner-border-sm"></span> Traitement...</>
                    ) : (
                      <>💰 Encaisser la Vente</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}
