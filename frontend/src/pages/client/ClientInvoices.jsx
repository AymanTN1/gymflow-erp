import { apiFetch } from '../../utils/api';
import { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';

const CLIENT_ID = 1; // Simulé pour l'instant

export default function ClientInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch(`http://localhost:8080/api/client/${CLIENT_ID}/invoices`).then(r => r.json()),
      apiFetch(`http://localhost:8080/api/client/${CLIENT_ID}/profile`).then(r => r.json())
    ]).then(([inv, prof]) => {
      setInvoices(inv);
      setProfile(prof);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleDownloadPdf = (membershipId, numero) => {
    const url = `http://localhost:8080/api/client/${CLIENT_ID}/invoices/${membershipId}/pdf`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${numero}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const totalDepense = invoices.reduce((sum, inv) => sum + (inv.prixPaye || 0), 0);

  if (loading) {
    return (
      <ErpLayout role="CLIENT">
        <div className="text-center py-5 text-muted">Chargement...</div>
      </ErpLayout>
    );
  }

  return (
    <ErpLayout role="CLIENT">
      <h2 className="fw-bold mb-4">📄 Mes Factures</h2>

      {/* Résumé */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card-premium p-3 text-center">
            <h3 className="text-gold fw-bold mb-0">{invoices.length}</h3>
            <small className="text-muted">Factures</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card-premium p-3 text-center">
            <h3 className="text-gold fw-bold mb-0">{totalDepense.toFixed(0)} DH</h3>
            <small className="text-muted">Total Dépensé</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card-premium p-3 text-center">
            <h3 className="fw-bold mb-0" style={{ color: profile?.abonnementActif ? '#28a745' : '#dc3545' }}>
              {profile?.abonnementActif ? '✓ Actif' : '✕ Expiré'}
            </h3>
            <small className="text-muted">Abonnement</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card-premium p-3 text-center">
            <h3 className="text-white fw-bold mb-0">
              {profile?.abonnementActif ? profile.abonnementActif.typeAbonnement : '—'}
            </h3>
            <small className="text-muted">Formule Actuelle</small>
          </div>
        </div>
      </div>

      {/* Bannière de renouvellement si abonnement expiré */}
      {profile && !profile.abonnementActif && (
        <div className="alert mb-4 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 p-4" 
          style={{ backgroundColor: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.3)', borderRadius: '12px' }}>
          <div>
            <h6 className="fw-bold text-danger mb-1">⚠️ Votre abonnement a expiré</h6>
            <p className="text-muted small mb-0">Renouvelez dès maintenant pour continuer à profiter de la salle.</p>
          </div>
          <a href="/client/payment" className="btn btn-gold px-4 py-2 fw-bold flex-shrink-0" style={{ borderRadius: '10px' }}>
            💳 Renouveler
          </a>
        </div>
      )}

      {/* Liste des factures */}
      {invoices.length === 0 ? (
        <div className="card-premium p-5 text-center">
          <span className="fs-1 d-block mb-3">📭</span>
          <p className="text-muted mb-0">Aucune facture trouvée.<br/>Vos factures apparaîtront ici après chaque paiement.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {invoices.map((inv, index) => (
            <div key={inv.id} className="card-premium p-0 overflow-hidden">
              <div className="d-flex">
                {/* Barre latérale colorée */}
                <div style={{
                  width: '5px', flexShrink: 0,
                  backgroundColor: inv.statut === 'ACTIF' ? '#28a745' : '#6c757d'
                }} />
                
                <div className="p-3 p-md-4 flex-grow-1">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
                    {/* Infos facture */}
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-dark border border-warning border-opacity-50 px-2">
                          {inv.numero}
                        </span>
                        <span className={`badge ${inv.statut === 'ACTIF' ? 'bg-success' : 'bg-secondary'}`}>
                          {inv.statut === 'ACTIF' ? '🟢 En cours' : '⚪ Terminé'}
                        </span>
                        {index === 0 && <span className="badge bg-gold text-dark">Dernière</span>}
                      </div>
                      <h5 className="fw-bold mb-1">Abonnement {inv.typeAbonnement}</h5>
                      <div className="d-flex flex-wrap gap-3 text-muted small">
                        <span>📅 Début : {formatDate(inv.dateDebut)}</span>
                        <span>📅 Fin : {formatDate(inv.dateFin)}</span>
                      </div>
                    </div>
                    
                    {/* Prix + Bouton */}
                    <div className="d-flex flex-column align-items-end gap-2">
                      <div className="text-gold fw-bold fs-4">{inv.prixPaye?.toFixed(2)} DH</div>
                      <button
                        className="btn btn-outline-light btn-sm d-flex align-items-center gap-2 px-3"
                        onClick={() => handleDownloadPdf(inv.id, inv.numero)}
                      >
                        <span>📥</span> Télécharger PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note légale */}
      <div className="text-center mt-4 p-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
        <p className="text-muted small mb-0">
          💡 Ces factures sont générées automatiquement par GymFlow ERP.<br/>
          Elles tiennent lieu de justificatif de paiement.
        </p>
      </div>
    </ErpLayout>
  );
}
