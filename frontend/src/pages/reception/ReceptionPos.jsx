import { apiFetch } from '../../utils/api';
import { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';

const EMOJIS = ['💧', '☕', '🥤', '🍫', '🏋️', '🧴', '🥛', '🍌'];

export default function ReceptionPos() {
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [todaySales, setTodaySales] = useState({ ventes: [], totalJour: 0, nbVentes: 0 });
  const [cart, setCart] = useState([]); // { product, quantite }
  const [showStock, setShowStock] = useState(false);
  const [restockId, setRestockId] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockPrixAchat, setRestockPrixAchat] = useState('');
  const [message, setMessage] = useState(null);

  const fetchAll = async () => {
    try {
      const [pRes, aRes, sRes] = await Promise.all([
        apiFetch('http://localhost:8080/api/pos/products'),
        apiFetch('http://localhost:8080/api/pos/products/alertes'),
        apiFetch('http://localhost:8080/api/pos/sales/today')
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (aRes.ok) setAlerts(await aRes.json());
      if (sRes.ok) setTodaySales(await sRes.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchAll(); }, []);

  // Panier
  const addToCart = (product) => {
    const existing = cart.find(c => c.product.id === product.id);
    if (existing) {
      if (existing.quantite >= product.stockActuel) return;
      setCart(cart.map(c => c.product.id === product.id ? { ...c, quantite: c.quantite + 1 } : c));
    } else {
      if (product.stockActuel < 1) return;
      setCart([...cart, { product, quantite: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(c => c.product.id !== productId));
  };

  const updateCartQty = (productId, qty) => {
    if (qty < 1) { removeFromCart(productId); return; }
    setCart(cart.map(c => c.product.id === productId ? { ...c, quantite: qty } : c));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.product.prixVente * c.quantite, 0);

  // Valider la vente
  const handleSell = async () => {
    setMessage(null);
    for (const item of cart) {
      try {
        const res = await apiFetch('http://localhost:8080/api/pos/sell', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: item.product.id, quantite: item.quantite, vendeur: 'Réception' })
        });
        const data = await res.json();
        if (!data.success) {
          setMessage({ type: 'danger', text: data.message });
          return;
        }
      } catch (err) {
        setMessage({ type: 'danger', text: 'Erreur de connexion.' });
        return;
      }
    }
    setMessage({ type: 'success', text: `✅ Vente de ${cartTotal.toFixed(2)} DH enregistrée !` });
    setCart([]);
    fetchAll();
    setTimeout(() => setMessage(null), 3000);
  };



  // Réapprovisionner (réceptionniste saisit quantité + prix d'achat)
  const handleRestock = async (id) => {
    try {
      const payload = { quantite: parseInt(restockQty) };
      if (restockPrixAchat) payload.prixAchat = parseFloat(restockPrixAchat);
      await apiFetch(`http://localhost:8080/api/pos/products/${id}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setRestockId(null);
      setRestockQty('');
      setRestockPrixAchat('');
      fetchAll();
    } catch (err) { console.error(err); }
  };

  return (
    <ErpLayout role="RECEPTION">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">🛒 Point de Vente</h2>
        <div className="d-flex gap-2">
          <button className={`btn ${showStock ? 'btn-gold' : 'btn-outline-light'}`} onClick={() => setShowStock(!showStock)}>
            📦 Stock
          </button>
        </div>
      </div>

      {/* Alertes stock */}
      {alerts.length > 0 && (
        <div className="alert alert-warning py-2 mb-3 d-flex align-items-center gap-2">
          <span>⚠️</span>
          <span className="fw-bold">Stock bas :</span>
          {alerts.map(a => <span key={a.id} className="badge bg-danger">{a.nom} ({a.stockActuel})</span>)}
        </div>
      )}

      {message && <div className={`alert alert-${message.type} py-2 mb-3`}>{message.text}</div>}



      {/* === VUE STOCK (réceptionniste : pas de prix d'achat, marge, ni recettes) === */}
      {showStock && (
        <div className="card-premium p-4 mb-4">
          <h5 className="text-gold mb-3">📦 Inventaire du Stock</h5>
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0">
              <thead>
                <tr>
                  <th className="bg-transparent text-muted">Produit</th>
                  <th className="bg-transparent text-muted text-center">Prix Vente</th>
                  <th className="bg-transparent text-muted text-center">Stock</th>
                  <th className="bg-transparent text-muted text-center">Seuil</th>
                  <th className="bg-transparent text-muted text-center">Réapprovisionner</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td><span className="me-2">{p.image}</span>{p.nom}</td>
                    <td className="text-center fw-bold">{p.prixVente?.toFixed(2)} DH</td>
                    <td className="text-center">
                      <span className={`badge ${p.stockActuel <= p.stockMin ? 'bg-danger' : 'bg-success'} px-3`}>
                        {p.stockActuel}
                      </span>
                    </td>
                    <td className="text-center text-muted">{p.stockMin}</td>
                    <td className="text-center">
                      {restockId === p.id ? (
                        <div className="d-flex gap-1 justify-content-center flex-wrap">
                          <input type="number" className="form-control form-control-dark form-control-sm" style={{ width: '60px' }}
                            value={restockQty} onChange={e => setRestockQty(e.target.value)} placeholder="Qté" autoFocus />
                          <input type="number" step="0.5" className="form-control form-control-dark form-control-sm" style={{ width: '80px' }}
                            value={restockPrixAchat} onChange={e => setRestockPrixAchat(e.target.value)} placeholder="P.Achat" />
                          <button className="btn btn-sm btn-success" onClick={() => handleRestock(p.id)}>✓</button>
                          <button className="btn btn-sm btn-outline-light" onClick={() => { setRestockId(null); setRestockPrixAchat(''); }}>✕</button>
                        </div>
                      ) : (
                        <button className="btn btn-sm btn-outline-warning" onClick={() => { setRestockId(p.id); setRestockQty(''); setRestockPrixAchat(''); }}>
                          + Stock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === CAISSE RAPIDE (VUE PRINCIPALE) === */}
      {!showStock && (
        <div className="row g-3">
          {/* Grille de produits */}
          <div className="col-md-8">
            <div className="card-premium p-4">
              <h5 className="text-gold mb-3">Sélectionnez les produits</h5>
              {products.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <span className="fs-1 d-block mb-2">📦</span>
                  <p>Aucun produit. Cliquez sur "+ Produit" pour en ajouter.</p>
                </div>
              ) : (
                <div className="row g-2">
                  {products.map(p => {
                    const inCart = cart.find(c => c.product.id === p.id);
                    const outOfStock = p.stockActuel < 1;
                    return (
                      <div key={p.id} className="col-6 col-md-4 col-lg-3">
                        <div
                          className={`p-3 rounded text-center position-relative ${outOfStock ? 'opacity-50' : ''}`}
                          style={{
                            backgroundColor: inCart ? 'rgba(255,204,0,0.15)' : 'rgba(255,255,255,0.05)',
                            border: inCart ? '2px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.1)',
                            cursor: outOfStock ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onClick={() => !outOfStock && addToCart(p)}
                        >
                          <span className="fs-1 d-block mb-1">{p.image || '📦'}</span>
                          <div className="fw-bold small text-truncate">{p.nom}</div>
                          <div className="text-gold fw-bold">{p.prixVente?.toFixed(2)} DH</div>
                          <div className="text-muted" style={{ fontSize: '10px' }}>
                            {outOfStock ? <span className="text-danger">Rupture</span> : `Stock: ${p.stockActuel}`}
                          </div>
                          {inCart && (
                            <span className="position-absolute top-0 end-0 badge bg-gold text-dark rounded-circle" style={{ transform: 'translate(30%, -30%)' }}>
                              {inCart.quantite}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Panier / Ticket */}
          <div className="col-md-4">
            <div className="card-premium p-4 h-100 d-flex flex-column">
              <h5 className="text-gold mb-3">🧾 Ticket de Caisse</h5>
              
              {cart.length === 0 ? (
                <div className="flex-grow-1 d-flex align-items-center justify-content-center text-muted">
                  <p className="text-center">Cliquez sur un produit<br/>pour l'ajouter au panier</p>
                </div>
              ) : (
                <>
                  <div className="flex-grow-1">
                    {cart.map(item => (
                      <div key={item.product.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-warning border-opacity-25">
                        <div className="d-flex align-items-center gap-2">
                          <span>{item.product.image}</span>
                          <div>
                            <div className="fw-bold small">{item.product.nom}</div>
                            <div className="text-muted" style={{ fontSize: '11px' }}>{item.product.prixVente} DH/u</div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <button className="btn btn-sm btn-outline-light px-2 py-0" onClick={() => updateCartQty(item.product.id, item.quantite - 1)}>−</button>
                          <span className="fw-bold">{item.quantite}</span>
                          <button className="btn btn-sm btn-outline-light px-2 py-0" onClick={() => updateCartQty(item.product.id, item.quantite + 1)}>+</button>
                          <span className="text-gold fw-bold ms-2">{(item.product.prixVente * item.quantite).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-top border-warning border-opacity-50">
                    <div className="d-flex justify-content-between mb-3">
                      <span className="fw-bold fs-5">TOTAL</span>
                      <span className="text-gold fw-bold fs-4">{cartTotal.toFixed(2)} DH</span>
                    </div>
                    <button className="btn btn-gold w-100 py-3 fw-bold fs-5" onClick={handleSell} disabled={cart.length === 0}>
                      💵 Encaisser
                    </button>
                    <button className="btn btn-outline-danger w-100 mt-2 btn-sm" onClick={() => setCart([])}>
                      🗑️ Vider le panier
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Résumé du jour (sans recettes - confidentiel) */}
          <div className="col-12">
            <div className="card-premium p-4">
              <div className="row text-center">
                <div className="col-6">
                  <h2 className="text-gold fw-bold">{todaySales.nbVentes || 0}</h2>
                  <p className="text-muted mb-0">Ventes Aujourd'hui</p>
                </div>
                <div className="col-6">
                  <h2 className="text-gold fw-bold">{products.length}</h2>
                  <p className="text-muted mb-0">Produits en Catalogue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}
