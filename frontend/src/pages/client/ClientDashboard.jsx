import { apiFetch } from '../../utils/api';
import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import ErpLayout from '../../components/layout/ErpLayout';

export default function ClientDashboard() {
  const [scanStatus, setScanStatus] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    apiFetch('http://localhost:8080/api/checkin/active-count')
      .then(res => res.json())
      .then(data => setActiveCount(data.count))
      .catch(err => console.error(err));

    const eventSource = new EventSource('http://localhost:8080/api/checkin/stream');
    eventSource.addEventListener('countUpdate', (event) => {
      const data = JSON.parse(event.data);
      setActiveCount(data.count);
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const handleScan = async (text) => {
    if (text) {
      setScanning(false);
      try {
        const res = await apiFetch('http://localhost:8080/api/checkin/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: text, clientId: "1" }) // Simule Client Karim Tazi
        });
        if (res.ok) {
          const data = await res.json();
          setScanStatus(data.status); // SUCCESS, WARNING, DANGER
        } else {
          setScanStatus('DANGER');
        }
      } catch (err) {
        setScanStatus('DANGER');
      }
    }
  };

  const getAffluenceBadge = () => {
    if (activeCount < 10) return { text: "Faible", class: "bg-success" };
    if (activeCount < 25) return { text: "Moyenne", class: "bg-warning text-dark" };
    return { text: "Forte", class: "bg-danger" };
  };

  const affluence = getAffluenceBadge();

  return (
    <ErpLayout role="CLIENT">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <h2 className="fw-bold mb-0">Espace Personnel</h2>
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Affluence actuelle :</span>
          <span className={`badge ${affluence.class} border p-2`}>
            {affluence.text} ({activeCount} pers.)
          </span>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-md-5 col-lg-4">
          <div className="card card-premium p-4 h-100 text-center d-flex flex-column justify-content-center align-items-center">
            <h5 className="text-gold fw-bold mb-4">Pointage à l'Entrée</h5>
            
            {scanning ? (
              <div style={{ width: '100%', maxWidth: '250px', borderRadius: '15px', overflow: 'hidden' }}>
                <Scanner onResult={(text, result) => handleScan(text)} />
                <button className="btn btn-outline-danger mt-3 w-100" onClick={() => setScanning(false)}>Annuler</button>
              </div>
            ) : (
              <>
                <button 
                  className="btn btn-gold w-100 py-3 fw-bold fs-5 shadow-lg d-flex align-items-center justify-content-center gap-2"
                  onClick={() => setScanning(true)}
                  style={{ borderRadius: '15px' }}
                >
                  <span className="fs-3">📷</span> Scanner le code de la salle
                </button>
                <p className="text-muted small mt-3">Scannez le QR Code situé à l'accueil pour entrer.</p>
              </>
            )}

            {scanStatus === 'SUCCESS' && <div className="alert alert-success mt-4 w-100">✅ Pointage Réussi</div>}
            {scanStatus === 'WARNING' && <div className="alert alert-warning mt-4 w-100">⚠️ Pointage Réussi (Expire bientôt)</div>}
            {scanStatus === 'DANGER' && <div className="alert alert-danger mt-4 w-100">❌ Accès Refusé</div>}
          </div>
        </div>

        <div className="col-12 col-md-7 col-lg-8">
          <div className="card card-premium p-4 h-100">
            <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Mon Profil</h4>
            <p className="text-muted">ID: #1 - Karim Tazi</p>
            <div className="alert bg-dark border-warning text-white">
              Abonnement : <strong>1 MOIS</strong>
            </div>
            <p className="small text-muted">Abonnement de démonstration injecté via SQL.</p>
          </div>
        </div>
      </div>
    </ErpLayout>
  );
}
