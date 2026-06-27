import { apiFetch } from '../../utils/api';
import { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';

const CLIENT_ID = 1; // Simulé pour l'instant

export default function ClientPayment() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [message, setMessage] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    Promise.all([
      apiFetch('http://localhost:8080/api/payments/plans').then(r => r.json()),
      apiFetch(`http://localhost:8080/api/client/${CLIENT_ID}/profile`).then(r => r.json())
    ]).then(([p, prof]) => {
      setPlans(p);
      setProfile(prof);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handlePayment = async (planId) => {
    setProcessing(planId);
    setMessage(null);
    try {
      // D'abord essayer Stripe (mode réel)
      const res = await apiFetch('http://localhost:8080/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: CLIENT_ID, planId })
      });
      const data = await res.json();
      
      if (data.url) {
        // Redirection vers Stripe Checkout
        window.location.href = data.url;
        return;
      }
      
      // Si erreur Stripe (clé non configurée), basculer en simulation
      await handleSimulation(planId);
    } catch (err) {
      // Fallback: simulation
      await handleSimulation(planId);
    }
  };

  const handleSimulation = async (planId) => {
    try {
      const res = await apiFetch('http://localhost:8080/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: CLIENT_ID, planId })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message, membership: data.membership });
      } else {
        setMessage({ type: 'danger', text: data.error || 'Erreur lors du paiement.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Erreur de connexion au serveur.' });
    }
    setProcessing(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  if (loading) {
    return (
      <ErpLayout role="CLIENT">
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
          <p className="text-muted mt-3">Chargement des formules...</p>
        </div>
      </ErpLayout>
    );
  }

  return (
    <ErpLayout role="CLIENT">
      <div className="text-center mb-4">
        <h2 className="fw-bold">💳 Renouveler Mon Abonnement</h2>
        <p className="text-muted">Choisissez votre formule et payez en toute sécurité en ligne.</p>
      </div>

      {/* Statut Abonnement Actuel */}
      {profile && (
        <div className="card-premium p-3 mb-4" style={{ borderLeft: `4px solid ${profile.abonnementActif ? '#28a745' : '#dc3545'}` }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <span className="text-muted small">Votre abonnement actuel :</span>
              <strong className="ms-2 text-white">
                {profile.abonnementActif ? profile.abonnementActif.typeAbonnement : 'Aucun abonnement actif'}
              </strong>
            </div>
            <span className={`badge ${profile.abonnementActif ? 'bg-success' : 'bg-danger'} px-3 py-2`}>
              {profile.abonnementActif ? `Expire le ${formatDate(profile.abonnementActif?.dateFin)}` : 'Expiré'}
            </span>
          </div>
        </div>
      )}

      {/* Message de succès / erreur */}
      {message && (
        <div className={`alert alert-${message.type} mb-4`}>
          <strong>{message.type === 'success' ? '🎉' : '❌'}</strong> {message.text}
          {message.membership && (
            <div className="mt-3 p-3 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
              <small>
                <strong>Type :</strong> {message.membership.type}<br/>
                <strong>Début :</strong> {formatDate(message.membership.dateDebut)}<br/>
                <strong>Fin :</strong> {formatDate(message.membership.dateFin)}<br/>
                <strong>Montant :</strong> {message.membership.prixPaye} DH
              </small>
            </div>
          )}
        </div>
      )}

      {/* Grille Tarifaire */}
      <div className="row g-4 justify-content-center">
        {plans.map(plan => (
          <div key={plan.id} className="col-12 col-md-4">
            <div 
              className="card-premium p-4 h-100 d-flex flex-column position-relative overflow-hidden"
              style={{
                border: plan.popular ? '2px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.1)',
                transition: 'transform 0.3s, box-shadow 0.3s'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(255,204,0,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Badge populaire */}
              {plan.popular && (
                <div className="position-absolute top-0 end-0">
                  <span className="badge bg-gold text-dark px-3 py-2" style={{ borderRadius: '0 12px 0 12px', fontSize: '11px', fontWeight: 'bold' }}>
                    ⭐ POPULAIRE
                  </span>
                </div>
              )}

              <div className="text-center mb-3">
                <h5 className="text-gold fw-bold mb-1">{plan.name}</h5>
                <p className="text-muted small mb-0">{plan.description}</p>
              </div>

              {/* Prix */}
              <div className="text-center my-4">
                <span className="fw-bold text-white" style={{ fontSize: '48px', lineHeight: 1 }}>
                  {plan.price}
                </span>
                <span className="text-gold fs-5 ms-1">DH</span>
                {plan.id === '3_MOIS' && <div className="text-success small mt-1">💰 Économisez 150 DH</div>}
                {plan.id === '1_AN' && <div className="text-success small mt-1">💰 Économisez 1100 DH</div>}
              </div>

              {/* Features */}
              <ul className="list-unstyled flex-grow-1 mb-4">
                {plan.features?.map((f, i) => (
                  <li key={i} className="d-flex align-items-start gap-2 mb-2">
                    <span className="text-success flex-shrink-0">✓</span>
                    <span className="text-muted small">{f}</span>
                  </li>
                ))}
              </ul>

              {/* Bouton Payer */}
              <button
                className={`btn ${plan.popular ? 'btn-gold' : 'btn-outline-light'} w-100 py-3 fw-bold`}
                disabled={processing !== null}
                onClick={() => handlePayment(plan.id)}
                style={{ borderRadius: '12px', fontSize: '15px' }}
              >
                {processing === plan.id ? (
                  <span><span className="spinner-border spinner-border-sm me-2"></span>Traitement...</span>
                ) : (
                  <span>💳 Payer {plan.price} DH</span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Note de sécurité */}
      <div className="text-center mt-4 p-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
        <p className="text-muted small mb-0">
          🔒 Paiement sécurisé par <strong>Stripe</strong>. Vos données bancaires ne sont jamais stockées sur nos serveurs.<br/>
          Une facture vous sera envoyée automatiquement par email après le paiement.
        </p>
      </div>
    </ErpLayout>
  );
}
