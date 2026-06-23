import { apiFetch } from '../../utils/api';
import { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';

export default function ReceptionDashboard() {
  const [scanStatus, setScanStatus] = useState(null);
  const [activeCount, setActiveCount] = useState(0);
  const [staffChecked, setStaffChecked] = useState(null); // { type, timestamp }
  const [checkMessage, setCheckMessage] = useState(null);
  const STAFF_USER_ID = 2; // Simule l'ID du réceptionniste connecté

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
