import { apiFetch } from '../../utils/api';
import { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
const COULEURS = ['#FF6B35', '#00B4D8', '#7209B7', '#F72585', '#4CC9F0', '#06D6A0', '#FFD166', '#EF476F'];

export default function AdminPlanning() {
  const [courses, setCourses] = useState([]);
  const [planning, setPlanning] = useState({});
  const [coaches, setCoaches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [message, setMessage] = useState(null); // {type:'success'|'error', text:'...'}
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);
  const [form, setForm] = useState({
    nom: '', coach: '', jour: 'LUNDI', heureDebut: '09:00', heureFin: '10:00',
    capaciteMax: 20, salle: '', couleur: '#FF6B35', actif: true
  });

  const fetchPlanning = async () => {
    try {
      const res = await apiFetch('http://localhost:8080/api/courses/planning');
      if (res.ok) setPlanning(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchCourses = async () => {
    try {
      const res = await apiFetch('http://localhost:8080/api/courses');
      if (res.ok) setCourses(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchCoaches = async () => {
    try {
      const res = await apiFetch('http://localhost:8080/api/users?role=COACH');
      if (res.ok) setCoaches(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchPlanning();
    fetchCourses();
    fetchCoaches();
  }, []);

  // Handlers pour le Drag & Drop
  const handleDragStart = (e, courseId) => {
    setDraggingId(courseId);
    e.dataTransfer.setData('text/plain', courseId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverDay(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Nécessaire pour autoriser le drop
  };

  const handleDragEnter = (e, day) => {
    e.preventDefault();
    setDragOverDay(day);
  };

  const handleDrop = async (e, targetDay) => {
    e.preventDefault();
    const courseIdStr = e.dataTransfer.getData('text/plain') || draggingId;
    if (!courseIdStr) return;
    const courseId = parseInt(courseIdStr);

    const courseToMove = courses.find(c => c.id === courseId);
    if (!courseToMove || courseToMove.jour === targetDay) {
      setDragOverDay(null);
      return;
    }

    // Mise à jour optimiste côté client
    setPlanning(prev => {
      const updated = { ...prev };
      const oldDay = courseToMove.jour;
      if (updated[oldDay]) {
        updated[oldDay] = updated[oldDay].filter(c => c.id !== courseId);
      }
      const updatedCourse = { ...courseToMove, jour: targetDay };
      if (!updated[targetDay]) updated[targetDay] = [];
      updated[targetDay] = [...updated[targetDay], updatedCourse].sort((a, b) => 
        a.heureDebut.localeCompare(b.heureDebut)
      );
      return updated;
    });

    setDragOverDay(null);

    try {
      const updatedCourseData = {
        ...courseToMove,
        jour: targetDay
      };

      const res = await apiFetch(`http://localhost:8080/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCourseData)
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `📅 Cours déplacé avec succès au ${targetDay} !` });
        fetchPlanning();
        fetchCourses();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: "❌ Impossible de déplacer le cours." });
        fetchPlanning();
      }
    } catch (err) {
      setMessage({ type: 'error', text: `❌ Erreur réseau : ${err.message}` });
      fetchPlanning();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingCourse
      ? `http://localhost:8080/api/courses/${editingCourse.id}`
      : 'http://localhost:8080/api/courses';
    const method = editingCourse ? 'PUT' : 'POST';

    try {
      const res = await apiFetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setMessage({ type: 'success', text: editingCourse ? '✅ Cours modifié !' : '✅ Cours créé avec succès !' });
        fetchPlanning();
        fetchCourses();
        resetForm();
        setTimeout(() => setMessage(null), 4000);
      } else {
        const errData = await res.text();
        setMessage({ type: 'error', text: `❌ Erreur ${res.status}: ${errData}` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: `❌ Erreur de connexion : ${err.message}` });
      console.error(err);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setForm({
      nom: course.nom, coach: course.coach, jour: course.jour,
      heureDebut: course.heureDebut, heureFin: course.heureFin,
      capaciteMax: course.capaciteMax, salle: course.salle || '',
      couleur: course.couleur || '#FF6B35', actif: course.actif
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce cours ?')) return;
    try {
      const res = await apiFetch(`http://localhost:8080/api/courses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: '🗑️ Cours supprimé avec succès !' });
        fetchPlanning();
        fetchCourses();
        resetForm();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: '❌ Échec de la suppression du cours.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: `❌ Erreur réseau : ${err.message}` });
      console.error(err);
    }
  };

  const handleDuplicate = async () => {
    if (!editingCourse) return;
    try {
      const clonedCourse = {
        nom: form.nom + " (Copie)",
        coach: form.coach,
        jour: form.jour,
        heureDebut: form.heureDebut,
        heureFin: form.heureFin,
        capaciteMax: form.capaciteMax,
        salle: form.salle,
        couleur: form.couleur,
        actif: true
      };

      const res = await apiFetch('http://localhost:8080/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clonedCourse)
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `👯 Cours "${form.nom}" dupliqué avec succès !` });
        fetchPlanning();
        fetchCourses();
        resetForm();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: "❌ Impossible de dupliquer le cours." });
      }
    } catch (err) {
      setMessage({ type: 'error', text: `❌ Erreur réseau : ${err.message}` });
      console.error(err);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCourse(null);
    setForm({ nom: '', coach: '', jour: 'LUNDI', heureDebut: '09:00', heureFin: '10:00', capaciteMax: 20, salle: '', couleur: '#FF6B35', actif: true });
  };

  return (
    <ErpLayout role="ADMIN">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">📅 Planning des Cours</h2>
        <button className="btn btn-gold" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? '✕ Fermer' : '+ Nouveau Cours'}
        </button>
      </div>

      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} py-2 mb-3`}>
          {message.text}
        </div>
      )}

      {/* Backdrop */}
      <div className={`drawer-backdrop ${showForm ? 'show' : ''}`} onClick={resetForm}></div>

      {/* Panneau Latéral (Drawer) Premium */}
      <div className={`drawer-premium ${showForm ? 'show' : ''}`}>
        <div className="drawer-header">
          <h5 className="text-gold mb-0 fw-bold">{editingCourse ? '✏️ Modifier le Cours' : '➕ Nouveau Cours'}</h5>
          <button type="button" className="btn btn-outline-warning btn-sm rounded-circle d-flex justify-content-center align-items-center" style={{ width: '30px', height: '30px' }} onClick={resetForm}>✕</button>
        </div>
        <div className="drawer-body">
          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            <div>
              <label className="form-label text-muted small">Nom du Cours *</label>
              <input type="text" className="form-control form-control-dark" required placeholder="Ex: Zumba, CrossFit..."
                value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} />
            </div>
            
            <div>
              <label className="form-label text-muted small">Coach *</label>
              <select 
                className="form-select form-control-dark mb-2" 
                required
                value={coaches.some(c => c.nom === form.coach) ? form.coach : (form.coach ? 'AUTRE' : '')}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'AUTRE') {
                    setForm(prev => ({ ...prev, coach: '' }));
                  } else {
                    setForm(prev => ({ ...prev, coach: val }));
                  }
                }}
              >
                <option value="" disabled>Sélectionner un coach...</option>
                {coaches.map(c => (
                  <option key={c.id} value={c.nom}>{c.nom}</option>
                ))}
                <option value="AUTRE">Autre (Saisir manuellement)...</option>
              </select>
              
              {(!form.coach || !coaches.some(c => c.nom === form.coach)) && (
                <input 
                  type="text" 
                  className="form-control form-control-dark mt-2 animate-fade-in" 
                  required 
                  placeholder="Saisir le nom du coach..."
                  value={form.coach} 
                  onChange={e => setForm({ ...form, coach: e.target.value })} 
                />
              )}
            </div>

            <div>
              <label className="form-label text-muted small">Jour *</label>
              <select className="form-select form-control-dark" value={form.jour} onChange={e => setForm({...form, jour: e.target.value})}>
                {JOURS.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>

            <div className="row g-2">
              <div className="col-6">
                <label className="form-label text-muted small">Heure Début *</label>
                <input type="time" className="form-control form-control-dark" required
                  value={form.heureDebut} onChange={e => setForm({...form, heureDebut: e.target.value})} />
              </div>
              <div className="col-6">
                <label className="form-label text-muted small">Heure Fin *</label>
                <input type="time" className="form-control form-control-dark" required
                  value={form.heureFin} onChange={e => setForm({...form, heureFin: e.target.value})} />
              </div>
            </div>

            <div className="row g-2">
              <div className="col-6">
                <label className="form-label text-muted small">Capacité Max</label>
                <input type="number" className="form-control form-control-dark" min="1"
                  value={form.capaciteMax} onChange={e => setForm({...form, capaciteMax: parseInt(e.target.value)})} />
              </div>
              <div className="col-6">
                <label className="form-label text-muted small">Salle</label>
                <input type="text" className="form-control form-control-dark" placeholder="Ex: Salle A"
                  value={form.salle} onChange={e => setForm({...form, salle: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="form-label text-muted small">Couleur</label>
              <div className="d-flex gap-2 flex-wrap mt-1">
                {COULEURS.map(c => (
                  <div key={c} onClick={() => setForm({...form, couleur: c})}
                    style={{
                      width: '30px', height: '30px', borderRadius: '50%', backgroundColor: c, cursor: 'pointer',
                      border: form.couleur === c ? '3px solid white' : '2px solid transparent',
                      transform: form.couleur === c ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="d-flex flex-column gap-2 mt-4">
              <button type="submit" className="btn btn-gold w-100 py-2">
                {editingCourse ? '💾 Enregistrer les modifications' : '➕ Créer le Cours'}
              </button>
              {editingCourse && (
                <button type="button" className="btn btn-outline-info w-100" onClick={handleDuplicate}>
                  👯 Dupliquer ce cours
                </button>
              )}
              {editingCourse && (
                <button type="button" className="btn btn-outline-danger w-100" onClick={() => handleDelete(editingCourse.id)}>
                  🗑️ Supprimer
                </button>
              )}
              <button type="button" className="btn btn-outline-light w-100" onClick={resetForm}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* PLANNING HEBDOMADAIRE */}
      <div className="card-premium p-4">
        <h5 className="text-gold mb-4">🗓️ Emploi du Temps Hebdomadaire</h5>
        <div className="table-responsive">
          <table className="table table-dark table-bordered mb-0" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                {JOURS.map(j => (
                  <th key={j} className="text-center text-gold bg-transparent py-3" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    {j.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {JOURS.map(jour => (
                  <td 
                    key={jour} 
                    className={`p-2 align-top drag-column ${dragOverDay === jour ? 'drag-over' : ''}`} 
                    style={{ minHeight: '200px' }}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, jour)}
                    onDrop={(e) => handleDrop(e, jour)}
                  >
                    {(planning[jour] || []).length === 0 ? (
                      <div className="text-muted text-center small py-4" style={{ opacity: 0.5 }}>—</div>
                    ) : (
                      (planning[jour] || []).map(course => (
                        <div 
                          key={course.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, course.id)}
                          onDragEnd={handleDragEnd}
                          className={`mb-2 p-2 rounded position-relative drag-card ${draggingId === course.id ? 'dragging' : ''}`}
                          style={{
                            backgroundColor: course.couleur + '20', 
                            borderLeft: `3px solid ${course.couleur}`,
                            fontSize: '12px', 
                            transition: 'all 0.2s'
                          }}
                        >
                          <div className="fw-bold" style={{ color: course.couleur }}>{course.nom}</div>
                          <div className="text-muted" style={{ fontSize: '10px' }}>
                            {course.heureDebut?.slice(0, 5)} - {course.heureFin?.slice(0, 5)}
                          </div>
                          <div className="text-muted" style={{ fontSize: '10px' }}>
                            🏋️ {course.coach} | 👥 Max {course.capaciteMax}
                          </div>
                          {course.salle && <div className="text-muted" style={{ fontSize: '10px' }}>📍 {course.salle}</div>}
                          <div className="d-flex gap-1 mt-1">
                            <button className="btn btn-sm p-0 px-1" style={{ fontSize: '10px', color: course.couleur }}
                              onClick={() => handleEdit(course)}>✏️</button>
                            <button className="btn btn-sm p-0 px-1 text-danger" style={{ fontSize: '10px' }}
                              onClick={() => handleDelete(course.id)}>🗑️</button>
                          </div>
                        </div>
                      ))
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* RÉSUMÉ */}
      <div className="row mt-4">
        <div className="col-md-4">
          <div className="card-premium p-4 text-center">
            <h1 className="text-gold fw-bold">{courses.length}</h1>
            <p className="text-muted mb-0">Cours Actifs</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card-premium p-4 text-center">
            <h1 className="text-gold fw-bold">{[...new Set(courses.map(c => c.coach))].length}</h1>
            <p className="text-muted mb-0">Coachs</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card-premium p-4 text-center">
            <h1 className="text-gold fw-bold">{courses.reduce((sum, c) => sum + (c.capaciteMax || 0), 0)}</h1>
            <p className="text-muted mb-0">Places Totales / Semaine</p>
          </div>
        </div>
      </div>
    </ErpLayout>
  );
}
