import ErpLayout from '../../components/layout/ErpLayout';

export default function AdminDashboard() {
  return (
    <ErpLayout role="ADMIN">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Dashboard MRR & KPI</h2>
        <button className="btn btn-gold px-4 py-2">Exporter le Rapport</button>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-12 col-md-3">
          <div className="card card-premium p-3 text-center h-100">
            <h5 className="text-muted small text-uppercase fw-bold mb-2">MRR Actuel</h5>
            <h2 className="text-gold fw-bold mb-0">124,500 DH</h2>
            <small className="text-success mt-2 d-block">↑ +12.5% vs mois dernier</small>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card card-premium p-3 text-center h-100">
            <h5 className="text-muted small text-uppercase fw-bold mb-2">Membres Actifs</h5>
            <h2 className="text-white fw-bold mb-0">842</h2>
            <small className="text-success mt-2 d-block">↑ +45 nouveaux</small>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card card-premium p-3 text-center h-100">
            <h5 className="text-muted small text-uppercase fw-bold mb-2">Taux de Rétention</h5>
            <h2 className="text-white fw-bold mb-0">91%</h2>
            <small className="text-warning mt-2 d-block">Stable</small>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card card-premium p-3 text-center h-100">
            <h5 className="text-muted small text-uppercase fw-bold mb-2">Membres à Relancer (CRM)</h5>
            <h2 className="text-danger fw-bold mb-0">128</h2>
            <small className="text-muted mt-2 d-block">Dernier passage > 30 jours</small>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card card-premium p-4 h-100">
            <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Évolution des Revenus (Mock)</h4>
            <div className="d-flex align-items-end justify-content-between h-100 mt-3 px-3" style={{ minHeight: '200px' }}>
              {/* Mock Chart Bars */}
              {[60, 75, 55, 85, 95, 120].map((height, i) => (
                <div key={i} className="d-flex flex-column align-items-center" style={{ width: '10%' }}>
                  <div className="w-100 rounded-top" style={{ height: `${height}px`, backgroundColor: i === 5 ? 'var(--accent-gold)' : 'rgba(255,255,255,0.2)', transition: 'height 1s ease' }}></div>
                  <small className="text-muted mt-2">Mois {i+1}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="col-12 col-lg-4">
          <div className="card card-premium p-4 h-100">
            <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Aperçu Grand Livre</h4>
            <ul className="list-unstyled mb-0">
              <li className="d-flex justify-content-between py-2 border-bottom border-secondary border-opacity-25">
                <span className="text-light">Abonnements</span>
                <span className="text-success fw-bold">+95,000 DH</span>
              </li>
              <li className="d-flex justify-content-between py-2 border-bottom border-secondary border-opacity-25">
                <span className="text-light">Boutique (POS)</span>
                <span className="text-success fw-bold">+29,500 DH</span>
              </li>
              <li className="d-flex justify-content-between py-2 border-bottom border-secondary border-opacity-25">
                <span className="text-light">Salaires (RH)</span>
                <span className="text-danger fw-bold">-32,000 DH</span>
              </li>
              <li className="d-flex justify-content-between py-2 border-bottom border-secondary border-opacity-25">
                <span className="text-light">Charges Locaux</span>
                <span className="text-danger fw-bold">-18,000 DH</span>
              </li>
              <li className="d-flex justify-content-between py-2 mt-2 pt-3">
                <span className="text-gold fw-bold text-uppercase">Bénéfice Net</span>
                <span className="text-gold fw-bold">+74,500 DH</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </ErpLayout>
  );
}
