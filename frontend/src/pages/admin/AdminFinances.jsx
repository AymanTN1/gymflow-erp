import { useState, useEffect } from 'react';
import ErpLayout from '../../components/layout/ErpLayout';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AdminFinances() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Transaction Form State
  const [txForm, setTxForm] = useState({ type: 'EXPENSE', categorie: 'REDAL', montant: '', description: '' });
  const [txMessage, setTxMessage] = useState('');

  // Payroll Form State
  const [prForm, setPrForm] = useState({ employeId: '', nomEmploye: '', salaireBase: '', typePaiement: 'MENSUEL', cnss: '', prime: '', moisOuSemaine: '' });
  const [prMessage, setPrMessage] = useState('');

  const fetchData = async () => {
    try {
      const [txRes, prRes, usersRes] = await Promise.all([
        fetch('http://localhost:8080/api/finances/transactions'),
        fetch('http://localhost:8080/api/finances/payrolls'),
        fetch('http://localhost:8080/api/users')
      ]);
      if (txRes.ok) setTransactions(await txRes.json());
      if (prRes.ok) setPayrolls(await prRes.json());
      if (usersRes.ok) setUsers((await usersRes.json()).filter(u => u.role !== 'CLIENT'));
    } catch (error) {
      console.error("Erreur de chargement", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Submit Transaction
  const handleTxSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8080/api/finances/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...txForm, montant: parseFloat(txForm.montant) })
      });
      if (res.ok) {
        setTxMessage('Opération enregistrée !');
        setTxForm({ ...txForm, montant: '', description: '' });
        fetchData();
      }
    } catch (error) { setTxMessage('Erreur de connexion'); }
  };

  // Submit Payroll
  const handlePrSubmit = async (e) => {
    e.preventDefault();
    const base = parseFloat(prForm.salaireBase) || 0;
    const prime = parseFloat(prForm.prime) || 0;
    const cnss = parseFloat(prForm.cnss) || 0;
    const total = base + prime - cnss; // Total net
    
    // Auto-fill employee name based on ID
    const selectedUser = users.find(u => u.id.toString() === prForm.employeId);
    
    try {
      const res = await fetch('http://localhost:8080/api/finances/payrolls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...prForm, 
          nomEmploye: selectedUser ? selectedUser.nom : 'Employé inconnu',
          salaireBase: base, prime, cnss, totalPaye: total 
        })
      });
      if (res.ok) {
        setPrMessage(`Paie générée ! Total Net : ${total} DH`);
        setPrForm({ ...prForm, salaireBase: '', prime: '', cnss: '', moisOuSemaine: '' });
        fetchData();
      }
    } catch (error) { setPrMessage('Erreur de connexion'); }
  };

  // Calculations for Dashboard
  const totalIncomes = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.montant, 0);
  const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.montant, 0);
  const netProfit = totalIncomes - totalExpenses;

  // PieChart Data (Expenses breakdown)
  const expensesByCategory = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => {
    acc[t.categorie] = (acc[t.categorie] || 0) + t.montant;
    return acc;
  }, {});
  
  const pieData = Object.keys(expensesByCategory).map(cat => ({
    name: cat,
    value: expensesByCategory[cat]
  }));

  const COLORS = ['#FFCC00', '#ff4d4d', '#3399ff', '#00cc66', '#ff9900', '#cc33ff'];

  return (
    <ErpLayout role="ADMIN">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Grand Livre & Finances</h2>
      </div>

      {/* Tabs Navigation */}
      <ul className="nav nav-tabs border-warning border-opacity-25 mb-4">
        <li className="nav-item">
          <button className={`nav-link text-white ${activeTab === 'dashboard' ? 'active bg-warning text-dark fw-bold border-warning' : 'border-0'}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard Net</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link text-white ${activeTab === 'charges' ? 'active bg-warning text-dark fw-bold border-warning' : 'border-0'}`} onClick={() => setActiveTab('charges')}>💸 Opérations & Charges</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link text-white ${activeTab === 'paie' ? 'active bg-warning text-dark fw-bold border-warning' : 'border-0'}`} onClick={() => setActiveTab('paie')}>👥 Gestion de la Paie</button>
        </li>
      </ul>

      {/* Tab Content: Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="row g-4">
          <div className="col-12 col-lg-8">
             <div className="card card-premium p-4 h-100">
                <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Répartition des Charges</h4>
                {pieData.length > 0 ? (
                  <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(18,18,18,0.9)', borderRadius: '8px', border: '1px solid #FFCC00' }} itemStyle={{ fontWeight: 'bold', color: '#fff' }} />
                        <Legend wrapperStyle={{ color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center text-muted p-5">Aucune charge enregistrée pour générer le graphique.</div>
                )}
             </div>
          </div>
          <div className="col-12 col-lg-4 d-flex flex-column gap-4">
            <div className="card card-premium p-4 text-center border-success flex-grow-1 d-flex flex-column justify-content-center">
              <h5 className="text-success fw-bold">Total Entrées</h5>
              <h2 className="text-white">{totalIncomes.toFixed(2)} DH</h2>
            </div>
            <div className="card card-premium p-4 text-center border-danger flex-grow-1 d-flex flex-column justify-content-center">
              <h5 className="text-danger fw-bold">Total Sorties (Charges)</h5>
              <h2 className="text-white">{totalExpenses.toFixed(2)} DH</h2>
            </div>
            <div className="card card-premium p-4 text-center border-warning flex-grow-1 d-flex flex-column justify-content-center" style={{ backgroundColor: 'rgba(255, 204, 0, 0.05)' }}>
              <h5 className="text-gold fw-bold">Bénéfice Net Réel</h5>
              <h2 className={netProfit >= 0 ? "text-success fw-bold" : "text-danger fw-bold"}>
                {netProfit.toFixed(2)} DH
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Charges */}
      {activeTab === 'charges' && (
        <div className="row g-4">
          <div className="col-12 col-lg-4">
            <div className="card card-premium p-4">
              <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Ajouter une Opération</h4>
              {txMessage && <div className="alert alert-info py-2">{txMessage}</div>}
              <form onSubmit={handleTxSubmit} className="d-flex flex-column gap-3">
                <div>
                  <label className="small text-muted mb-1">Type</label>
                  <select className="form-select form-control-dark" value={txForm.type} onChange={e => setTxForm({...txForm, type: e.target.value})}>
                    <option value="EXPENSE">Sortie (Dépense)</option>
                    <option value="INCOME">Entrée (Revenu)</option>
                  </select>
                </div>
                <div>
                  <label className="small text-muted mb-1">Catégorie</label>
                  <select className="form-select form-control-dark" value={txForm.categorie} onChange={e => setTxForm({...txForm, categorie: e.target.value})}>
                    <option value="REDAL">REDAL (Eau/Elec)</option>
                    <option value="GAZ">Bouteilles de Gaz</option>
                    <option value="MAINTENANCE">Réparation & Maintenance</option>
                    <option value="MATERIEL">Achat Équipement</option>
                    <option value="AUTRE">Autre Charge</option>
                    <option value="ABONNEMENT">Revenu Abonnement</option>
                  </select>
                </div>
                <div>
                  <label className="small text-muted mb-1">Montant (DH)</label>
                  <input type="number" step="0.01" className="form-control form-control-dark" required value={txForm.montant} onChange={e => setTxForm({...txForm, montant: e.target.value})} />
                </div>
                <div>
                  <label className="small text-muted mb-1">Description</label>
                  <input type="text" className="form-control form-control-dark" placeholder="ex: Réparation tapis R2" required value={txForm.description} onChange={e => setTxForm({...txForm, description: e.target.value})} />
                </div>
                <button type="submit" className="btn btn-gold w-100 fw-bold mt-2">Enregistrer l'opération</button>
              </form>
            </div>
          </div>
          <div className="col-12 col-lg-8">
            <div className="card card-premium p-4 h-100">
              <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Historique des Transactions</h4>
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                  <thead>
                    <tr>
                      <th className="bg-transparent text-muted">Date</th>
                      <th className="bg-transparent text-muted">Catégorie</th>
                      <th className="bg-transparent text-muted">Description</th>
                      <th className="bg-transparent text-muted text-end">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => (
                      <tr key={t.id}>
                        <td className="bg-transparent">{new Date(t.dateTransaction).toLocaleDateString()}</td>
                        <td className="bg-transparent"><span className="badge bg-secondary">{t.categorie}</span></td>
                        <td className="bg-transparent">{t.description}</td>
                        <td className={`bg-transparent fw-bold text-end ${t.type === 'INCOME' ? 'text-success' : 'text-danger'}`}>
                          {t.type === 'INCOME' ? '+' : '-'}{t.montant.toFixed(2)} DH
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Paie */}
      {activeTab === 'paie' && (
        <div className="row g-4">
          <div className="col-12 col-lg-5">
            <div className="card card-premium p-4">
              <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Générer une Fiche de Paie</h4>
              {prMessage && <div className="alert alert-info py-2">{prMessage}</div>}
              <form onSubmit={handlePrSubmit} className="d-flex flex-column gap-3">
                <div>
                  <label className="small text-muted mb-1">Employé</label>
                  <select className="form-select form-control-dark" required value={prForm.employeId} onChange={e => setPrForm({...prForm, employeId: e.target.value})}>
                    <option value="">Sélectionner un collaborateur...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.nom} ({u.role})</option>)}
                  </select>
                </div>
                <div className="row">
                  <div className="col-6">
                    <label className="small text-muted mb-1">Période (Mois/Semaine)</label>
                    <input type="text" className="form-control form-control-dark" placeholder="ex: Juin 2026" required value={prForm.moisOuSemaine} onChange={e => setPrForm({...prForm, moisOuSemaine: e.target.value})} />
                  </div>
                  <div className="col-6">
                    <label className="small text-muted mb-1">Type</label>
                    <select className="form-select form-control-dark" value={prForm.typePaiement} onChange={e => setPrForm({...prForm, typePaiement: e.target.value})}>
                      <option value="MENSUEL">Mensuel</option>
                      <option value="HEBDO">Hebdomadaire</option>
                    </select>
                  </div>
                </div>
                <div className="row">
                  <div className="col-4">
                    <label className="small text-muted mb-1">Salaire Base</label>
                    <input type="number" step="0.01" className="form-control form-control-dark" required value={prForm.salaireBase} onChange={e => setPrForm({...prForm, salaireBase: e.target.value})} />
                  </div>
                  <div className="col-4">
                    <label className="small text-muted mb-1">CNSS (-)</label>
                    <input type="number" step="0.01" className="form-control form-control-dark border-danger" placeholder="Retenue" value={prForm.cnss} onChange={e => setPrForm({...prForm, cnss: e.target.value})} />
                  </div>
                  <div className="col-4">
                    <label className="small text-muted mb-1">Primes (+)</label>
                    <input type="number" step="0.01" className="form-control form-control-dark border-success" placeholder="Bonus" value={prForm.prime} onChange={e => setPrForm({...prForm, prime: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="btn btn-gold w-100 fw-bold mt-2">Verser le salaire</button>
              </form>
            </div>
          </div>
          <div className="col-12 col-lg-7">
            <div className="card card-premium p-4 h-100">
              <h4 className="fw-bold border-bottom border-warning border-opacity-25 pb-2 mb-4">Historique des Paies</h4>
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                  <thead>
                    <tr>
                      <th className="bg-transparent text-muted">Employé</th>
                      <th className="bg-transparent text-muted">Période</th>
                      <th className="bg-transparent text-muted">Base / Prime / CNSS</th>
                      <th className="bg-transparent text-muted text-end">Total Versé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrolls.map(p => (
                      <tr key={p.id}>
                        <td className="bg-transparent fw-bold">{p.nomEmploye}</td>
                        <td className="bg-transparent">{p.moisOuSemaine}</td>
                        <td className="bg-transparent small">
                          <span className="text-light">{p.salaireBase}</span> / <span className="text-success">+{p.prime}</span> / <span className="text-danger">-{p.cnss}</span>
                        </td>
                        <td className="bg-transparent fw-bold text-end text-gold">{p.totalPaye.toFixed(2)} DH</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}
