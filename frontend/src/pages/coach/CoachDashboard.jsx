import ErpLayout from '../../components/layout/ErpLayout';

export default function CoachDashboard() {
  return (
    <ErpLayout role="COACH">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Mon Planning & Séances</h2>
        <button className="btn btn-gold px-4 py-2">Planifier un Cours</button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-8">
          <div className="card card-premium p-4 h-100">
            <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Cours d'Aujourd'hui</h4>
            
            <div className="d-flex flex-column gap-3">
              <div className="p-3 border border-warning border-opacity-25 rounded bg-dark bg-opacity-50 d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="fw-bold mb-1 text-gold">CrossFit - WOD Intensif</h5>
                  <small className="text-muted">17:00 - 18:00 • Salle A</small>
                </div>
                <div className="text-end">
                  <div className="badge bg-success mb-2">Complet (15/15)</div>
                  <div><button className="btn btn-sm btn-outline-light">Voir Liste</button></div>
                </div>
              </div>

              <div className="p-3 border border-warning border-opacity-25 rounded bg-dark bg-opacity-50 d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="fw-bold mb-1 text-gold">Coaching Privé : Ahmed</h5>
                  <small className="text-muted">18:30 - 19:30 • Zone Poids Libres</small>
                </div>
                <div className="text-end">
                  <div className="badge bg-warning text-dark mb-2">Confirmé (1/1)</div>
                  <div><button className="btn btn-sm btn-outline-light">Dossier Suivi</button></div>
                </div>
              </div>

              <div className="p-3 border border-secondary border-opacity-25 rounded bg-dark bg-opacity-25 d-flex justify-content-between align-items-center opacity-75">
                <div>
                  <h5 className="fw-bold mb-1 text-light">Yoga Récupération</h5>
                  <small className="text-muted">20:00 - 21:00 • Salle Zen</small>
                </div>
                <div className="text-end">
                  <div className="badge bg-secondary mb-2">Inscriptions (4/20)</div>
                  <div><button className="btn btn-sm btn-outline-light">Gérer</button></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card card-premium p-4 h-100">
            <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Suivi Mes Membres</h4>
            
            <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
              <li className="d-flex align-items-center gap-3 p-2 border border-secondary border-opacity-25 rounded">
                <div className="bg-secondary rounded-circle d-flex justify-content-center align-items-center" style={{ width: '40px', height: '40px' }}>
                  A
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-0 fw-bold">Ahmed B.</h6>
                  <small className="text-muted">Objectif: Prise de masse</small>
                </div>
                <button className="btn btn-sm btn-gold">+</button>
              </li>
              <li className="d-flex align-items-center gap-3 p-2 border border-secondary border-opacity-25 rounded">
                <div className="bg-secondary rounded-circle d-flex justify-content-center align-items-center" style={{ width: '40px', height: '40px' }}>
                  K
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-0 fw-bold">Karima S.</h6>
                  <small className="text-muted">Objectif: Perte de poids</small>
                </div>
                <button className="btn btn-sm btn-gold">+</button>
              </li>
              <li className="d-flex align-items-center gap-3 p-2 border border-secondary border-opacity-25 rounded">
                <div className="bg-secondary rounded-circle d-flex justify-content-center align-items-center" style={{ width: '40px', height: '40px' }}>
                  M
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-0 fw-bold">Mehdi R.</h6>
                  <small className="text-warning">Mise à jour requise</small>
                </div>
                <button className="btn btn-sm btn-outline-warning">!</button>
              </li>
            </ul>
            <button className="btn btn-outline-light w-100 mt-4">Voir Tous les Membres</button>
          </div>
        </div>
      </div>
    </ErpLayout>
  );
}
