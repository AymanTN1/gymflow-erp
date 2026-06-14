import { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';

export default function AdminCrm() {
  const [winBackClients, setWinBackClients] = useState([]);

  const fetchWinBackData = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/crm/winback');
      if (res.ok) {
        const data = await res.json();
        setWinBackClients(data);
      }
    } catch (err) {
      console.error("Erreur de récupération CRM", err);
    }
  };

  useEffect(() => {
    fetchWinBackData();
  }, []);

  return (
    <ErpLayout role="ADMIN">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Win-Back CRM <span className="fs-5 text-muted">(Fidélisation)</span></h2>
        <button className="btn btn-gold px-4">📩 Relancer Tout le Monde</button>
      </div>
      
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card-premium p-4 text-center h-100 border-danger border-opacity-50">
            <h5 className="text-danger mb-2">Expirés (Perdus ?)</h5>
            <h2 className="display-4 fw-bold">{winBackClients.filter(c => c.crmStatus === 'EXPIRE').length}</h2>
            <p className="text-muted small mb-0">Action immédiate requise</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card-premium p-4 text-center h-100 border-warning border-opacity-50">
            <h5 className="text-warning mb-2">À Risque (Expire dans {'<'} 5j)</h5>
            <h2 className="display-4 fw-bold">{winBackClients.filter(c => c.crmStatus === 'EXPIRE_BIENTOT').length}</h2>
            <p className="text-muted small mb-0">Anticipation = Rétention</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card-premium p-4 text-center h-100 border-success border-opacity-50">
            <h5 className="text-success mb-2">Taux de Rétention</h5>
            <h2 className="display-4 fw-bold text-success">84%</h2>
            <p className="text-muted small mb-0">Objectif: 90%</p>
          </div>
        </div>
      </div>

      <div className="card-premium p-4">
        <h5 className="text-gold mb-4">Liste de Relance Prioritaire</h5>
        <div className="table-responsive">
          <table className="table table-dark table-hover mb-0">
            <thead>
              <tr>
                <th className="bg-transparent text-muted">Client</th>
                <th className="bg-transparent text-muted">Téléphone</th>
                <th className="bg-transparent text-muted">Dernier Abonnement</th>
                <th className="bg-transparent text-muted">Statut CRM</th>
                <th className="bg-transparent text-muted text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {winBackClients.length === 0 ? (
                <tr><td colSpan="5" className="text-center text-muted py-4">Aucun client à relancer ! Tout le monde est à jour. 🎉</td></tr>
              ) : (
                winBackClients.map((item, index) => (
                  <tr key={index}>
                    <td className="fw-bold">{item.client.nomComplet}</td>
                    <td>{item.client.telephone || 'Non renseigné'}</td>
                    <td>
                      {item.membership.typeAbonnement} <br/>
                      <small className="text-muted">Fin: {new Date(item.membership.dateFin).toLocaleDateString()}</small>
                    </td>
                    <td>
                      {item.crmStatus === 'EXPIRE' ? (
                        <span className="badge bg-danger">🔴 Expiré</span>
                      ) : (
                        <span className="badge bg-warning text-dark">🟠 Expire Bientôt</span>
                      )}
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-success me-2">📱 WhatsApp</button>
                      <button className="btn btn-sm btn-outline-light">📞 Appeler</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ErpLayout>
  );
}
