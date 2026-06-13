import ErpLayout from '../../components/layout/ErpLayout';

export default function ClientDashboard() {
  return (
    <ErpLayout role="CLIENT">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Espace Personnel</h2>
      </div>

      <div className="row g-4 mb-4">
        {/* Pass virtuel et Statut */}
        <div className="col-12 col-md-5 col-lg-4">
          <div className="card card-premium p-4 h-100 text-center d-flex flex-column justify-content-center align-items-center">
            <h5 className="text-muted small text-uppercase fw-bold mb-3">Mon Pass Virtuel</h5>
            
            <div className="bg-white p-3 rounded mb-3" style={{ width: '150px', height: '150px' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=client_12345`} 
                alt="QR Code" 
                className="w-100 h-100"
              />
            </div>

            <div className="alert alert-success bg-success bg-opacity-25 border-success text-success w-100 fw-bold py-2 mb-0">
              Abonnement Actif
            </div>
            <small className="text-muted mt-2">Valable jusqu'au 24 Décembre 2026</small>
            
            <button className="btn btn-outline-light w-100 mt-4">Renouveler mon abonnement</button>
          </div>
        </div>

        {/* Prochaines réservations */}
        <div className="col-12 col-md-7 col-lg-8">
          <div className="card card-premium p-4 h-100">
            <div className="d-flex justify-content-between align-items-center border-bottom border-warning border-opacity-25 pb-2 mb-4">
              <h4 className="fw-bold mb-0">Mes Prochaines Séances</h4>
              <button className="btn btn-sm btn-gold">Réserver</button>
            </div>
            
            <div className="d-flex flex-column gap-3">
              <div className="p-3 border border-warning border-opacity-50 rounded bg-dark bg-opacity-50 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-gold text-dark fw-bold rounded d-flex flex-column align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                    <span className="fs-5">15</span>
                    <small style={{ fontSize: '10px' }}>JUIN</small>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1 text-white">CrossFit WOD</h5>
                    <small className="text-muted">17:00 • Salle A • Coach Mehdi</small>
                  </div>
                </div>
                <button className="btn btn-sm btn-outline-danger">Annuler</button>
              </div>

              <div className="p-3 border border-secondary border-opacity-25 rounded bg-dark bg-opacity-25 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-secondary bg-opacity-50 text-white rounded d-flex flex-column align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                    <span className="fs-5">18</span>
                    <small style={{ fontSize: '10px' }}>JUIN</small>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1 text-light">Yoga Récupération</h5>
                    <small className="text-muted">19:00 • Salle Zen • Coach Sarah</small>
                  </div>
                </div>
                <button className="btn btn-sm btn-outline-danger">Annuler</button>
              </div>
            </div>
            
            <div className="mt-auto pt-4 text-center">
              <a href="#" className="text-gold text-decoration-none small">Voir l'historique de mes séances →</a>
            </div>
          </div>
        </div>
      </div>
    </ErpLayout>
  );
}
