import { apiFetch } from '../../utils/api';
import { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';

export default function AdminRh() {
  const [staff, setStaff] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('staff'); // staff, payroll, attendance
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ salaireBase: '', commissionParCours: '' });
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({ nom: '', email: '', motDePasse: '', role: 'COACH' });
  const [photoFile, setPhotoFile] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const fetchAll = async () => {
    try {
      const [sRes, pRes, aRes] = await Promise.all([
        apiFetch('http://localhost:8080/api/rh/staff'),
        apiFetch(`http://localhost:8080/api/rh/payroll?month=${selectedMonth}`),
        apiFetch('http://localhost:8080/api/rh/attendance')
      ]);
      if (sRes.ok) setStaff(await sRes.json());
      if (pRes.ok) setPayroll(await pRes.json());
      if (aRes.ok) setAttendance(await aRes.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [selectedMonth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('http://localhost:8080/api/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const savedUser = await res.json();
        
        // Si une photo de profil a été sélectionnée, l'uploader
        if (photoFile) {
          const fileData = new FormData();
          fileData.append('photo', photoFile);
          
          await fetch(`http://localhost:8080/api/upload/user/${savedUser.id}`, {
            method: 'POST',
            body: fileData
          });
        }

        setMessage('✅ Collaborateur ajouté !');
        setFormData({ nom: '', email: '', motDePasse: '', role: 'COACH' });
        setPhotoFile(null);
        // Réinitialiser le champ file du formulaire
        const fileInput = document.getElementById('photo-input');
        if (fileInput) fileInput.value = '';

        fetchAll();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) { setMessage('❌ Erreur.'); }
  };

  const handleSaveCompensation = async (id) => {
    try {
      await apiFetch(`http://localhost:8080/api/rh/staff/${id}/compensation`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      setEditingId(null);
      fetchAll();
    } catch (err) { console.error(err); }
  };

  const startEdit = (member) => {
    setEditingId(member.id);
    setEditForm({
      salaireBase: member.salaireBase || 0,
      commissionParCours: member.commissionParCours || 0
    });
  };

  const totalPayroll = payroll.reduce((s, p) => s + (p.totalPaie || 0), 0);

  const formatTime = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <ErpLayout role="ADMIN">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">👥 Ressources Humaines</h2>
      </div>

      {/* Onglets */}
      <div className="d-flex gap-2 mb-4 overflow-auto">
        {[
          { key: 'staff', label: '👥 Équipe & Salaires', },
          { key: 'payroll', label: '💰 Paie du Mois', },
          { key: 'attendance', label: '⏰ Pointages', },
        ].map(tab => (
          <button key={tab.key}
            className={`btn ${activeTab === tab.key ? 'btn-gold' : 'btn-outline-light'} flex-shrink-0`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message && <div className="alert alert-info py-2 mb-3">{message}</div>}

      {/* ========== ONGLET ÉQUIPE & SALAIRES ========== */}
      {activeTab === 'staff' && (
        <div className="row g-4">
          {/* Formulaire */}
          <div className="col-12 col-lg-4">
            <div className="card card-premium p-4 h-100">
              <h5 className="text-gold mb-3">➕ Nouveau Collaborateur</h5>
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label text-muted small">Nom Complet</label>
                  <input type="text" className="form-control form-control-dark" required
                    value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} />
                </div>
                <div>
                  <label className="form-label text-muted small">Email</label>
                  <input type="email" className="form-control form-control-dark" required
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="form-label text-muted small">Mot de Passe</label>
                  <input type="password" className="form-control form-control-dark" required
                    value={formData.motDePasse} onChange={e => setFormData({...formData, motDePasse: e.target.value})} />
                </div>
                <div>
                  <label className="form-label text-muted small">Rôle</label>
                  <select className="form-select form-control-dark" value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="COACH">Coach Sportif</option>
                    <option value="RECEPTION">Réceptionniste</option>
                    <option value="SUPER_ADMIN">Administrateur</option>
                  </select>
                </div>
                <div>
                  <label className="form-label text-muted small">Photo de Profil (Optionnelle)</label>
                  <input type="file" id="photo-input" className="form-control form-control-dark" accept="image/*"
                    onChange={e => setPhotoFile(e.target.files[0])} />
                </div>
                <button type="submit" className="btn btn-gold w-100 fw-bold mt-2">Créer le Compte</button>
              </form>
            </div>
          </div>

          {/* Liste du staff avec salaires */}
          <div className="col-12 col-lg-8">
            <div className="card card-premium p-4">
              <h5 className="text-gold mb-3">Équipe Actuelle</h5>
              {loading ? <div className="text-center text-muted py-4">Chargement...</div> : (
                <div className="d-flex flex-column gap-3">
                  {staff.length === 0 ? (
                    <div className="text-center text-muted py-4">Aucun collaborateur.</div>
                  ) : staff.map(m => (
                    <div key={m.id} className="p-3 rounded d-flex flex-column flex-md-row justify-content-between align-items-start gap-3"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div className="d-flex align-items-center gap-3">
                        {m.photoUrl ? (
                          <img src={`http://localhost:8080${m.photoUrl}`} alt={m.nom} className="rounded-circle border border-warning" style={{ width: '45px', height: '45px', objectFit: 'cover' }} />
                        ) : (
                          <div className="bg-gold rounded-circle d-flex justify-content-center align-items-center fw-bold text-dark" style={{ width: '45px', height: '45px', fontSize: '16px', backgroundColor: 'var(--accent-gold)' }}>
                            {m.nom.substring(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="fw-bold">{m.nom}</span>
                            <span className={`badge ${m.role === 'SUPER_ADMIN' ? 'bg-danger' : m.role === 'COACH' ? 'bg-primary' : 'bg-warning text-dark'}`}>
                              {m.role}
                            </span>
                          </div>
                          <div className="text-muted small">{m.email}</div>
                        </div>
                      </div>

                      {editingId === m.id ? (
                        <div className="d-flex align-items-end gap-2 flex-wrap">
                          <div>
                            <label className="text-muted" style={{ fontSize: '10px' }}>Salaire Base (DH)</label>
                            <input type="number" className="form-control form-control-dark form-control-sm" style={{ width: '110px' }}
                              value={editForm.salaireBase} onChange={e => setEditForm({...editForm, salaireBase: e.target.value})} />
                          </div>
                          {m.role === 'COACH' && (
                            <div>
                              <label className="text-muted" style={{ fontSize: '10px' }}>Commission/Cours (DH)</label>
                              <input type="number" className="form-control form-control-dark form-control-sm" style={{ width: '110px' }}
                                value={editForm.commissionParCours} onChange={e => setEditForm({...editForm, commissionParCours: e.target.value})} />
                            </div>
                          )}
                          <button className="btn btn-sm btn-success" onClick={() => handleSaveCompensation(m.id)}>✓</button>
                          <button className="btn btn-sm btn-outline-light" onClick={() => setEditingId(null)}>✕</button>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center gap-3">
                          <div className="text-end">
                            <div className="text-gold fw-bold">{(m.salaireBase || 0).toFixed(0)} DH</div>
                            <div className="text-muted" style={{ fontSize: '11px' }}>Salaire Base</div>
                          </div>
                          {m.role === 'COACH' && (
                            <div className="text-end">
                              <div className="text-info fw-bold">{(m.commissionParCours || 0).toFixed(0)} DH</div>
                              <div className="text-muted" style={{ fontSize: '11px' }}>/ cours</div>
                            </div>
                          )}
                          <button className="btn btn-sm btn-outline-warning" onClick={() => startEdit(m)}>✏️</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== ONGLET PAIE DU MOIS ========== */}
      {activeTab === 'payroll' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <input type="month" className="form-control form-control-dark" style={{ maxWidth: '200px' }}
              value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
            <div className="card-premium p-3 px-4">
              <span className="text-muted small">Masse Salariale Totale : </span>
              <span className="text-gold fw-bold fs-4">{totalPayroll.toFixed(0)} DH</span>
            </div>
          </div>

          <div className="card-premium p-4">
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead>
                  <tr>
                    <th className="bg-transparent text-muted">Nom</th>
                    <th className="bg-transparent text-muted">Rôle</th>
                    <th className="bg-transparent text-muted text-end">Salaire Base</th>
                    <th className="bg-transparent text-muted text-center">Cours Donnés</th>
                    <th className="bg-transparent text-muted text-end">Commissions</th>
                    <th className="bg-transparent text-muted text-end">Total Paie</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.map(p => (
                    <tr key={p.userId}>
                      <td className="bg-transparent fw-bold">{p.nom}</td>
                      <td className="bg-transparent">
                        <span className={`badge ${p.role === 'COACH' ? 'bg-primary' : p.role === 'SUPER_ADMIN' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                          {p.role}
                        </span>
                      </td>
                      <td className="bg-transparent text-end">{(p.salaireBase || 0).toFixed(0)} DH</td>
                      <td className="bg-transparent text-center">
                        {p.role === 'COACH' ? (
                          <span className="badge bg-info">{p.nbCoursEffectues} cours</span>
                        ) : '—'}
                      </td>
                      <td className="bg-transparent text-end text-info">
                        {p.totalCommission > 0 ? `+${p.totalCommission.toFixed(0)} DH` : '—'}
                      </td>
                      <td className="bg-transparent text-end text-gold fw-bold fs-5">
                        {(p.totalPaie || 0).toFixed(0)} DH
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========== ONGLET POINTAGES ========== */}
      {activeTab === 'attendance' && (
        <div className="card-premium p-4">
          <h5 className="text-gold mb-3">⏰ Historique des Pointages</h5>
          {attendance.length === 0 ? (
            <div className="text-center text-muted py-5">
              <span className="fs-1 d-block mb-2">⏰</span>
              <p>Aucun pointage enregistré.<br/>Le staff peut pointer depuis l'écran Réception.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead>
                  <tr>
                    <th className="bg-transparent text-muted">Nom</th>
                    <th className="bg-transparent text-muted text-center">Type</th>
                    <th className="bg-transparent text-muted text-center">Date</th>
                    <th className="bg-transparent text-muted text-center">Heure</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.slice(0, 50).map(a => (
                    <tr key={a.id}>
                      <td className="bg-transparent fw-bold">{a.userName}</td>
                      <td className="bg-transparent text-center">
                        <span className={`badge ${a.type === 'IN' ? 'bg-success' : 'bg-danger'}`}>
                          {a.type === 'IN' ? '🟢 Arrivée' : '🔴 Départ'}
                        </span>
                      </td>
                      <td className="bg-transparent text-center">{formatDate(a.timestamp)}</td>
                      <td className="bg-transparent text-center fw-bold">{formatTime(a.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </ErpLayout>
  );
}
