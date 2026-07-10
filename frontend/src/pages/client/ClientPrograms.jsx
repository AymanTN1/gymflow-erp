import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import ErpLayout from '../../components/layout/ErpLayout';
import { useAuth } from '../../context/AuthContext';

export default function ClientPrograms() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  
  useEffect(() => {
    if (user?.clientId) {
      fetchPrograms();
    }
  }, [user]);

  const fetchPrograms = async () => {
    try {
      const res = await apiFetch(`http://localhost:8080/api/programs/client/${user.clientId}`);
      if (res.ok) setPrograms(await res.json());
    } catch (err) { console.error(err); }
  };

  return (
    <ErpLayout role="CLIENT">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">🏋️‍♂️ Mes Programmes</h2>
      </div>

      <div className="row g-4">
        {programs.length === 0 ? (
          <div className="col-12 text-center py-5 text-muted">
            <span className="fs-1 d-block mb-3">📋</span>
            <p>Vous n'avez aucun programme assigné pour le moment.</p>
            <p className="small">Discutez avec votre coach pour qu'il vous prépare un programme sur-mesure !</p>
          </div>
        ) : (
          programs.map(p => {
            let parsedExercises = [];
            try { parsedExercises = JSON.parse(p.contenuJSON); } catch(e){}

            return (
              <div key={p.id} className="col-12 col-md-6">
                <div className="card-premium p-4 h-100 position-relative border-warning border-opacity-50">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h4 className="fw-bold text-gold mb-0">{p.titre}</h4>
                    <span className="badge bg-dark border border-secondary text-muted">
                      {new Date(p.dateCreation).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-light mb-4">{p.description}</p>
                  
                  <div className="table-responsive">
                    <table className="table table-dark table-hover mb-0">
                      <thead>
                        <tr>
                          <th className="bg-transparent text-muted">Exercice</th>
                          <th className="bg-transparent text-muted text-center">Séries</th>
                          <th className="bg-transparent text-muted text-center">Reps</th>
                          <th className="bg-transparent text-muted text-end">Repos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedExercises.map((ex, i) => (
                          <tr key={i}>
                            <td className="bg-transparent fw-bold text-white">{ex.nom}</td>
                            <td className="bg-transparent text-center text-info">{ex.series}</td>
                            <td className="bg-transparent text-center text-warning">{ex.reps}</td>
                            <td className="bg-transparent text-end text-success">⏱️ {ex.repos}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </ErpLayout>
  );
}
