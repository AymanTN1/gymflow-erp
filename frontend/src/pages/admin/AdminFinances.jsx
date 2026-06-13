import ErpLayout from '../../components/layout/ErpLayout';

export default function AdminFinances() {
  return (
    <ErpLayout role="ADMIN">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Grand Livre & Finances</h2>
      </div>
      <div className="card card-premium p-5 text-center">
        <h3 className="text-warning mb-3">🚧 Module en construction 🚧</h3>
        <p className="text-muted">Cette section sera connectée au backend pour la gestion comptable avancée lors de la prochaine itération.</p>
      </div>
    </ErpLayout>
  );
}
