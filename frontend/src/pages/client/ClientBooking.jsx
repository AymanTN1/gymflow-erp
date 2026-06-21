import { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';

const JOURS_MAP = { 0: 'DIMANCHE', 1: 'LUNDI', 2: 'MARDI', 3: 'MERCREDI', 4: 'JEUDI', 5: 'VENDREDI', 6: 'SAMEDI' };
const JOURS_LABELS = { LUNDI: 'Lun', MARDI: 'Mar', MERCREDI: 'Mer', JEUDI: 'Jeu', VENDREDI: 'Ven', SAMEDI: 'Sam', DIMANCHE: 'Dim' };
const CLIENT_ID = 1; // Simulé pour l'instant

export default function ClientBooking() {
  const [planning, setPlanning] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayName, setSelectedDayName] = useState('');
  const [myReservations, setMyReservations] = useState([]);
  const [placesInfo, setPlacesInfo] = useState({});
  const [message, setMessage] = useState(null);

  // Générer les 7 prochains jours
  const getNextDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        date: d.toISOString().split('T')[0],
        dayName: JOURS_MAP[d.getDay()],
        label: JOURS_LABELS[JOURS_MAP[d.getDay()]],
        dayNum: d.getDate(),
        isToday: i === 0
      });
    }
    return days;
  };

  const nextDays = getNextDays();

  useEffect(() => {
    // Par défaut, sélectionner aujourd'hui
    setSelectedDate(nextDays[0].date);
    setSelectedDayName(nextDays[0].dayName);
    fetchPlanning();
    fetchMyReservations();
  }, []);

  const fetchPlanning = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/courses/planning');
      if (res.ok) setPlanning(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchMyReservations = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/courses/reservations/client/${CLIENT_ID}`);
      if (res.ok) setMyReservations(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchPlaces = async (courseId, date) => {
    try {
      const res = await fetch(`http://localhost:8080/api/courses/${courseId}/places-disponibles?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setPlacesInfo(prev => ({ ...prev, [`${courseId}_${date}`]: data }));
      }
    } catch (err) { console.error(err); }
  };

  const handleSelectDay = (day) => {
    setSelectedDate(day.date);
    setSelectedDayName(day.dayName);
    setMessage(null);
    // Charger les places pour chaque cours de ce jour
    const coursesOfDay = planning[day.dayName] || [];
    coursesOfDay.forEach(c => fetchPlaces(c.id, day.date));
  };

  const handleReserver = async (courseId) => {
    setMessage(null);
    try {
      const res = await fetch(`http://localhost:8080/api/courses/${courseId}/reserver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: CLIENT_ID, date: selectedDate })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchMyReservations();
        fetchPlaces(courseId, selectedDate);
      } else {
        setMessage({ type: 'danger', text: data.message });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Erreur de connexion.' });
    }
  };

  const handleAnnuler = async (resId, courseId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/courses/reservations/${resId}/annuler`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'info', text: 'Réservation annulée.' });
        fetchMyReservations();
        fetchPlaces(courseId, selectedDate);
      }
    } catch (err) { console.error(err); }
  };

  const isAlreadyBooked = (courseId) => {
    return myReservations.some(r =>
      r.courseId === courseId &&
      r.dateReservation === selectedDate &&
      r.statut !== 'ANNULEE'
    );
  };

  const getBookingId = (courseId) => {
    const r = myReservations.find(r =>
      r.courseId === courseId &&
      r.dateReservation === selectedDate &&
      r.statut !== 'ANNULEE'
    );
    return r?.id;
  };

  const coursesOfDay = planning[selectedDayName] || [];

  return (
    <ErpLayout role="CLIENT">
      <h2 className="fw-bold mb-4">📅 Réserver un Cours</h2>

      {/* Sélecteur de jour (horizontal scrollable sur mobile) */}
      <div className="d-flex gap-2 mb-4 overflow-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
        {nextDays.map(day => (
          <div
            key={day.date}
            onClick={() => handleSelectDay(day)}
            className="text-center p-3 rounded flex-shrink-0"
            style={{
              minWidth: '70px', cursor: 'pointer', transition: 'all 0.2s',
              backgroundColor: selectedDate === day.date ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
              color: selectedDate === day.date ? '#000' : '#fff',
              border: selectedDate === day.date ? '2px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>{day.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{day.dayNum}</div>
            {day.isToday && <div style={{ fontSize: '9px', opacity: 0.7 }}>Auj.</div>}
          </div>
        ))}
      </div>

      {message && (
        <div className={`alert alert-${message.type} py-2 mb-3`}>{message.text}</div>
      )}

      {/* Liste des cours du jour */}
      {coursesOfDay.length === 0 ? (
        <div className="card-premium p-5 text-center">
          <span className="fs-1 mb-3 d-block">😴</span>
          <p className="text-muted mb-0">Aucun cours prévu ce jour.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {coursesOfDay.map(course => {
            const key = `${course.id}_${selectedDate}`;
            const places = placesInfo[key];
            const booked = isAlreadyBooked(course.id);
            const bookingId = getBookingId(course.id);

            return (
              <div key={course.id} className="card-premium p-0 overflow-hidden">
                <div className="d-flex">
                  {/* Bande de couleur */}
                  <div style={{ width: '6px', backgroundColor: course.couleur, flexShrink: 0 }} />
                  
                  <div className="p-3 p-md-4 flex-grow-1">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
                      <div className="flex-grow-1">
                        <h5 className="fw-bold mb-1" style={{ color: course.couleur }}>{course.nom}</h5>
                        <div className="d-flex flex-wrap gap-3 text-muted small">
                          <span>⏰ {course.heureDebut?.slice(0, 5)} - {course.heureFin?.slice(0, 5)}</span>
                          <span>🏋️ {course.coach}</span>
                          {course.salle && <span>📍 {course.salle}</span>}
                        </div>
                        
                        {/* Jauge de places */}
                        {places && (
                          <div className="mt-2">
                            <div className="d-flex justify-content-between small mb-1">
                              <span className="text-muted">{places.reservees}/{places.capaciteMax} inscrits</span>
                              <span className={places.complet ? 'text-danger fw-bold' : 'text-success'}>
                                {places.complet ? 'COMPLET' : `${places.placesRestantes} places restantes`}
                              </span>
                            </div>
                            <div className="progress" style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                              <div className="progress-bar" role="progressbar"
                                style={{
                                  width: `${(places.reservees / places.capaciteMax) * 100}%`,
                                  backgroundColor: places.complet ? '#dc3545' : course.couleur
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Bouton réservation */}
                      <div className="flex-shrink-0 align-self-center">
                        {booked ? (
                          <div className="d-flex flex-column align-items-center gap-1">
                            <span className="badge bg-success px-3 py-2">✓ Réservé</span>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleAnnuler(bookingId, course.id)}>
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-gold px-4 py-2 fw-bold"
                            disabled={places?.complet}
                            onClick={() => handleReserver(course.id)}
                          >
                            {places?.complet ? 'Complet' : 'Réserver'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mes réservations à venir */}
      {myReservations.filter(r => r.statut !== 'ANNULEE').length > 0 && (
        <div className="card-premium p-4 mt-4">
          <h5 className="text-gold mb-3">📋 Mes Réservations</h5>
          <div className="d-flex flex-column gap-2">
            {myReservations.filter(r => r.statut !== 'ANNULEE').map(r => (
              <div key={r.id} className="d-flex justify-content-between align-items-center p-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <div>
                  <span className="fw-bold">Cours #{r.courseId}</span>
                  <span className="text-muted ms-2 small">le {r.dateReservation}</span>
                </div>
                <span className={`badge ${r.statut === 'PRESENT' ? 'bg-success' : r.statut === 'ABSENT' ? 'bg-danger' : 'bg-info'}`}>
                  {r.statut}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ErpLayout>
  );
}
