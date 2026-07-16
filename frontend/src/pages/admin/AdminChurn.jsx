import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import ErpLayout from '../../components/layout/ErpLayout';

export default function AdminChurn() {
  const [predictions, setPredictions] = useState([]);
  const [stats, setStats] = useState({ high_risk: 0, medium_risk: 0, low_risk: 0, total: 0 });
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [predRes, statsRes, infoRes] = await Promise.all([
        apiFetch('http://localhost:8000/api/ml/churn/predictions'),
        apiFetch('http://localhost:8000/api/ml/churn/stats'),
        apiFetch('http://localhost:8000/api/ml/churn/model-info')
      ]);

      if (predRes.ok) {
        const predData = await predRes.json();
        setPredictions(predData.predictions || []);
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (infoRes.ok) {
        setModelInfo(await infoRes.json());
      }
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Le microservice d'analyse predictive est hors ligne. Assurez-vous que le conteneur Python est demarre.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <ErpLayout role="ADMIN">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">🤖 Analyse Prédictive de Désabonnement</h2>
        <button className="btn btn-outline-light" onClick={fetchData}>🔄 Actualiser</button>
      </div>

      {error && (
        <div className="alert alert-danger border-danger bg-danger bg-opacity-10 text-danger mb-4">
          ⚠️ {error}
        </div>
      )}

      {/* RISQUES CARDS */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card-premium p-4 text-center h-100 border-danger border-opacity-50" style={{ background: 'rgba(220, 53, 69, 0.05)' }}>
            <h5 className="text-danger mb-2">Risque Élevé (🔴)</h5>
            <h2 className="display-5 fw-bold text-danger">{stats.high_risk}</h2>
            <p className="text-muted small mb-0">Score de churn &ge; 70%</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-premium p-4 text-center h-100 border-warning border-opacity-50" style={{ background: 'rgba(255, 193, 7, 0.05)' }}>
            <h5 className="text-warning mb-2">Risque Moyen (🟡)</h5>
            <h2 className="display-5 fw-bold text-warning">{stats.medium_risk}</h2>
            <p className="text-muted small mb-0">Score de churn 40% - 70%</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-premium p-4 text-center h-100 border-success border-opacity-50" style={{ background: 'rgba(40, 167, 69, 0.05)' }}>
            <h5 className="text-success mb-2">Risque Faible (🟢)</h5>
            <h2 className="display-5 fw-bold text-success">{stats.low_risk}</h2>
            <p className="text-muted small mb-0">Score de churn &lt; 40%</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-premium p-4 text-center h-100 border-info border-opacity-50">
            <h5 className="text-info mb-2">Modèle de Décision</h5>
            <h6 className="fw-bold mt-2 text-gold">Forêt Aléatoire & Régression</h6>
            {modelInfo?.metrics?.random_forest?.accuracy ? (
              <span className="badge bg-gold text-dark mt-2">Précision: {(modelInfo.metrics.random_forest.accuracy * 100).toFixed(1)}%</span>
            ) : (
              <span className="badge bg-secondary mt-2">Prêt</span>
            )}
          </div>
        </div>
      </div>

      {/* TABLEAU DES CLIENTS À RISQUE */}
      <div className="card-premium p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="text-gold mb-0">Classement des membres par risque de départ</h5>
          <span className="text-muted small">Total analysé : {stats.total} membres</span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
            <p className="text-muted mt-2">Analyse des comportements de fréquentation en cours...</p>
          </div>
        ) : predictions.length === 0 ? (
          <p className="text-muted text-center py-4">Aucune donnée disponible. Lancez le seed des clients.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0">
              <thead>
                <tr className="border-bottom border-warning border-opacity-25">
                  <th className="bg-transparent text-muted">Client</th>
                  <th className="bg-transparent text-muted text-center">Score de Risque</th>
                  <th className="bg-transparent text-muted text-center">Statut Risque</th>
                  <th className="bg-transparent text-muted text-center">Dernière Visite</th>
                  <th className="bg-transparent text-muted text-center">Visites / Semaine</th>
                  <th className="bg-transparent text-muted text-center">Tendance</th>
                  <th className="bg-transparent text-muted text-center">Abo. Restant</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map(p => {
                  const barColor = p.churn_score >= 70 ? 'bg-danger' : p.churn_score >= 40 ? 'bg-warning' : 'bg-success';
                  const badgeColor = p.risk_level === 'ELEVE' ? 'bg-danger text-white' : p.risk_level === 'MOYEN' ? 'bg-warning text-dark' : 'bg-success text-white';
                  
                  return (
                    <tr key={p.client_id} className="border-bottom border-secondary border-opacity-10">
                      <td className="bg-transparent">
                        <div className="fw-bold">{p.nom}</div>
                        <div className="text-muted small">{p.email || p.telephone}</div>
                      </td>
                      <td className="bg-transparent">
                        <div className="d-flex align-items-center gap-2 justify-content-center" style={{ minWidth: '150px' }}>
                          <span className="fw-bold" style={{ width: '40px' }}>{p.churn_score}%</span>
                          <div className="progress flex-grow-1" style={{ height: '8px', background: 'rgba(255,255,255,0.1)' }}>
                            <div className={`progress-bar ${barColor}`} role="progressbar" style={{ width: `${p.churn_score}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="bg-transparent text-center">
                        <span className={`badge ${badgeColor} px-3 py-2 rounded-pill`}>
                          {p.risk_level === 'ELEVE' ? '🔴 Critique' : p.risk_level === 'MOYEN' ? '🟡 Modéré' : '🟢 Stable'}
                        </span>
                      </td>
                      <td className="bg-transparent text-center">
                        {p.days_since_last_visit === 999 ? (
                          <span className="text-danger">Jamais</span>
                        ) : p.days_since_last_visit === 0 ? (
                          <span className="text-success fw-bold">Aujourd'hui</span>
                        ) : p.days_since_last_visit === 1 ? (
                          <span>Hier</span>
                        ) : (
                          <span>Il y a {p.days_since_last_visit} jours</span>
                        )}
                      </td>
                      <td className="bg-transparent text-center fw-bold">{p.avg_visits_per_week} / sem</td>
                      <td className="bg-transparent text-center">
                        {p.visit_trend < -0.1 ? (
                          <span className="text-danger">↘️ En baisse</span>
                        ) : p.visit_trend > 0.1 ? (
                          <span className="text-success">↗️ En hausse</span>
                        ) : (
                          <span className="text-muted">➡️ Stable</span>
                        )}
                      </td>
                      <td className="bg-transparent text-center">
                        {p.membership_days_left <= 0 ? (
                          <span className="text-danger fw-bold">Expiré ({Math.abs(p.membership_days_left)}j)</span>
                        ) : (
                          <span className={p.membership_days_left <= 10 ? 'text-warning fw-bold' : ''}>
                            {p.membership_days_left} jours
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ErpLayout>
  );
}
