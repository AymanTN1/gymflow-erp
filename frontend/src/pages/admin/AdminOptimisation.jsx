import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import ErpLayout from '../../components/layout/ErpLayout';

export default function AdminOptimisation() {
  const [solution, setSolution] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [optimizing, setOptimizing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [currentRes, suggRes] = await Promise.all([
        apiFetch('http://localhost:8000/api/ml/optimize/current'),
        apiFetch('http://localhost:8000/api/ml/optimize/suggestions')
      ]);

      if (currentRes.ok) {
        setSolution(await currentRes.json());
      }
      if (suggRes.ok) {
        const suggData = await suggRes.json();
        setSuggestions(suggData.suggestions || []);
      }
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Le microservice d'analyse predictive est hors ligne.");
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    try {
      setOptimizing(true);
      const res = await apiFetch('http://localhost:8000/api/ml/optimize/planning');
      if (res.ok) {
        setSolution(await res.json());
        // Reload suggestions
        const suggRes = await apiFetch('http://localhost:8000/api/ml/optimize/suggestions');
        if (suggRes.ok) {
          const suggData = await suggRes.json();
          setSuggestions(suggData.suggestions || []);
        }
      }
      setOptimizing(false);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la resolution de l'optimisation.");
      setOptimizing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <ErpLayout role="ADMIN">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">🧮 Optimisation de la Planification Hebdomadaire</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-light" onClick={fetchData}>🔄 Recharger</button>
          <button className="btn btn-gold" onClick={handleOptimize} disabled={optimizing}>
            {optimizing ? "Calcul Optimal (Solver)..." : "⚡ Generer le Planning Optimal"}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-danger bg-danger bg-opacity-10 text-danger mb-4">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="text-muted mt-2">Recherche de la solution optimale (PLNE - Recherche Operationnelle)...</p>
        </div>
      ) : (
        <>
          {/* STATS DE LA SOLUTION */}
          {solution && (
            <div className="row g-4 mb-4">
              <div className="col-md-3">
                <div className="card-premium p-4 text-center h-100">
                  <h6 className="text-muted mb-2">Statut du Solver</h6>
                  <h3 className="fw-bold text-success">
                    {solution.status === 'Optimal' ? '✓ OPTIMAL' : solution.status}
                  </h3>
                  <p className="small text-muted mb-0">Algorithme: {solution.solver?.split(' ')[0]}</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card-premium p-4 text-center h-100">
                  <h6 className="text-muted mb-2">Taux de Couverture</h6>
                  <h2 className="display-6 fw-bold text-gold">{solution.coverage_pct}%</h2>
                  <p className="small text-muted mb-0">{solution.covered_slots} / {solution.total_slots} creneaux</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card-premium p-4 text-center h-100">
                  <h6 className="text-muted mb-2">Score de Remplissage</h6>
                  <h2 className="display-6 fw-bold text-gold">{solution.total_score}</h2>
                  <p className="small text-muted mb-0">Fonction objectif maximizee</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card-premium p-4 text-center h-100">
                  <h6 className="text-muted mb-2">Contraintes Activees</h6>
                  <h3 className="fw-bold text-info">5 contraintes</h3>
                  <p className="small text-muted mb-0">Dispo, limites, repos...</p>
                </div>
              </div>
            </div>
          )}

          <div className="row g-4">
            {/* TABLEAU DES AFFECTATIONS */}
            <div className="col-lg-8">
              <div className="card-premium p-4">
                <h5 className="text-gold mb-4">Affectations recommandees pour la semaine</h5>
                
                {solution?.optimal_schedule?.length === 0 ? (
                  <p className="text-muted text-center py-4">Aucune affectation generee.</p>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <table className="table table-dark table-hover align-middle mb-0">
                      <thead>
                        <tr className="border-bottom border-warning border-opacity-25">
                          <th className="bg-transparent text-muted">Créneau</th>
                          <th className="bg-transparent text-muted">Jour</th>
                          <th className="bg-transparent text-muted">Coach Affecté</th>
                          <th className="bg-transparent text-muted text-center">Score d'Adéquation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {solution?.optimal_schedule?.map((s, idx) => (
                          <tr key={idx} className="border-bottom border-secondary border-opacity-10">
                            <td className="bg-transparent">{s.start} - {s.end}</td>
                            <td className="bg-transparent fw-bold text-gold">{s.day}</td>
                            <td className="bg-transparent fw-bold">{s.coach_name}</td>
                            <td className="bg-transparent text-center fw-bold text-success">+{s.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* SUGGESTIONS ET CONTRAINTES */}
            <div className="col-lg-4">
              {/* SUGGESTIONS */}
              <div className="card-premium p-4 mb-4">
                <h5 className="text-gold mb-3">⚡ Recommandations de l'Optimiseur</h5>
                <ul className="list-group list-group-flush bg-transparent">
                  {suggestions.map((s, idx) => (
                    <li key={idx} className="list-group-item bg-transparent text-light border-secondary border-opacity-25 px-0 small">
                      💡 {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* RÈGLES DE RECHERCHE OPÉRATIONNELLE */}
              <div className="card-premium p-4">
                <h5 className="text-gold mb-3">⚙️ Modèle Mathématique (PLNE)</h5>
                <p className="text-muted small">
                  Le planning est calcule pour maximiser la satisfaction et la couverture globale en respectant :
                </p>
                <div className="d-flex flex-column gap-2">
                  <div className="p-2 rounded bg-dark border border-secondary border-opacity-25 small">
                    <strong className="text-warning">C1:</strong> Disponibilité déclarée de chaque coach.
                  </div>
                  <div className="p-2 rounded bg-dark border border-secondary border-opacity-25 small">
                    <strong className="text-warning">C2:</strong> Limite d'heures max par coach (ex: 15h).
                  </div>
                  <div className="p-2 rounded bg-dark border border-secondary border-opacity-25 small">
                    <strong className="text-warning">C3:</strong> Couverture des heures d'affluence.
                  </div>
                  <div className="p-2 rounded bg-dark border border-secondary border-opacity-25 small">
                    <strong className="text-warning">C4:</strong> Max 2 coachs simultanés.
                  </div>
                  <div className="p-2 rounded bg-dark border border-secondary border-opacity-25 small">
                    <strong className="text-warning">C5:</strong> Minimum 1 jour de repos hebdomadaire.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </ErpLayout>
  );
}
