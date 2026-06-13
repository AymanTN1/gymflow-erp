import ErpLayout from '../../components/layout/ErpLayout';

export default function AdminCrm() {
  return (
    <ErpLayout role="ADMIN">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Win-Back CRM</h2>
      </div>
      <div className="card card-premium p-5 text-center">
        <h3 className="text-warning mb-3">🚧 Module en construction 🚧</h3>
        <p className="text-muted">La fonctionnalité d'envoi d'emails automatiques pour relancer les clients inactifs arrivera dans une prochaine mise à jour.</p>
      </div>
    </ErpLayout>
  );
}
