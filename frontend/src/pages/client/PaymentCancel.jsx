import { Link } from 'react-router-dom';
import ErpLayout from '../../components/layout/ErpLayout';

export default function PaymentCancel() {
  return (
    <ErpLayout role="CLIENT">
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="card-premium p-5 text-center" style={{ maxWidth: '450px', width: '100%' }}>
          <div className="mb-4" style={{ fontSize: '72px' }}>🔙</div>
          <h3 className="fw-bold text-warning mb-3">Paiement Annulé</h3>
          <p className="text-muted mb-4">
            Votre paiement a été annulé. Aucun montant n'a été débité de votre compte.
            Vous pouvez réessayer à tout moment.
          </p>
          <div className="d-flex flex-column gap-2">
            <Link to="/client/payment" className="btn btn-gold py-2 fw-bold">
              💳 Choisir une formule
            </Link>
            <Link to="/client" className="btn btn-outline-light btn-sm">
              Retour à Mon Espace
            </Link>
          </div>
        </div>
      </div>
    </ErpLayout>
  );
}
