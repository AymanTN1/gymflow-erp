import { apiFetch } from '../../utils/api';
import { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';
import { Link } from 'react-router-dom';

const JOURS_MAP = { 0: 'DIMANCHE', 1: 'LUNDI', 2: 'MARDI', 3: 'MERCREDI', 4: 'JEUDI', 5: 'VENDREDI', 6: 'SAMEDI' };
const COACH_NAME = 'Coach Yassine'; // Simulé pour l'instant

export default function CoachDashboard() {
  const [allCourses, setAllCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [todayCourses, setTodayCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);
  const [todayJour] = useState(JOURS_MAP[new Date().getDay()]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await apiFetch('http://localhost:8080/api/courses');
      if (res.ok) {
        const courses = await res.json();
        const mine = courses.filter(c => c.coach === COACH_NAME);
        setAllCourses(courses);
        setMyCourses(mine);
        setTodayCourses(mine.filter(c => c.jour === todayJour));
      }
    } catch (err) { console.error(err); }
  };

  const fetchReservations = async (courseId) => {
    try {
      const res = await apiFetch(`http://localhost:8080/api/courses/${courseId}/reservations?date=${todayDate}`);
      if (res.ok) setReservations(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    fetchReservations(course.id);
  };

  const handlePointer = async (resId, statut) => {
    try {
      const res = await apiFetch(`http://localhost:8080/api/courses/reservations/${resId}/pointer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut })
      });
      if (res.ok && selectedCourse) fetchReservations(selectedCourse.id);
    } catch (err) { console.error(err); }
  };

  const presentsCount = reservations.filter(r => r.statut === 'PRESENT').length;
  const absentsCount = reservations.filter(r => r.statut === 'ABSENT').length;
  const enAttenteCount = reservations.filter(r => r.statut === 'CONFIRMEE').length;

  // Grouper mes cours par jour pour l'emploi du temps
  const joursList = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

  return (
    <ErpLayout role="COACH">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">🏋️ Espace Coach</h2>
          <span className="text-muted small">{COACH_NAME} — {todayJour}</span>
        </div>
        <div className="d-flex gap-3">
          <div className="card-premium p-2 px-3 text-center">
            <span className="text-gold fw-bold fs-5">{myCourses.length}</span>
            <div className="text-muted" style={{ fontSize: '10px' }}>Cours / Semaine</div>
          </div>
          <div className="card-premium p-2 px-3 text-center">
            <span className="text-gold fw-bold fs-5">{todayCourses.length}</span>
            <div className="text-muted" style={{ fontSize: '10px' }}>Cours Aujourd'hui</div>
          </div>
        </div>
      </div>
      
      {/* Raccourcis Rapides */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <Link to="/coach/chat" className="card-premium p-3 text-center d-block text-decoration-none border-warning" style={{ backgroundColor: 'rgba(230, 184, 0, 0.1)', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ fontSize: '28px' }}>💬</div>
            <h5 className="text-gold fw-bold mb-0">Messagerie Clients</h5>
          </Link>
        </div>
        <div className="col-12 col-md-6">
          <Link to="/coach/programs" className="card-premium p-3 text-center d-block text-decoration-none border-info" style={{ backgroundColor: 'rgba(51, 153, 255, 0.1)', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ fontSize: '28px' }}>📋</div>
            <h5 className="text-info fw-bold mb-0">Programmes d'Entraînement</h5>
          </Link>
        </div>
      </div>

      {!selectedCourse ? (
        <>
          {/* COURS DU JOUR */}
          <div className="card-premium p-4 mb-4">
            <h5 className="text-gold mb-3">📅 Mes Cours Aujourd'hui — {todayJour}</h5>
            {todayCourses.length === 0 ? (
              <div className="text-center text-muted py-4">
                <span className="fs-1 d-block mb-2">😴</span>
                <p>Pas de cours programmé aujourd'hui.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {todayCourses.map(course => (
                  <div key={course.id} className="p-3 rounded d-flex justify-content-between align-items-center"
                    style={{
                      backgroundColor: course.couleur + '15', borderLeft: `4px solid ${course.couleur}`,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onClick={() => handleSelectCourse(course)}
                  >
                    <div>
                      <h5 className="fw-bold mb-1" style={{ color: course.couleur }}>{course.nom}</h5>
                      <div className="text-muted small">
                        ⏰ {course.heureDebut?.slice(0, 5)} - {course.heureFin?.slice(0, 5)}
                        {course.salle && ` | 📍 ${course.salle}`}
                        {` | 👥 Max ${course.capaciteMax}`}
                      </div>
                    </div>
                    <button className="btn btn-gold px-3 d-flex align-items-center gap-2">
                      📋 Pointer les Élèves
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MON EMPLOI DU TEMPS COMPLET */}
          <div className="card-premium p-4">
            <h5 className="text-gold mb-3">🗓️ Mon Emploi du Temps</h5>
            {myCourses.length === 0 ? (
              <div className="text-center text-muted py-4">Aucun cours attribué.</div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {joursList.map(jour => {
                  const coursesOfDay = myCourses.filter(c => c.jour === jour);
                  if (coursesOfDay.length === 0) return null;
                  return (
                    <div key={jour}>
                      <div className="fw-bold text-muted small mb-2 mt-2">{jour}</div>
                      {coursesOfDay.map(course => (
                        <div key={course.id} className="d-flex align-items-center gap-3 p-2 mb-1 rounded"
                          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          <div style={{
                            width: '10px', height: '10px', borderRadius: '50%',
                            backgroundColor: course.couleur, flexShrink: 0
                          }} />
                          <span className="fw-bold" style={{ color: course.couleur, minWidth: '120px' }}>{course.nom}</span>
                          <span className="text-muted small">{course.heureDebut?.slice(0, 5)} - {course.heureFin?.slice(0, 5)}</span>
                          {course.salle && <span className="text-muted small">📍 {course.salle}</span>}
                          <span className="text-muted small">👥 {course.capaciteMax}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* ========== MODE POINTAGE ========== */
        <>
          <div className="card-premium p-4 mb-4" style={{ borderLeft: `5px solid ${selectedCourse.couleur}` }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="fw-bold mb-1" style={{ color: selectedCourse.couleur }}>{selectedCourse.nom}</h4>
                <div className="text-muted">
                  ⏰ {selectedCourse.heureDebut?.slice(0, 5)} - {selectedCourse.heureFin?.slice(0, 5)}
                  {selectedCourse.salle && ` | 📍 ${selectedCourse.salle}`}
                </div>
              </div>
              <button className="btn btn-outline-light" onClick={() => { setSelectedCourse(null); setReservations([]); }}>
                ← Retour
              </button>
            </div>
          </div>

          {/* Compteurs */}
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
              <span className="fs-1 d-block mb-2">📭</span>
              Aucun inscrit pour ce cours aujourd'hui.
            </div>
          ) : (
            <div className="card-premium p-4">
              <h5 className="text-gold mb-3">Liste des Élèves ({reservations.length}/{selectedCourse.capaciteMax})</h5>
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
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-secondary rounded-circle d-flex justify-content-center align-items-center fw-bold"
                        style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                        {r.clientNom?.charAt(0) || '?'}
                      </div>
                      <div>
                        <span className="fw-bold">{r.clientNom}</span>
                        <span className="ms-2">
                          {r.statut === 'PRESENT' && <span className="badge bg-success">✅ Présent</span>}
                          {r.statut === 'ABSENT' && <span className="badge bg-danger">❌ Absent</span>}
                          {r.statut === 'CONFIRMEE' && <span className="badge bg-warning text-dark">⏳ En attente</span>}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className={`btn btn-sm ${r.statut === 'PRESENT' ? 'btn-success' : 'btn-outline-success'} px-3`}
                        onClick={() => handlePointer(r.id, 'PRESENT')}
                      >
                        ✅ Présent
                      </button>
                      <button
                        className={`btn btn-sm ${r.statut === 'ABSENT' ? 'btn-danger' : 'btn-outline-danger'} px-3`}
                        onClick={() => handlePointer(r.id, 'ABSENT')}
                      >
                        ❌ Absent
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
