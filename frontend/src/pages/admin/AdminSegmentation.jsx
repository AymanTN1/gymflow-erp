import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import ErpLayout from '../../components/layout/ErpLayout';

export default function AdminSegmentation() {
  const [segments, setSegments] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [segRes, cliRes] = await Promise.all([
        apiFetch('http://localhost:8000/api/ml/segments'),
        apiFetch('http://localhost:8000/api/ml/segments/clients')
      ]);

      if (segRes.ok) {
        const segData = await segRes.json();
        setSegments(segData.segments || []);
      }
      if (cliRes.ok) {
        const cliData = await cliRes.json();
        setClients(cliData.clients || []);
      }
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Le microservice d'analyse predictive est hors ligne.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getDayName = (dayIndex) => {
    const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    return days[dayIndex] || "Inconnu";
  };

  // Filter clients based on selected segment
  const filteredClients = selectedSegment
    ? clients.filter(c => c.segment_name === selectedSegment)
    : clients;

  return (
    <ErpLayout role="ADMIN">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">👥 Segmentation Comportementale des Clients</h2>
        <button className="btn btn-outline-light" onClick={fetchData}>🔄 Actualiser</button>
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
          <p className="text-muted mt-2">Calcul des centres de gravite (K-Means) en cours...</p>
        </div>
      ) : (
        <>
          {/* SEGMENT CARDS */}
          <div className="row g-4 mb-4">
            {segments.map(seg => (
              <div key={seg.segment_name} className="col-md-3">
                <div 
                  className={`card-premium p-4 text-center h-100 cursor-pointer transition-all ${selectedSegment === seg.segment_name ? 'border-warning' : 'border-secondary border-opacity-25'}`}
                  style={{ 
                    background: selectedSegment === seg.segment_name ? 'rgba(255, 193, 7, 0.05)' : 'var(--card-bg)',
                    transform: selectedSegment === seg.segment_name ? 'scale(1.02)' : 'none'
                  }}
                  onClick={() => setSelectedSegment(selectedSegment === seg.segment_name ? null : seg.segment_name)}
                >
                  <span className="fs-1 d-block mb-2">{seg.emoji}</span>
                  <h4 className="fw-bold mb-1">{seg.segment_name}</h4>
                  <h2 className="display-6 fw-bold text-gold my-2">{seg.count}</h2>
                  <p className="text-muted small mb-2">{seg.description}</p>
                  <div className="border-top border-secondary border-opacity-25 pt-2 mt-2">
                    <span className="text-muted small">Moyenne: </span>
                    <span className="fw-bold text-light">{seg.avg_visits_per_week} / sem</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* LISTE DES MEMBRES SEGMENTÉS */}
          <div className="card-premium p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <h5 className="text-gold mb-0">
                {selectedSegment ? `Membres du groupe : ${selectedSegment}` : "Tous les membres segmentés"}
              </h5>
              <span className="text-muted small">Total affichés : {filteredClients.length}</span>
            </div>

            {filteredClients.length === 0 ? (
              <p className="text-muted text-center py-4">Aucun membre dans ce segment.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0">
                  <thead>
                    <tr className="border-bottom border-warning border-opacity-25">
                      <th className="bg-transparent text-muted">Membre</th>
                      <th className="bg-transparent text-muted text-center">Segment</th>
                      <th className="bg-transparent text-muted text-center">Fréquence</th>
                      <th className="bg-transparent text-muted text-center">Heure Préférée</th>
                      <th className="bg-transparent text-muted text-center">Jour Préféré</th>
                      <th className="bg-transparent text-muted text-center">Total Visites</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map(c => (
                      <tr key={c.client_id} className="border-bottom border-secondary border-opacity-10">
                        <td className="bg-transparent fw-bold">{c.nom}</td>
                        <td className="bg-transparent text-center">
                          <span className="badge bg-secondary px-3 py-2 rounded-pill">
                            {c.segment_emoji} {c.segment_name}
                          </span>
                        </td>
                        <td className="bg-transparent text-center fw-bold">{c.avg_visits_per_week} / sem</td>
                        <td className="bg-transparent text-center">{String(c.preferred_hour).padStart(2, '0')}:00</td>
                        <td className="bg-transparent text-center">{getDayName(c.preferred_day)}</td>
                        <td className="bg-transparent text-center fw-bold">{c.total_visits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </ErpLayout>
  );
}
