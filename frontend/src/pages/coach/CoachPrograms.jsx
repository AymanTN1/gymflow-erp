import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import ErpLayout from '../../components/layout/ErpLayout';
import { useAuth } from '../../context/AuthContext';

export default function CoachPrograms() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [programs, setPrograms] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    titre: '',
    description: '',
    contenuJSON: '[]' // Sera édité via une interface simplifiée
  });
  const [exercises, setExercises] = useState([]);
  const [newExercise, setNewExercise] = useState({ nom: '', series: '', reps: '', repos: '' });

  useEffect(() => {
    fetchClients();
    if (user?.id) fetchPrograms();
  }, [user]);

  const fetchClients = async () => {
    try {
      const res = await apiFetch('http://localhost:8080/api/reception/clients');
      if (res.ok) setClients(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchPrograms = async () => {
    try {
      const res = await apiFetch(`http://localhost:8080/api/programs/coach/${user.id}`);
      if (res.ok) setPrograms(await res.json());
    } catch (err) { console.error(err); }
  };

  const addExercise = () => {
    if (!newExercise.nom) return;
    setExercises([...exercises, newExercise]);
    setNewExercise({ nom: '', series: '', reps: '', repos: '' });
  };

  const removeExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientId) return alert("Sélectionnez un client");
    
    try {
      const payload = {
        coachId: user.id,
        clientId: parseInt(formData.clientId),
        titre: formData.titre,
        description: formData.description,
        contenuJSON: JSON.stringify(exercises)
      };

      const res = await apiFetch('http://localhost:8080/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ clientId: '', titre: '', description: '', contenuJSON: '[]' });
        setExercises([]);
        fetchPrograms();
      }
    } catch (err) { console.error(err); }
  };

  const deleteProgram = async (id) => {
    if(!window.confirm("Supprimer ce programme ?")) return;
    try {
      await apiFetch(`http://localhost:8080/api/programs/${id}`, { method: 'DELETE' });
      fetchPrograms();
    } catch (err) { console.error(err); }
  };

  return (
    <ErpLayout role="COACH">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">📋 Programmes d'Entraînement</h2>
        <button className="btn btn-gold fw-bold" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Nouveau Programme'}
        </button>
      </div>

      {showForm && (
        <div className="card-premium p-4 mb-4 border-warning border-opacity-50">
          <h4 className="text-gold mb-3">Créer un Programme</h4>
          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label text-muted">Client</label>
                <select className="form-select form-control-dark" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} required>
                  <option value="">Sélectionner un client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nomComplet}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label text-muted">Titre du Programme</label>
                <input type="text" className="form-control form-control-dark" required placeholder="Ex: Prise de masse sur 4 jours"
                  value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})} />
              </div>
              <div className="col-md-4">
                <label className="form-label text-muted">Description (Objectif)</label>
                <input type="text" className="form-control form-control-dark" placeholder="Ex: Focus haut du corps"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
            </div>

            {/* Builder d'exercices */}
            <div className="p-3 mb-3 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h5 className="mb-3 fw-bold">Exercices du Programme</h5>
              
              <div className="d-flex gap-2 mb-3">
                <input type="text" className="form-control form-control-sm form-control-dark" placeholder="Nom de l'exercice (Ex: Développé Couché)" value={newExercise.nom} onChange={e => setNewExercise({...newExercise, nom: e.target.value})} />
                <input type="text" className="form-control form-control-sm form-control-dark" placeholder="Séries (Ex: 4)" style={{ width: '100px' }} value={newExercise.series} onChange={e => setNewExercise({...newExercise, series: e.target.value})} />
                <input type="text" className="form-control form-control-sm form-control-dark" placeholder="Reps (Ex: 10-12)" style={{ width: '120px' }} value={newExercise.reps} onChange={e => setNewExercise({...newExercise, reps: e.target.value})} />
                <input type="text" className="form-control form-control-sm form-control-dark" placeholder="Repos (Ex: 90s)" style={{ width: '120px' }} value={newExercise.repos} onChange={e => setNewExercise({...newExercise, repos: e.target.value})} />
                <button type="button" className="btn btn-sm btn-outline-warning" onClick={addExercise}>Ajouter</button>
              </div>

              {exercises.length > 0 && (
                <ul className="list-group list-group-flush bg-transparent">
                  {exercises.map((ex, i) => (
                    <li key={i} className="list-group-item bg-transparent text-white border-secondary d-flex justify-content-between align-items-center px-0">
                      <div>
                        <strong className="text-gold">{ex.nom}</strong> — {ex.series} Séries x {ex.reps} Reps (Repos: {ex.repos})
                      </div>
                      <button type="button" className="btn btn-sm btn-danger py-0 px-2" onClick={() => removeExercise(i)}>✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button type="submit" className="btn btn-gold w-100 fw-bold">Enregistrer le Programme et Assigner</button>
          </form>
        </div>
      )}

      {/* Liste des programmes */}
      <div className="row g-4">
        {programs.length === 0 ? (
          <div className="col-12 text-center py-5 text-muted">
            <span className="fs-1 d-block mb-3">🏋️‍♂️</span>
            <p>Vous n'avez créé aucun programme pour l'instant.</p>
          </div>
        ) : (
          programs.map(p => {
            const client = clients.find(c => c.id === p.clientId);
            const clientName = client ? client.nomComplet : `Client #${p.clientId}`;
            let parsedExercises = [];
            try { parsedExercises = JSON.parse(p.contenuJSON); } catch(e){}

            return (
              <div key={p.id} className="col-md-6 col-lg-4">
                <div className="card-premium p-4 h-100 position-relative">
                  <button className="btn btn-sm btn-danger position-absolute top-0 end-0 m-3 py-0 px-2" onClick={() => deleteProgram(p.id)}>✕</button>
                  <span className="badge bg-warning text-dark mb-2">Pour {clientName}</span>
                  <h5 className="fw-bold mb-1">{p.titre}</h5>
                  <p className="text-muted small mb-3">{p.description || 'Aucune description'}</p>
                  
                  <div className="bg-dark p-2 rounded small overflow-auto" style={{ maxHeight: '150px' }}>
                    {parsedExercises.map((ex, i) => (
                      <div key={i} className="mb-1 border-bottom border-secondary pb-1">
                        <span className="text-gold fw-bold">{ex.nom}</span> <br/>
                        <span className="text-muted">{ex.series}x{ex.reps} - ⏱️ {ex.repos}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 text-end text-muted" style={{ fontSize: '10px' }}>
                    Créé le {new Date(p.dateCreation).toLocaleDateString()}
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
