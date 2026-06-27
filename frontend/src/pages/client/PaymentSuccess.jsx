import { apiFetch } from '../../utils/api';
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ErpLayout from '../../components/layout/ErpLayout';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [membership, setMembership] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Confirmer le paiement avec le backend
      apiFetch('http://localhost:8080/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setStatus('success');
            setMembership(data.membership);
          } else {
            setStatus('error');
          }
        })
        .catch(() => setStatus('error'));
    } else {
      // Pas de sessionId = simulation réussie, afficher le succès directement
      setStatus('success');
    }
  }, [sessionId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
    <ErpLayout role="CLIENT">
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="card-premium p-5 text-center" style={{ maxWidth: '500px', width: '100%' }}>
          
          {status === 'loading' && (
            <>
              <div className="spinner-border text-warning mb-4" style={{ width: '3rem', height: '3rem' }} role="status"></div>
              <h4 className="fw-bold text-white">Vérification du paiement...</h4>
              <p className="text-muted">Merci de patienter un instant.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-4" style={{ fontSize: '72px' }}>🎉</div>
              <h3 className="fw-bold text-success mb-3">Paiement Réussi !</h3>
              <p className="text-muted mb-4">
                Votre abonnement a été activé avec succès. Une facture a été envoyée à votre adresse email.
              </p>
              
              {membership && (
                <div className="p-3 rounded mb-4" style={{ backgroundColor: 'rgba(40,167,69,0.1)', border: '1px solid rgba(40,167,69,0.3)' }}>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Formule</span>
                    <span className="text-white fw-bold">{membership.type}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Début</span>
                    <span className="text-white">{formatDate(membership.dateDebut)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Fin</span>
                    <span className="text-white">{formatDate(membership.dateFin)}</span>
                  </div>
                  <div className="d-flex justify-content-between pt-2 border-top border-secondary">
                    <span className="text-muted small">Montant payé</span>
                    <span className="text-gold fw-bold fs-5">{membership.prixPaye} DH</span>
                  </div>
                </div>
              )}

              <div className="d-flex flex-column gap-2">
                <Link to="/client" className="btn btn-gold py-2 fw-bold">
                  Retour à Mon Espace
                </Link>
                <Link to="/client/invoices" className="btn btn-outline-light btn-sm">
                  📄 Voir mes factures
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-4" style={{ fontSize: '72px' }}>❌</div>
              <h3 className="fw-bold text-danger mb-3">Erreur de Paiement</h3>
              <p className="text-muted mb-4">
                Une erreur est survenue lors de la vérification de votre paiement. Si un montant a été débité, 
                il sera remboursé automatiquement.
              </p>
              <div className="d-flex flex-column gap-2">
                <Link to="/client/payment" className="btn btn-gold py-2 fw-bold">
                  Réessayer
                </Link>
                <Link to="/client" className="btn btn-outline-light btn-sm">
                  Retour à Mon Espace
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </ErpLayout>
  );
}
