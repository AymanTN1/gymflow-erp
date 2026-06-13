import { useState } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';

export default function ReceptionDashboard() {
  const [scanStatus, setScanStatus] = useState(null); // 'success', 'warning', 'danger'

  const simulateScan = (type) => {
    setScanStatus(type);
    setTimeout(() => setScanStatus(null), 3000);
  };

  return (
    <ErpLayout role="RECEPTION">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Accueil & Pointage</h2>
        <button className="btn btn-gold px-4 py-2">Nouvelle Inscription</button>
      </div>

      <div className="row g-4 mb-4">
        {/* Module Pointage Rapide */}
        <div className="col-12 col-lg-5">
          <div className="card card-premium p-4 h-100 text-center">
            <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Scanner QR Code</h4>
            
            <div className="d-flex justify-content-center align-items-center mb-4">
              <div 
                className="border border-2 border-warning border-opacity-50 rounded d-flex flex-column align-items-center justify-content-center p-4"
                style={{ width: '200px', height: '200px', backgroundColor: 'rgba(0,0,0,0.5)' }}
              >
                <span className="fs-1">📷</span>
                <span className="text-muted small mt-2">En attente de scan...</span>
              </div>
            </div>

            <div className="d-flex gap-2 justify-content-center">
              <button onClick={() => simulateScan('success')} className="btn btn-sm btn-outline-success">Simuler Vert</button>
              <button onClick={() => simulateScan('warning')} className="btn btn-sm btn-outline-warning">Simuler Orange</button>
              <button onClick={() => simulateScan('danger')} className="btn btn-sm btn-outline-danger">Simuler Rouge</button>
            </div>

            {scanStatus === 'success' && (
              <div className="alert alert-success mt-4 mb-0 fw-bold bg-success bg-opacity-25 border-success text-success">
                ✅ Accès Autorisé - Abonnement valide
              </div>
            )}
            {scanStatus === 'warning' && (
              <div className="alert alert-warning mt-4 mb-0 fw-bold bg-warning bg-opacity-25 border-warning text-warning">
                ⚠️ Accès Autorisé - Expire dans 2 jours
              </div>
            )}
            {scanStatus === 'danger' && (
              <div className="alert alert-danger mt-4 mb-0 fw-bold bg-danger bg-opacity-25 border-danger text-danger">
                ❌ Accès Refusé - Abonnement expiré (Dette: 250 DH)
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
                <button className="btn btn-outline-light w-100 h-100 p-3 d-flex flex-column align-items-center justify-content-center gap-2">
                  <span className="fs-3">🎫</span>
                  <span className="small">Pass Journée</span>
                </button>
              </div>
              <div className="col-6 col-md-4">
                <button className="btn btn-outline-light w-100 h-100 p-3 d-flex flex-column align-items-center justify-content-center gap-2">
                  <span className="fs-3">💧</span>
                  <span className="small">Eau Bouteille</span>
                </button>
              </div>
              <div className="col-6 col-md-4">
                <button className="btn btn-outline-light w-100 h-100 p-3 d-flex flex-column align-items-center justify-content-center gap-2">
                  <span className="fs-3">🥤</span>
                  <span className="small">Protéine</span>
                </button>
              </div>
              <div className="col-6 col-md-4">
                <button className="btn btn-outline-light w-100 h-100 p-3 d-flex flex-column align-items-center justify-content-center gap-2">
                  <span className="fs-3">🏋️</span>
                  <span className="small">Coach Privé</span>
                </button>
              </div>
              <div className="col-6 col-md-4">
                <button className="btn btn-gold w-100 h-100 p-3 d-flex flex-column align-items-center justify-content-center gap-2">
                  <span className="fs-3">🛒</span>
                  <span className="small text-dark fw-bold">Panier (0.00 DH)</span>
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
    </ErpLayout>
  );
}
