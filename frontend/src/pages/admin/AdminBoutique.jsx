import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import ErpLayout from '../../components/layout/ErpLayout';

export default function AdminBoutique() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [formData, setFormData] = useState({
    nom: '',
    categorie: 'BOISSON',
    prixAchat: '',
    prixVente: '',
    stockActuel: '',
    stockMin: 5,
    image: '🥤',
  });

  const [restockQty, setRestockQty] = useState(10);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, salesRes] = await Promise.all([
        apiFetch('http://localhost:8080/api/pos/products'),
        apiFetch('http://localhost:8080/api/pos/sales')
      ]);

      if (prodRes.ok) {
        setProducts(await prodRes.json());
      }
      if (salesRes.ok) {
        setSales(await salesRes.json());
      }
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la récupération des données de la boutique.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      nom: '',
      categorie: 'BOISSON',
      prixAchat: '',
      prixVente: '',
      stockActuel: '',
      stockMin: 5,
      image: '🥤',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (p) => {
    setSelectedProduct(p);
    setFormData({
      nom: p.nom,
      categorie: p.categorie,
      prixAchat: p.prixAchat,
      prixVente: p.prixVente,
      stockActuel: p.stockActuel,
      stockMin: p.stockMin,
      image: p.image || '🥤',
    });
    setShowEditModal(true);
  };

  const handleOpenRestock = (p) => {
    setSelectedProduct(p);
    setRestockQty(10);
    setShowRestockModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        prixAchat: parseFloat(formData.prixAchat),
        prixVente: parseFloat(formData.prixVente),
        stockActuel: parseInt(formData.stockActuel || 0),
        stockMin: parseInt(formData.stockMin || 5),
      };

      const res = await apiFetch('http://localhost:8080/api/pos/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowAddModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        prixAchat: parseFloat(formData.prixAchat),
        prixVente: parseFloat(formData.prixVente),
        stockActuel: parseInt(formData.stockActuel),
        stockMin: parseInt(formData.stockMin),
      };

      const res = await apiFetch(`http://localhost:8080/api/pos/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowEditModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer/archiver ce produit ?")) return;
    try {
      const res = await apiFetch(`http://localhost:8080/api/pos/products/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`http://localhost:8080/api/pos/products/${selectedProduct.id}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantite: parseInt(restockQty) }),
      });
      if (res.ok) {
        setShowRestockModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Financial Calculations
  const productMap = {};
  products.forEach(p => {
    productMap[p.id] = p;
  });

  let totalRevenues = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let totalSalesCount = 0;

  sales.forEach(sale => {
    totalRevenues += sale.total;
    totalSalesCount += sale.quantite || 1;
    if (sale.productId) {
      const prod = productMap[sale.productId];
      const purchasePrice = prod ? prod.prixAchat : 0;
      totalCost += (purchasePrice * (sale.quantite || 1));
    }
  });
  totalProfit = totalRevenues - totalCost;

  const currentStockValue = products.reduce((acc, p) => acc + (p.stockActuel * p.prixAchat), 0);

  return (
    <ErpLayout role="ADMIN">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">🛒 Gestion de Stock & Boutique</h2>
        <button className="btn btn-gold px-4" onClick={handleOpenAdd}>➕ Nouveau Produit</button>
      </div>

      {error && (
        <div className="alert alert-danger border-danger bg-danger bg-opacity-10 text-danger mb-4">
          ⚠️ {error}
        </div>
      )}

      {/* COMPTABILITÉ BOUTIQUE */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card-premium p-4 text-center h-100 border-success border-opacity-25">
            <h6 className="text-muted mb-2">Chiffre d'Affaires</h6>
            <h2 className="display-6 fw-bold text-success">{totalRevenues.toFixed(2)} DH</h2>
            <p className="text-muted small mb-0">{totalSalesCount} ventes enregistrées</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-premium p-4 text-center h-100 border-danger border-opacity-25">
            <h6 className="text-muted mb-2">Coût d'Achat des Ventes</h6>
            <h2 className="display-6 fw-bold text-danger">{totalCost.toFixed(2)} DH</h2>
            <p className="text-muted small mb-0">Valeur d'achat des produits vendus</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-premium p-4 text-center h-100 border-warning border-opacity-25">
            <h6 className="text-muted mb-2">Bénéfice Net (Marge)</h6>
            <h2 className="display-6 fw-bold text-gold">{totalProfit.toFixed(2)} DH</h2>
            <p className="text-muted small mb-0">
              Taux de marge: {totalRevenues > 0 ? ((totalProfit / totalRevenues) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-premium p-4 text-center h-100 border-info border-opacity-25">
            <h6 className="text-muted mb-2">Valeur Actuelle du Stock</h6>
            <h2 className="display-6 fw-bold text-info">{currentStockValue.toFixed(2)} DH</h2>
            <p className="text-muted small mb-0">Au coût d'achat des produits restants</p>
          </div>
        </div>
      </div>

      {/* TABLEAU DES PRODUITS */}
      <div className="card-premium p-4">
        <h5 className="text-gold mb-4">Inventaire Actuel</h5>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : products.length === 0 ? (
          <p className="text-muted text-center py-4">Aucun produit en stock.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0">
              <thead>
                <tr className="border-bottom border-warning border-opacity-25">
                  <th className="bg-transparent text-muted">Produit</th>
                  <th className="bg-transparent text-muted text-center">Catégorie</th>
                  <th className="bg-transparent text-muted text-center">Stock</th>
                  <th className="bg-transparent text-muted text-center">Prix Achat</th>
                  <th className="bg-transparent text-muted text-center">Prix Vente</th>
                  <th className="bg-transparent text-muted text-center">Marge Unitaire</th>
                  <th className="bg-transparent text-muted text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const isLowStock = p.stockActuel <= p.stockMin;
                  const unitMargin = p.prixVente - p.prixAchat;
                  
                  return (
                    <tr key={p.id} className="border-bottom border-secondary border-opacity-10">
                      <td className="bg-transparent">
                        <div className="d-flex align-items-center gap-3">
                          <span className="fs-3">{p.image || '🥤'}</span>
                          <span className="fw-bold">{p.nom}</span>
                        </div>
                      </td>
                      <td className="bg-transparent text-center">
                        <span className="badge bg-secondary px-3 py-1 rounded-pill">{p.categorie}</span>
                      </td>
                      <td className="bg-transparent text-center">
                        <span className={`fw-bold fs-5 ${isLowStock ? 'text-danger' : ''}`}>
                          {p.stockActuel}
                        </span>
                        {isLowStock && (
                          <span className="d-block text-danger small">⚠️ Stock Bas (min: {p.stockMin})</span>
                        )}
                      </td>
                      <td className="bg-transparent text-center">{p.prixAchat.toFixed(2)} DH</td>
                      <td className="bg-transparent text-center">{p.prixVente.toFixed(2)} DH</td>
                      <td className="bg-transparent text-center text-success fw-bold">
                        +{unitMargin.toFixed(2)} DH
                      </td>
                      <td className="bg-transparent text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <button className="btn btn-sm btn-info" onClick={() => handleOpenRestock(p)}>⚡ Réappro</button>
                          <button className="btn btn-sm btn-outline-warning" onClick={() => handleOpenEdit(p)}>✏️ Éditer</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteProduct(p.id)}>🗑️ Suppr</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL AJOUT PRODUIT */}
      {showAddModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark border border-warning border-opacity-25 text-white">
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title text-gold">Ajouter un nouveau produit</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleSaveProduct}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nom du Produit</label>
                    <input type="text" className="form-control bg-dark text-white border-secondary" required
                      value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} />
                  </div>
                  <div className="row mb-3">
                    <div className="col">
                      <label className="form-label">Catégorie</label>
                      <select className="form-select bg-dark text-white border-secondary"
                        value={formData.categorie} onChange={e => setFormData({ ...formData, categorie: e.target.value })}>
                        <option value="BOISSON">🥤 Boisson</option>
                        <option value="SNACK">🍫 Snack</option>
                        <option value="SUPPLEMENT">💊 Supplément</option>
                        <option value="EQUIPEMENT">🎒 Équipement</option>
                      </select>
                    </div>
                    <div className="col">
                      <label className="form-label">Icône / Emoji</label>
                      <input type="text" className="form-control bg-dark text-white border-secondary text-center"
                        value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col">
                      <label className="form-label">Prix Achat (DH)</label>
                      <input type="number" step="0.01" className="form-control bg-dark text-white border-secondary" required
                        value={formData.prixAchat} onChange={e => setFormData({ ...formData, prixAchat: e.target.value })} />
                    </div>
                    <div className="col">
                      <label className="form-label">Prix Vente (DH)</label>
                      <input type="number" step="0.01" className="form-control bg-dark text-white border-secondary" required
                        value={formData.prixVente} onChange={e => setFormData({ ...formData, prixVente: e.target.value })} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col">
                      <label className="form-label">Stock Initial</label>
                      <input type="number" className="form-control bg-dark text-white border-secondary" required
                        value={formData.stockActuel} onChange={e => setFormData({ ...formData, stockActuel: e.target.value })} />
                    </div>
                    <div className="col">
                      <label className="form-label">Stock Min (Alerte)</label>
                      <input type="number" className="form-control bg-dark text-white border-secondary" required
                        value={formData.stockMin} onChange={e => setFormData({ ...formData, stockMin: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top border-secondary">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
                  <button type="submit" className="btn btn-gold">Ajouter le produit</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ÉDITION PRODUIT */}
      {showEditModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark border border-warning border-opacity-25 text-white">
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title text-gold">Éditer le produit</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleUpdateProduct}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nom du Produit</label>
                    <input type="text" className="form-control bg-dark text-white border-secondary" required
                      value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} />
                  </div>
                  <div className="row mb-3">
                    <div className="col">
                      <label className="form-label">Catégorie</label>
                      <select className="form-select bg-dark text-white border-secondary"
                        value={formData.categorie} onChange={e => setFormData({ ...formData, categorie: e.target.value })}>
                        <option value="BOISSON">🥤 Boisson</option>
                        <option value="SNACK">🍫 Snack</option>
                        <option value="SUPPLEMENT">💊 Supplément</option>
                        <option value="EQUIPEMENT">🎒 Équipement</option>
                      </select>
                    </div>
                    <div className="col">
                      <label className="form-label">Icône / Emoji</label>
                      <input type="text" className="form-control bg-dark text-white border-secondary text-center"
                        value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col">
                      <label className="form-label">Prix Achat (DH)</label>
                      <input type="number" step="0.01" className="form-control bg-dark text-white border-secondary" required
                        value={formData.prixAchat} onChange={e => setFormData({ ...formData, prixAchat: e.target.value })} />
                    </div>
                    <div className="col">
                      <label className="form-label">Prix Vente (DH)</label>
                      <input type="number" step="0.01" className="form-control bg-dark text-white border-secondary" required
                        value={formData.prixVente} onChange={e => setFormData({ ...formData, prixVente: e.target.value })} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col">
                      <label className="form-label">Stock Actuel</label>
                      <input type="number" className="form-control bg-dark text-white border-secondary" required
                        value={formData.stockActuel} onChange={e => setFormData({ ...formData, stockActuel: e.target.value })} />
                    </div>
                    <div className="col">
                      <label className="form-label">Stock Min (Alerte)</label>
                      <input type="number" className="form-control bg-dark text-white border-secondary" required
                        value={formData.stockMin} onChange={e => setFormData({ ...formData, stockMin: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top border-secondary">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Annuler</button>
                  <button type="submit" className="btn btn-gold">Sauvegarder</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RÉAPPROVISIONNEMENT */}
      {showRestockModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark border border-warning border-opacity-25 text-white">
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title text-gold">Réapprovisionner : {selectedProduct?.nom}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRestockModal(false)}></button>
              </div>
              <form onSubmit={handleRestockSubmit}>
                <div className="modal-body text-center">
                  <p className="mb-4">Indiquez la quantité à ajouter au stock actuel ({selectedProduct?.stockActuel} en stock).</p>
                  <div className="d-flex justify-content-center align-items-center gap-3">
                    <button type="button" className="btn btn-secondary fs-4" onClick={() => setRestockQty(Math.max(1, restockQty - 5))}>-5</button>
                    <input type="number" className="form-control bg-dark text-white border-secondary text-center fs-4 fw-bold" style={{ width: '120px' }} required
                      value={restockQty} onChange={e => setRestockQty(parseInt(e.target.value) || 0)} />
                    <button type="button" className="btn btn-secondary fs-4" onClick={() => setRestockQty(restockQty + 5)}>+5</button>
                  </div>
                </div>
                <div className="modal-footer border-top border-secondary">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRestockModal(false)}>Annuler</button>
                  <button type="submit" className="btn btn-gold">Confirmer l'ajout</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}
