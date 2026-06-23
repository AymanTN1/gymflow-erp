import { apiFetch } from '../../utils/api';
import { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';

const JOURS_MAP = { 0: 'DIMANCHE', 1: 'LUNDI', 2: 'MARDI', 3: 'MERCREDI', 4: 'JEUDI', 5: 'VENDREDI', 6: 'SAMEDI' };

export default function ReceptionPointageCours() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);
  const [todayJour] = useState(JOURS_MAP[new Date().getDay()]);

  useEffect(() => {
    fetchTodayCourses();
  }, []);

  const fetchTodayCourses = async () => {
    try {
      const res = await apiFetch('http://localhost:8080/api/courses/planning');
      if (res.ok) {
        const planning = await res.json();
        setCourses(planning[todayJour] || []);
      }
    } catch (err) { console.error(err); }
  };

  const fetchReservations = async (courseId) => {
    try {
      const res = await apiFetch(`http://localhost:8080/api/courses/${courseId}/reservations?date=${todayDate}`);
      if (res.ok) {
        const data = await res.json();
        setReservations(data);
      }
    } catch (err) { console.error(err); }
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    fetchReservations(course.id);
  };

  const handlePointer = async (resId, statut) => {
    try {
      const res = await apiFetch(`http://localhost:8080/api/courses/reservations/${resId}/pointer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut })
      });
      if (res.ok) {
        fetchReservations(selectedCourse.id);
      }
    } catch (err) { console.error(err); }
  };

  const presentsCount = reservations.filter(r => r.statut === 'PRESENT').length;
  const absentsCount = reservations.filter(r => r.statut === 'ABSENT').length;
  const enAttenteCount = reservations.filter(r => r.statut === 'CONFIRMEE').length;

  return (
    <ErpLayout role="RECEPTION">
      <h2 className="fw-bold mb-4">📋 Pointage des Cours — {todayJour}</h2>

      {/* Sélection du cours */}
      {!selectedCourse ? (
        <>
          {courses.length === 0 ? (
            <div className="card-premium p-5 text-center">
              <span className="fs-1 d-block mb-3">😴</span>
              <p className="text-muted mb-0">Aucun cours programmé aujourd'hui ({todayJour}).</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              <p className="text-muted">Sélectionnez un cours pour gérer les présences :</p>
              {courses.map(course => (
                <div
                  key={course.id}
                  className="card-premium p-4 d-flex justify-content-between align-items-center"
                  style={{ cursor: 'pointer', borderLeft: `4px solid ${course.couleur}`, transition: 'all 0.2s' }}
                  onClick={() => handleSelectCourse(course)}
                >
                  <div>
                    <h5 className="fw-bold mb-1" style={{ color: course.couleur }}>{course.nom}</h5>
                    <div className="text-muted small">
                      ⏰ {course.heureDebut?.slice(0, 5)} - {course.heureFin?.slice(0, 5)} | 🏋️ {course.coach}
                      {course.salle && ` | 📍 ${course.salle}`}
                    </div>
                  </div>
                  <div className="text-gold fw-bold fs-4">→</div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Header du cours sélectionné */}
          <div className="card-premium p-4 mb-4" style={{ borderLeft: `5px solid ${selectedCourse.couleur}` }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="fw-bold mb-1" style={{ color: selectedCourse.couleur }}>{selectedCourse.nom}</h4>
                <div className="text-muted">
                  ⏰ {selectedCourse.heureDebut?.slice(0, 5)} - {selectedCourse.heureFin?.slice(0, 5)} | 🏋️ {selectedCourse.coach}
                </div>
              </div>
              <button className="btn btn-outline-light" onClick={() => { setSelectedCourse(null); setReservations([]); }}>
                ← Retour
              </button>
            </div>
          </div>

          {/* Résumé du pointage */}
          <div className="row g-3 mb-4">
            <div className="col-4">
              <div className="card-premium p-3 text-center">
                <h2 className="text-success fw-bold mb-0">{presentsCount}</h2>
                <small className="text-muted">Présents ✅</small>
              </div>
            </div>
            <div className="col-4">
              <div className="card-premium p-3 text-center">
                <h2 className="text-danger fw-bold mb-0">{absentsCount}</h2>
                <small className="text-muted">Absents ❌</small>
              </div>
            </div>
            <div className="col-4">
              <div className="card-premium p-3 text-center">
                <h2 className="text-warning fw-bold mb-0">{enAttenteCount}</h2>
                <small className="text-muted">En Attente ⏳</small>
              </div>
            </div>
          </div>

          {/* Liste des inscrits */}
          {reservations.length === 0 ? (
            <div className="card-premium p-4 text-center text-muted">
              Aucun inscrit pour ce cours aujourd'hui.
            </div>
          ) : (
            <div className="card-premium p-4">
              <h5 className="text-gold mb-3">Liste des Inscrits ({reservations.length}/{selectedCourse.capaciteMax})</h5>
              <div className="d-flex flex-column gap-2">
                {reservations.map(r => (
                  <div key={r.id} className="d-flex justify-content-between align-items-center p-3 rounded"
                    style={{
                      backgroundColor: r.statut === 'PRESENT' ? 'rgba(40,167,69,0.1)' :
                                       r.statut === 'ABSENT' ? 'rgba(220,53,69,0.1)' :
                                       'rgba(255,255,255,0.05)',
                      border: r.statut === 'PRESENT' ? '1px solid rgba(40,167,69,0.3)' :
                              r.statut === 'ABSENT' ? '1px solid rgba(220,53,69,0.3)' :
                              '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <div>
                      <span className="fw-bold">{r.clientNom}</span>
                      <span className="ms-2">
                        {r.statut === 'PRESENT' && <span className="badge bg-success">✅ Présent</span>}
                        {r.statut === 'ABSENT' && <span className="badge bg-danger">❌ Absent</span>}
                        {r.statut === 'CONFIRMEE' && <span className="badge bg-warning text-dark">⏳ En attente</span>}
                      </span>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className={`btn btn-sm ${r.statut === 'PRESENT' ? 'btn-success' : 'btn-outline-success'}`}
                        onClick={() => handlePointer(r.id, 'PRESENT')}
                      >
                        ✅
                      </button>
                      <button
                        className={`btn btn-sm ${r.statut === 'ABSENT' ? 'btn-danger' : 'btn-outline-danger'}`}
                        onClick={() => handlePointer(r.id, 'ABSENT')}
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </ErpLayout>
  );
}
