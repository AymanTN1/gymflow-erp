import { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';

export default function ReceptionDashboard() {
  const [scanStatus, setScanStatus] = useState(null); // { status: 'SUCCESS'|'WARNING'|'DANGER', message: '', clientName: '' }

  useEffect(() => {
    // Connexion SSE au Backend
    const eventSource = new EventSource('http://localhost:8080/api/checkin/stream');
    
    eventSource.addEventListener('scanEvent', (event) => {
      const data = JSON.parse(event.data);
      setScanStatus({
        status: data.status,
        message: data.message,
        clientName: data.clientName
      });
      
      // Effacer l'alerte après 5 secondes
      setTimeout(() => setScanStatus(null), 5000);
    });

    eventSource.onerror = (error) => {
      console.error("Erreur SSE :", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <ErpLayout role="RECEPTION">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Accueil & Pointage</h2>
        <button className="btn btn-gold px-4 py-2">Nouvelle Inscription</button>
      </div>

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
